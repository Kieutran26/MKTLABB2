import { supabase } from '../lib/supabase';
import { InsightFinderResult, InsightFinderInput } from '../types';

export interface SavedInsight {
    id: string;
    input: InsightFinderInput;
    data: InsightFinderResult;
    timestamp: number;
}

export const InsightService = {
    // Get all saved insights
    async getInsights(): Promise<SavedInsight[]> {
        try {
            const { data, error } = await supabase
                .from('insights')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching insights:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                input: item.input,
                data: item.insight_data,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getInsights:', error);
            return [];
        }
    },

    // Save an insight (insert or update)
    async saveInsight(insight: SavedInsight): Promise<boolean> {
        try {
            const dbInsight = {
                id: insight.id,
                input: insight.input,
                insight_data: insight.data,
                created_at: new Date(insight.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('insights')
                .upsert(dbInsight, { onConflict: 'id' });

            if (error) {
                console.error('Error saving insight:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveInsight:', error);
            return false;
        }
    },

    // Delete an insight
    async deleteInsight(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('insights')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting insight:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteInsight:', error);
            return false;
        }
    }
};
