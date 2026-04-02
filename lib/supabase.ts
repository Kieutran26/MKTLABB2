import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Supabase Configuration — Dashboard: Project Settings → API
const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Valid placeholders so createClient never throws; real data needs .env.local
const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_ANON_KEY =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDE3NjkyMDAsImV4cCI6MTk1NzM0NTYwMH0.EcM8WzmdKYTQG7oUxY_NoA';

if (!isSupabaseConfigured) {
    console.warn(
        '⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local (see .env.example).'
    );
}

export const supabase: SupabaseClient = createClient(
    isSupabaseConfigured ? supabaseUrl : PLACEHOLDER_URL,
    isSupabaseConfigured ? supabaseAnonKey : PLACEHOLDER_ANON_KEY
);

// Helper function to check connection
export const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
        const { error } = await supabase.from('brands').select('count').limit(1);
        return !error;
    } catch {
        return false;
    }
};

// Generic CRUD helpers
export const dbHelpers = {
    // Insert a record
    async insert<T extends Record<string, any>>(table: string, data: T): Promise<T | null> {
        const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error(`Insert error in ${table}:`, error);
            return null;
        }
        return result;
    },

    // Update a record by ID
    async update<T extends Record<string, any>>(table: string, id: string, data: Partial<T>): Promise<T | null> {
        const { data: result, error } = await supabase
            .from(table)
            .update(data)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error(`Update error in ${table}:`, error);
            return null;
        }
        return result;
    },

    // Delete a record by ID
    async delete(table: string, id: string): Promise<boolean> {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            console.error(`Delete error in ${table}:`, error);
            return false;
        }
        return true;
    },

    // Get all records from a table
    async getAll<T>(table: string): Promise<T[]> {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(`Fetch error in ${table}:`, error);
            return [];
        }
        return data || [];
    },

    // Get a single record by ID
    async getById<T>(table: string, id: string): Promise<T | null> {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error(`Fetch error in ${table}:`, error);
            return null;
        }
        return data;
    }
};
