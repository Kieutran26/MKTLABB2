import { supabase } from '../lib/supabase';
import { SavedPrompt } from '../types';

export const PromptService = {
    // Get all saved prompts
    async getPrompts(): Promise<SavedPrompt[]> {
        try {
            const { data, error } = await supabase
                .from('prompts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching prompts:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                aiModel: item.ai_model,
                title: item.title,
                content: item.content,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getPrompts:', error);
            return [];
        }
    },

    // Save a prompt (insert or update)
    async savePrompt(prompt: SavedPrompt): Promise<boolean> {
        try {
            const dbPrompt = {
                id: prompt.id,
                ai_model: prompt.aiModel,
                title: prompt.title,
                content: prompt.content,
                created_at: new Date(prompt.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('prompts')
                .upsert(dbPrompt, { onConflict: 'id' });

            if (error) {
                console.error('Error saving prompt:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in savePrompt:', error);
            return false;
        }
    },

    // Delete a prompt
    async deletePrompt(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('prompts')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting prompt:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deletePrompt:', error);
            return false;
        }
    }
};
