import { supabase } from '../lib/supabase';
import { HookGeneratorResult } from '../types';
import { HookInput } from './geminiService';

export interface SavedHookSet {
    id: string;
    input: HookInput;
    data: HookGeneratorResult;
    timestamp: number;
}

export const HookService = {
    // Get all saved hook sets
    async getHookSets(): Promise<SavedHookSet[]> {
        try {
            const { data, error } = await supabase
                .from('hook_sets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching hook sets:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                input: item.input,
                data: item.hooks_data,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getHookSets:', error);
            return [];
        }
    },

    // Save a hook set (insert or update)
    async saveHookSet(hookSet: SavedHookSet): Promise<boolean> {
        try {
            const dbHookSet = {
                id: hookSet.id,
                input: hookSet.input,
                hooks_data: hookSet.data,
                created_at: new Date(hookSet.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('hook_sets')
                .upsert(dbHookSet, { onConflict: 'id' });

            if (error) {
                console.error('Error saving hook set:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveHookSet:', error);
            return false;
        }
    },

    // Delete a hook set
    async deleteHookSet(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('hook_sets')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting hook set:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteHookSet:', error);
            return false;
        }
    }
};
