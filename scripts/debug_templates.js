
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local
try {
    const envPath = path.resolve(__dirname, '../.env.local');
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
} catch (e) {
    console.error('Error loading .env.local', e);
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function dumpDesigns() {
    const { data: designs, error } = await supabase
        .from('email_designs')
        .select('*');

    if (error) {
        console.error("Error:", error);
        return;
    }

    // Simplify output
    const simplified = designs.map(d => ({
        id: d.id,
        name: d.name,
        updated_at: d.updated_at,
        first_block: d.doc?.blocks?.[0]?.content?.substring(0, 50) || "N/A",
        block_count: d.doc?.blocks?.length || 0,
        doc_sample: JSON.stringify(d.doc).substring(0, 100)
    }));

    const { data: campaigns } = await supabase
        .from('email_campaigns')
        .select('id, name, template_id');

    // Write to file instead of console log to avoid truncation
    const output = {
        designs: simplified,
        campaigns: campaigns
    };
    fs.writeFileSync('debug_output.json', JSON.stringify(output, null, 2));
    console.log("Done writing to debug_output.json");
}

dumpDesigns();
