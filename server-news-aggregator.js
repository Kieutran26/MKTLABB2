import axios from 'axios';
import * as cheerio from 'cheerio';
import Parser from 'rss-parser';

const parser = new Parser({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml'
    }
});

// RSS Feeds Configuration
const FEED_SOURCES = [
    // --- Tai Chinh & Kinh Te Viet Nam ---
    { url: 'https://cafef.vn/tai-chinh-quoc-te.rss', source: 'CafeF', category: 'Finance' },
    { url: 'https://vietnambiz.vn/tai-chinh.rss', source: 'VietnamBiz', category: 'Finance' },
    { url: 'https://vneconomy.vn/tai-chinh.rss', source: 'VnEconomy', category: 'Finance' },

    // --- Marketing & Gioi Tre ---
    // Using Google News RSS for reliable aggregation since direct site feeds are often hidden/broken
    {
        url: 'https://news.google.com/rss/search?q=site:brandsvietnam.com&hl=vi&gl=VN&ceid=VN:vi',
        source: 'BrandsVietnam',
        category: 'Marketing'
    },
    // Advertising Vietnam is handled by custom scraper scrapeAdvertisingVietnam()
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

    // --- International (Tech/Marketing) ---
    { url: 'https://techcrunch.com/feed/', source: 'TechCrunch', category: 'Tech' },
    { url: 'https://feeds.feedburner.com/entrepreneur/latest', source: 'Entrepreneur', category: 'Business' }
];

// Helper function to fetch og:image from article URL
async function fetchOgImage(url) {
    try {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            timeout: 5000 // 5 second timeout to avoid slowing down aggregation
        });
        const $ = cheerio.load(html);
        // Try og:image first, then twitter:image, then first img
        const ogImage = $('meta[property="og:image"]').attr('content')
            || $('meta[name="twitter:image"]').attr('content');
        return ogImage || null;
    } catch (error) {
        // Silently fail - just return null if we can't fetch the image
        return null;
    }
}

export async function fetchAndStoreNews(supabase) {
    console.log('📰 Starting News Aggregation...');
    let totalNew = 0;

    for (const feed of FEED_SOURCES) {
        try {
            console.log(`   Fetching ${feed.source}...`);
            const feedData = await parser.parseURL(feed.url);

            // Process latest 10 items per feed to avoid overload
            // Process latest 50 items per feed (user requested "all", but 50 is a safe practical limit for RSS)
            const items = feedData.items.slice(0, 50);

            for (const item of items) {
                // Basic deduplication check using link
                const { data: existing } = await supabase
                    .from('news_articles')
                    .select('id')
                    .eq('link', item.link)
                    .single();

                if (!existing) {
                    // Normalize data
                    const pubDate = item.pubDate ? new Date(item.pubDate) : new Date();

                    // Simple logic to extract an image if available in content:encoded or similar
                    let imageUrl = null;
                    if (item.enclosure && item.enclosure.url) {
                        imageUrl = item.enclosure.url;
                    } else if (item['content:encoded'] && item['content:encoded'].match(/src="([^"]+)"/)) {
                        imageUrl = item['content:encoded'].match(/src="([^"]+)"/)[1];
                    } else if (item.content && item.content.match(/src="([^"]+)"/)) {
                        imageUrl = item.content.match(/src="([^"]+)"/)[1];
                    } else if (item.description && item.description.match(/src="([^"]+)"/)) {
                        // Google News often puts the image in the description as an <img> tag 
                        imageUrl = item.description.match(/src="([^"]+)"/)[1];
                    }

                    // If no image found in RSS, try fetching og:image from the article page
                    if (!imageUrl && item.link) {
                        imageUrl = await fetchOgImage(item.link);
                    }

                    const { error } = await supabase.from('news_articles').insert({
                        title: item.title,
                        link: item.link,
                        pub_date: pubDate.toISOString(),
                        source: feed.source, // Force the source name from config
                        category: feed.category,
                        summary: item.contentSnippet || item.content?.substring(0, 200) + '...',
                        image_url: imageUrl
                    });
                    if (!error) totalNew++;
                }
            }
        } catch (error) {
            console.error(`❌ Error fetching ${feed.source}:`, error.message);
        }
    }

    console.log(`✅ News Aggregation Complete. Added ${totalNew} new articles.`);
    return totalNew;
}

export function startNewsScheduler(supabase) {
    fetchAndStoreNews(supabase);
    // Update every 3 hours as requested
    const interval = 3 * 60 * 60 * 1000;
    setInterval(() => fetchAndStoreNews(supabase), interval);
    console.log(`🕒 News Scheduler started (running every 3 hours)`);
}
