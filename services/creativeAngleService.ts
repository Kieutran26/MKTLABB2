import { supabase } from '../lib/supabase';
import { CreativeAngleInput, CreativeAngleResult } from '../types';

export interface SavedAngleSet {
    id: string;
    name?: string;
    input: CreativeAngleInput;
    result: CreativeAngleResult;
    timestamp: number;
}

const STORAGE_KEY = 'creative_angle_history';

export const CreativeAngleService = {
    // Get all saved angle sets from Supabase
    async getAngleSets(): Promise<SavedAngleSet[]> {
        try {
            const { data, error } = await supabase
                .from('creative_angles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching creative angles:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                input: item.input as CreativeAngleInput,
                result: item.result as CreativeAngleResult,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getAngleSets:', error);
            return [];
        }
    },

    // Save an angle set to Supabase
    async saveAngleSet(angleSet: SavedAngleSet): Promise<{ success: boolean; errorMessage?: string }> {
        try {
            const dbRecord = {
                id: angleSet.id,
                name: angleSet.name || angleSet.input.productName,
                input: angleSet.input,
                result: angleSet.result,
                created_at: new Date(angleSet.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('creative_angles')
                .upsert(dbRecord, { onConflict: 'id' });

            if (error) {
                console.error('Error saving creative angle:', error);
                return { success: false, errorMessage: error.message || error.code || 'Supabase error' };
            }

            return { success: true };
        } catch (error: any) {
            console.error('Error in saveAngleSet:', error);
            return { success: false, errorMessage: error?.message || 'Unknown error' };
        }
    },

    // Delete an angle set from Supabase
    async deleteAngleSet(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('creative_angles')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting creative angle:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteAngleSet:', error);
            return false;
        }
    },

    // One-time migration from localStorage to Supabase
    async migrateFromLocalStorage(): Promise<number> {
        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (!localData) return 0;

            const localAngles: SavedAngleSet[] = JSON.parse(localData);
            if (!localAngles.length) return 0;

            let migrated = 0;
            for (const angleSet of localAngles) {
                const result = await this.saveAngleSet(angleSet);
                if (result.success) migrated++;
            }

            // Clear localStorage after successful migration
            if (migrated > 0) {
                localStorage.removeItem(STORAGE_KEY);
            }

            return migrated;
        } catch (error) {
            console.error('Migration error:', error);
            return 0;
        }
    }
};
