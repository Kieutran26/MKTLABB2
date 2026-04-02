import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use service key if available for server-side
const supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

async function checkNews() {
    console.log('--- Checking News Articles ---');

    // 1. Count Total
    const { count, error: countError } = await supabase
        .from('news_articles')
        .select('*', { count: 'exact', head: true });

    if (countError) console.error('Count Error:', countError.message);
    else console.log(`Total Articles in DB: ${count}`);

    // 2. Count by Source
    const { data: sources, error: sourceError } = await supabase
        .from('news_articles')
        .select('source');

    if (sources) {
        const counts = {};
        sources.forEach(s => { counts[s.source] = (counts[s.source] || 0) + 1; });
        console.log('Articles by Source:', counts);
    }

    // 3. List latest 5 from Advertising Vietnam
    const { data: ads, error: adsError } = await supabase
        .from('news_articles')
        .select('title, pub_date')
        .eq('source', 'Advertising Vietnam')
        .order('pub_date', { ascending: false })
        .limit(5);

    if (adsError) console.error('Error fetching Ads Vietnam:', adsError.message);
    else {
        console.log('\nLatest Advertising Vietnam Articles:');
        ads.forEach(a => console.log(`- [${new Date(a.pub_date).toLocaleDateString()}] ${a.title}`));
    }
}

checkNews();
