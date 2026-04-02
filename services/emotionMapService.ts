import { supabase } from '../lib/supabase';
import { AudienceEmotionMapInput, AudienceEmotionMapResult } from '../types';

export interface SavedEmotionMap {
    id: string;
    input: AudienceEmotionMapInput;
    result: AudienceEmotionMapResult;
    timestamp: number;
}

export const EmotionMapService = {
    // Get all saved emotion maps
    async getEmotionMaps(): Promise<SavedEmotionMap[]> {
        try {
            const { data, error } = await supabase
                .from('emotion_maps')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching emotion maps:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                input: item.input,
                result: item.result,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getEmotionMaps:', error);
            return [];
        }
    },

    // Save an emotion map (insert or update)
    async saveEmotionMap(map: SavedEmotionMap): Promise<boolean> {
        try {
            const dbMap = {
                id: map.id,
                input: map.input,
                result: map.result,
                created_at: new Date(map.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('emotion_maps')
                .upsert(dbMap, { onConflict: 'id' });

            if (error) {
                console.error('Error saving emotion map:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveEmotionMap:', error);
            return false;
        }
    },

    // Delete an emotion map
    async deleteEmotionMap(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('emotion_maps')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting emotion map:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteEmotionMap:', error);
            return false;
        }
    }
};
