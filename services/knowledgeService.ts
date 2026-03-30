import { supabase } from '../lib/supabase';

export interface Knowledge {
    id: string;
    term: string;
    definition: string;
    example?: string;
    comparison?: string;
    category: string;
    created_at?: string;
    updated_at?: string;
}

export const KnowledgeService = {
    // Get all knowledge entries
    async getAll(): Promise<Knowledge[]> {
        const { data, error } = await supabase
            .from('marketing_knowledge')
            .select('*')
            .order('term', { ascending: true });

        if (error) {
            console.error('Error fetching knowledge:', error);
            return [];
        }
        return data || [];
    },

    // Search knowledge
    async search(query: string): Promise<Knowledge[]> {
        if (!query.trim()) {
            return this.getAll();
        }

        const { data, error } = await supabase
            .from('marketing_knowledge')
            .select('*')
            .or(`term.ilike.%${query}%,definition.ilike.%${query}%,category.ilike.%${query}%`)
            .order('term', { ascending: true });

        if (error) {
            console.error('Error searching knowledge:', error);
            return [];
        }
        return data || [];
    },

    // Get by category
    async getByCategory(category: string): Promise<Knowledge[]> {
        const { data, error } = await supabase
            .from('marketing_knowledge')
            .select('*')
            .eq('category', category)
            .order('term', { ascending: true });

        if (error) {
            console.error('Error fetching by category:', error);
            return [];
        }
        return data || [];
    },

    // Add new knowledge
    async add(knowledge: Omit<Knowledge, 'id'>): Promise<Knowledge | null> {
        const { data, error } = await supabase
            .from('marketing_knowledge')
            .insert([knowledge])
            .select()
            .single();

        if (error) {
            console.error('Error adding knowledge:', error);
            return null;
        }
        return data;
    },

    // Update knowledge
    async update(id: string, updates: Partial<Knowledge>): Promise<Knowledge | null> {
        const { data, error } = await supabase
            .from('marketing_knowledge')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating knowledge:', error);
            return null;
        }
        return data;
    },

    // Delete knowledge
    async delete(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('marketing_knowledge')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting knowledge:', error);
            return false;
        }
        return true;
    },

    // Get all categories
    async getCategories(): Promise<string[]> {
        const { data, error } = await supabase
            .from('marketing_knowledge')
            .select('category')
            .order('category', { ascending: true });

        if (error) {
            console.error('Error fetching categories:', error);
            return [];
        }

        const uniqueCategories = [...new Set(data?.map(d => d.category) || [])];
        return uniqueCategories;
    },

    // Bulk insert for initial data
    async bulkInsert(items: Omit<Knowledge, 'id'>[]): Promise<number> {
        const { data, error } = await supabase
            .from('marketing_knowledge')
            .insert(items)
            .select();

        if (error) {
            console.error('Error bulk inserting:', error);
            return 0;
        }
        return data?.length || 0;
    }
};
