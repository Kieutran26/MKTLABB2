import axios from 'axios';
import * as cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchOgImage(url) {
    try {
        const { data: html } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        const $ = cheerio.load(html);
        return $('meta[property="og:image"]').attr('content')
            || $('meta[name="twitter:image"]').attr('content')
            || null;
    } catch (error) {
        console.log(`   ⚠️ Failed to fetch: ${url.substring(0, 50)}...`);
        return null;
    }
}

async function backfillImages() {
    console.log('🖼️ Starting Image Backfill...');

    // Get all articles with missing images
    const { data: articles, error } = await supabase
        .from('news_articles')
        .select('id, link, title')
        .is('image_url', null)
        .limit(100); // Process 100 at a time to avoid timeout

    if (error) {
        console.error('Error fetching articles:', error.message);
        return;
    }

    console.log(`Found ${articles.length} articles without images.`);

    let updated = 0;
    for (const article of articles) {
        console.log(`   Processing: ${article.title.substring(0, 40)}...`);
        const imageUrl = await fetchOgImage(article.link);

        if (imageUrl) {
            const { error: updateError } = await supabase
                .from('news_articles')
                .update({ image_url: imageUrl })
                .eq('id', article.id);

            if (!updateError) {
                updated++;
                console.log(`   ✅ Updated!`);
            }
        }
    }

    console.log(`\n✅ Backfill Complete. Updated ${updated}/${articles.length} articles.`);
}

backfillImages();
