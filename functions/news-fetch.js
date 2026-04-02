// functions/news-fetch.js
// Netlify Function for Manual News Fetching (triggered from UI)

import { createClient } from '@supabase/supabase-js';
import Parser from 'rss-parser';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
    }
});

// RSS Feeds Configuration
const FEED_SOURCES = [
    { url: 'https://cafef.vn/tai-chinh-quoc-te.rss', source: 'CafeF', category: 'Finance' },
    { url: 'https://vietnambiz.vn/tai-chinh.rss', source: 'VietnamBiz', category: 'Finance' },
    { url: 'https://vneconomy.vn/tai-chinh.rss', source: 'VnEconomy', category: 'Finance' },
    {
        url: 'https://news.google.com/rss/search?q=site:brandsvietnam.com&hl=vi&gl=VN&ceid=VN:vi',
        source: 'BrandsVietnam',
        category: 'Marketing'
    },
    {
        url: 'https://news.google.com/rss/search?q="Advertising+Vietnam"&hl=vi&gl=VN&ceid=VN:vi',
        source: 'Advertising Vietnam',
        category: 'Marketing'
    },
    {
        url: 'https://news.google.com/rss/search?q=site:vietcetera.com&hl=vi&gl=VN&ceid=VN:vi',
        source: 'Vietcetera',
        category: 'Lifestyle'
    },
    { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', category: 'Tech' },
    { url: 'https://feeds.feedburner.com/entrepreneur/latest', source: 'Entrepreneur', category: 'Business' }
];

// Fetch with timeout
async function fetchWithTimeout(url, timeoutMs = 5000) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const feed = await parser.parseURL(url);
        clearTimeout(timeout);
        return feed;
    } catch (err) {
        clearTimeout(timeout);
        throw err;
    }
}

async function fetchAndStoreNews(supabase) {
    console.log('📰 Starting News Aggregation (Optimized)...');
    let totalNew = 0;

    // Fetch all feeds in PARALLEL with timeout
    const feedPromises = FEED_SOURCES.map(async (feed) => {
        try {
            console.log(`   Fetching ${feed.source}...`);
            const feedData = await fetchWithTimeout(feed.url, 5000);
            // Only take top 10 items per feed to speed up
            return { feed, items: feedData.items.slice(0, 10) };
        } catch (err) {
            console.error(`❌ Error fetching ${feed.source}:`, err.message);
            return { feed, items: [] };
        }
    });

    const results = await Promise.all(feedPromises);

    // Collect all articles to insert
    const articlesToInsert = [];

    // Get existing links first (batch check)
    const allLinks = results.flatMap(r => r.items.map(item => item.link)).filter(Boolean);

    const { data: existingArticles } = await supabase
        .from('news_articles')
        .select('link')
        .in('link', allLinks.slice(0, 100)); // Limit check to 100

    const existingLinks = new Set(existingArticles?.map(a => a.link) || []);

    // Process results
    for (const { feed, items } of results) {
        for (const item of items) {
            if (!item.link || existingLinks.has(item.link)) continue;

            const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();

            let imageUrl = null;
            if (item.enclosure?.url) {
                imageUrl = item.enclosure.url;
            } else if (item['content:encoded']?.match(/src="([^"]+)"/)) {
                imageUrl = item['content:encoded'].match(/src="([^"]+)"/)[1];
            } else if (item.content?.match(/src="([^"]+)"/)) {
                imageUrl = item.content.match(/src="([^"]+)"/)[1];
            } else if (item.description?.match(/src="([^"]+)"/)) {
                imageUrl = item.description.match(/src="([^"]+)"/)[1];
            }

            articlesToInsert.push({
                title: item.title,
                link: item.link,
                pub_date: pubDate.toISOString(),
                source: feed.source,
                category: feed.category,
                summary: item.contentSnippet || item.content?.substring(0, 200) + '...',
                image_url: imageUrl
            });
        }
    }

    console.log(`📦 Articles to insert: ${articlesToInsert.length}`);

    // Batch insert all at once with upsert to handle duplicates
    if (articlesToInsert.length > 0) {
        // Use upsert to ignore duplicates based on link
        const { data, error } = await supabase
            .from('news_articles')
            .upsert(articlesToInsert, {
                onConflict: 'link',
                ignoreDuplicates: true
            })
            .select();

        if (!error) {
            totalNew = data?.length || articlesToInsert.length;
            console.log(`📥 Inserted ${totalNew} articles`);
        } else {
            console.error('Insert error:', error.message, error.details);

            // Fallback: try inserting one by one
            console.log('🔄 Trying individual inserts...');
            for (const article of articlesToInsert) {
                const { error: singleError } = await supabase
                    .from('news_articles')
                    .insert(article);
                if (!singleError) totalNew++;
            }
        }
    } else {
        console.log('ℹ️ No new articles to insert (all already exist)');
    }

    console.log(`✅ News Aggregation Complete. Added ${totalNew} new articles.`);
    return totalNew;
}

// Handler for manual trigger via API
export const handler = async (event, context) => {
    // CORS headers
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    console.log('📰 Manual news fetch triggered!');

    // Try both VITE_ and non-VITE_ env vars (Netlify functions may not have VITE_ prefix)
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    console.log('🔑 Supabase URL exists:', !!supabaseUrl);
    console.log('🔑 Supabase Key exists:', !!supabaseKey);

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials!');
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({
                success: false,
                error: 'Missing Supabase credentials. Please add SUPABASE_URL and SUPABASE_ANON_KEY to Netlify environment variables.'
            })
        };
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const newArticles = await fetchAndStoreNews(supabase);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                message: `Đã thu thập ${newArticles} bài viết mới!`,
                newArticlesCount: newArticles,
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('News fetch error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
