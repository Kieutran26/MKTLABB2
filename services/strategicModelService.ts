import { supabase } from '../lib/supabase';
import { StrategicModelData } from './geminiService';

export interface SavedStrategicModel {
    id: string;
    name: string;
    brandId: string;
    productInfo: string;
    results: Record<string, StrategicModelData | null>; // SWOT, AIDA, 4P, 5W1H, SMART
    createdAt: number;
}

export const StrategicModelService = {
    // Get all saved strategic models from the NEW marketing_plans table
    async getStrategicModels(): Promise<SavedStrategicModel[]> {
        try {
            const { data, error } = await supabase
                .from('marketing_plans')
                .select('*')
                // Filter for any of our model types
                .in('type', ['SWOT', 'AIDA', '4P', '5W1H', 'SMART'])
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching strategic models:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                name: item.name || 'Untitled Plan',
                brandId: item.brand_id || 'manual',
                productInfo: item.input_data?.productInfo || '',
                results: item.generated_output || {},
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getStrategicModels:', error);
            return [];
        }
    },

    // Save functionality is now handled by saasService.saveMarketingPlan
    // But we keep this for legacy compatibility if called elsewhere
    async saveStrategicModel(model: SavedStrategicModel): Promise<boolean> {
        try {
            const dbModel = {
                id: model.id.length > 36 ? undefined : model.id, // Handle non-uuid temp ids
                name: model.name,
                brand_id: model.brandId === 'manual' || model.brandId === 'unknown' ? null : model.brandId,
                type: 'STRATEGIC_GROUP', // Type identifying this group of models
                input_data: { productInfo: model.productInfo },
                generated_output: model.results,
                created_at: new Date(model.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('marketing_plans')
                .upsert(dbModel);

            if (error) {
                console.error('Error saving strategic model:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveStrategicModel:', error);
            return false;
        }
    },

    // Delete a strategic model
    async deleteStrategicModel(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('marketing_plans')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting strategic model:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteStrategicModel:', error);
            return false;
        }
    }
};
