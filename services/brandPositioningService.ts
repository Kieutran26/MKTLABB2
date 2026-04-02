import { supabase } from '../lib/supabase';
import { BrandPositioningInput, BrandPositioningResult } from '../types';

export interface SavedBrandPositioning {
    id: string;
    name: string;
    input: BrandPositioningInput;
    result: BrandPositioningResult;
    createdAt: number;
}

export const BrandPositioningService = {
    // Get all saved brand positionings
    async getBrandPositionings(): Promise<SavedBrandPositioning[]> {
        try {
            const { data, error } = await supabase
                .from('brand_positionings')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching brand positionings:', error);
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
            console.error('Error in getBrandPositionings:', error);
            return [];
        }
    },

    // Save a brand positioning
    async saveBrandPositioning(positioning: SavedBrandPositioning): Promise<boolean> {
        try {
            const dbPositioning = {
                id: positioning.id,
                name: positioning.name,
                input: positioning.input,
                result: positioning.result,
                created_at: new Date(positioning.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('brand_positionings')
                .upsert(dbPositioning, { onConflict: 'id' });

            if (error) {
                console.error('Error saving brand positioning:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveBrandPositioning:', error);
            return false;
        }
    },

    // Delete a brand positioning
    async deleteBrandPositioning(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('brand_positionings')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting brand positioning:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteBrandPositioning:', error);
            return false;
        }
    }
};
