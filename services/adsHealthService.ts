import { supabase } from '../lib/supabase';
import { AdsHealthInput, AdsHealthResult } from '../types';

export interface SavedAdsHealthAnalysis {
    id: string;
    name: string;
    input: AdsHealthInput;
    result: AdsHealthResult;
    createdAt: number;
}

export const AdsHealthService = {
    // Get all saved ads health analyses
    async getAdsHealthAnalyses(): Promise<SavedAdsHealthAnalysis[]> {
        try {
            const { data, error } = await supabase
                .from('ads_health_analyses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching ads health analyses:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                input: item.input,
                result: item.result,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getAdsHealthAnalyses:', error);
            return [];
        }
    },

    // Save an ads health analysis
    async saveAdsHealthAnalysis(analysis: SavedAdsHealthAnalysis): Promise<boolean> {
        try {
            const dbAnalysis = {
                id: analysis.id,
                name: analysis.name,
                input: analysis.input,
                result: analysis.result,
                created_at: new Date(analysis.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('ads_health_analyses')
                .upsert(dbAnalysis, { onConflict: 'id' });

            if (error) {
                console.error('Error saving ads health analysis:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveAdsHealthAnalysis:', error);
            return false;
        }
    },

    // Delete an ads health analysis
    async deleteAdsHealthAnalysis(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('ads_health_analyses')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting ads health analysis:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteAdsHealthAnalysis:', error);
            return false;
        }
    }
};
