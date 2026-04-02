import { supabase } from '../lib/supabase';
import { PorterAnalysisInput, PorterAnalysisResult } from '../types';

export interface SavedPorterAnalysis {
    id: string;
    input: PorterAnalysisInput;
    data: PorterAnalysisResult;
    timestamp: number;
}

export const PorterService = {
    // Get all saved Porter analyses
    async getAnalyses(): Promise<SavedPorterAnalysis[]> {
        try {
            const { data, error } = await supabase
                .from('porter_analyses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching Porter analyses:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                input: item.input,
                data: item.result_data,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getAnalyses:', error);
            return [];
        }
    },

    // Save a Porter analysis
    async saveAnalysis(analysis: SavedPorterAnalysis): Promise<boolean> {
        try {
            const dbRecord = {
                id: analysis.id,
                input: analysis.input,
                result_data: analysis.data,
                created_at: new Date(analysis.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('porter_analyses')
                .upsert(dbRecord, { onConflict: 'id' });

            if (error) {
                console.error('Error saving Porter analysis:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveAnalysis:', error);
            return false;
        }
    },

    // Delete a Porter analysis
    async deleteAnalysis(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('porter_analyses')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting Porter analysis:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteAnalysis:', error);
            return false;
        }
    }
};
