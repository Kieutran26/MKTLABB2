import { supabase } from '../lib/supabase';
import { MastermindStrategy } from '../types';

export const MastermindService = {
    // Get all saved mastermind strategies
    async getMastermindStrategies(): Promise<MastermindStrategy[]> {
        try {
            const { data, error } = await supabase
                .from('mastermind_strategies')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching mastermind strategies:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                brandId: item.brand_id,
                personaId: item.persona_id,
                objective: item.objective,
                perception: item.perception,
                tone: item.tone,
                result: item.result,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getMastermindStrategies:', error);
            return [];
        }
    },

    // Save a mastermind strategy (insert or update)
    async saveMastermindStrategy(strategy: MastermindStrategy): Promise<boolean> {
        try {
            const dbStrategy = {
                id: strategy.id,
                name: strategy.name,
                brand_id: strategy.brandId,
                persona_id: strategy.personaId,
                objective: strategy.objective,
                perception: strategy.perception,
                tone: strategy.tone,
                result: strategy.result,
                created_at: new Date(strategy.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('mastermind_strategies')
                .upsert(dbStrategy, { onConflict: 'id' });

            if (error) {
                console.error('Error saving mastermind strategy:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveMastermindStrategy:', error);
            return false;
        }
    },

    // Delete a mastermind strategy
    async deleteMastermindStrategy(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('mastermind_strategies')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting mastermind strategy:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteMastermindStrategy:', error);
            return false;
        }
    }
};
