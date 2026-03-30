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
    // Get all saved strategic models
    async getStrategicModels(): Promise<SavedStrategicModel[]> {
        try {
            const { data, error } = await supabase
                .from('strategic_models')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching strategic models:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                brandId: item.brand_id,
                productInfo: item.product_info,
                results: item.results,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getStrategicModels:', error);
            return [];
        }
    },

    // Save a strategic model (insert or update)
    async saveStrategicModel(model: SavedStrategicModel): Promise<boolean> {
        try {
            const dbModel = {
                id: model.id,
                name: model.name,
                brand_id: model.brandId,
                product_info: model.productInfo,
                results: model.results,
                created_at: new Date(model.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('strategic_models')
                .upsert(dbModel, { onConflict: 'id' });

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
                .from('strategic_models')
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
