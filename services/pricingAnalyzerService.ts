import { supabase } from '../lib/supabase';
import { PricingAnalyzerInput, PricingAnalyzerResult } from '../types';

export interface SavedPricingAnalysis {
    id: string;
    name: string;
    input: PricingAnalyzerInput;
    result: PricingAnalyzerResult;
    createdAt: number;
}

export const PricingAnalyzerService = {
    // Get all saved pricing analyses
    async getPricingAnalyses(): Promise<SavedPricingAnalysis[]> {
        try {
            const { data, error } = await supabase
                .from('pricing_analyses')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching pricing analyses:', error);
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
            console.error('Error in getPricingAnalyses:', error);
            return [];
        }
    },

    // Save a pricing analysis
    async savePricingAnalysis(analysis: SavedPricingAnalysis): Promise<boolean> {
        try {
            const dbAnalysis = {
                id: analysis.id,
                name: analysis.name,
                input: analysis.input,
                result: analysis.result,
                created_at: new Date(analysis.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('pricing_analyses')
                .upsert(dbAnalysis, { onConflict: 'id' });

            if (error) {
                console.error('Error saving pricing analysis:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in savePricingAnalysis:', error);
            return false;
        }
    },

    // Delete a pricing analysis
    async deletePricingAnalysis(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('pricing_analyses')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting pricing analysis:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deletePricingAnalysis:', error);
            return false;
        }
    }
};
