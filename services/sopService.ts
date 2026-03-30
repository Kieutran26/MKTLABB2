import { supabase } from '../lib/supabase';
import { SOPData } from '../types';
import { SOPInput } from './geminiService';

export interface SavedSOP {
    id: string;
    input: SOPInput;
    data: SOPData;
    timestamp: number;
}

export const SOPService = {
    // Get all saved SOPs
    async getSOPs(): Promise<SavedSOP[]> {
        try {
            const { data, error } = await supabase
                .from('sops')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching SOPs:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                input: item.input,
                data: item.sop_data,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getSOPs:', error);
            return [];
        }
    },

    // Save a SOP (insert or update)
    async saveSOP(sop: SavedSOP): Promise<boolean> {
        try {
            const dbSOP = {
                id: sop.id,
                input: sop.input,
                sop_data: sop.data,
                created_at: new Date(sop.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('sops')
                .upsert(dbSOP, { onConflict: 'id' });

            if (error) {
                console.error('Error saving SOP:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveSOP:', error);
            return false;
        }
    },

    // Delete a SOP
    async deleteSOP(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('sops')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting SOP:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteSOP:', error);
            return false;
        }
    }
};
