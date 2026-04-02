import { supabase } from '../lib/supabase';
import { RoasScenario } from '../types';

// ═══════════════════════════════════════════════════════════════
// ROAS FORECASTER SUPABASE SERVICE
// Migrate from localStorage to cloud storage
// ═══════════════════════════════════════════════════════════════

export const RoasService = {
    /**
     * Get all saved ROAS scenarios
     */
    async getScenarios(): Promise<RoasScenario[]> {
        try {
            const { data, error } = await supabase
                .from('roas_scenarios')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching ROAS scenarios:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                createdAt: new Date(item.created_at).getTime(),
                inputs: item.inputs,
                results: item.results
            }));
        } catch (error) {
            console.error('Error in getScenarios:', error);
            return [];
        }
    },

    /**
     * Save a ROAS scenario (insert or update)
     */
    async saveScenario(scenario: RoasScenario): Promise<boolean> {
        try {
            const dbScenario = {
                id: scenario.id,
                name: scenario.name,
                inputs: scenario.inputs,
                results: scenario.results,
                created_at: new Date(scenario.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('roas_scenarios')
                .upsert(dbScenario, { onConflict: 'id' });

            if (error) {
                console.error('Error saving ROAS scenario:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveScenario:', error);
            return false;
        }
    },

    /**
     * Delete a ROAS scenario
     */
    async deleteScenario(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('roas_scenarios')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting ROAS scenario:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteScenario:', error);
            return false;
        }
    },

    /**
     * Migrate from localStorage to Supabase (one-time migration)
     */
    async migrateFromLocalStorage(): Promise<number> {
        try {
            const localKey = 'eng_app_roas_scenarios';
            const localData = localStorage.getItem(localKey);
            if (!localData) return 0;

            const scenarios: RoasScenario[] = JSON.parse(localData);
            let migrated = 0;

            for (const scenario of scenarios) {
                const success = await this.saveScenario(scenario);
                if (success) migrated++;
            }

            // Clear localStorage after successful migration
            if (migrated === scenarios.length) {
                localStorage.removeItem(localKey);
            }

            return migrated;
        } catch (error) {
            console.error('Migration error:', error);
            return 0;
        }
    }
};
