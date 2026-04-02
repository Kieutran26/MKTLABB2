import { supabase } from '../lib/supabase';
import { BriefData } from '../types';
import { AutoBriefInput } from './geminiService';

export interface SavedBrief {
    id: string;
    input: AutoBriefInput;
    data: BriefData;
    timestamp: number;
}

export const BriefService = {
    // Get all saved briefs
    async getBriefs(): Promise<SavedBrief[]> {
        try {
            const { data, error } = await supabase
                .from('auto_briefs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching briefs:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                input: item.input,
                data: item.brief_data,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getBriefs:', error);
            return [];
        }
    },

    // Save a brief (insert or update)
    async saveBrief(brief: SavedBrief): Promise<boolean> {
        try {
            const dbBrief = {
                id: brief.id,
                input: brief.input,
                brief_data: brief.data,
                created_at: new Date(brief.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('auto_briefs')
                .upsert(dbBrief, { onConflict: 'id' });

            if (error) {
                console.error('Error saving brief:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveBrief:', error);
            return false;
        }
    },

    // Delete a brief
    async deleteBrief(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('auto_briefs')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting brief:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteBrief:', error);
            return false;
        }
    }
};
