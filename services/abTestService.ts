import { supabase } from '../lib/supabase';

// Input data structure for A/B test
export interface ABTestInput {
    visitorsA: number;
    conversionsA: number;
    visitorsB: number;
    conversionsB: number;
    confidence: number;
    avgOrderValue: number;
}

// Result data structure from A/B test calculation
export interface ABTestResult {
    crA: number;
    crB: number;
    uplift: number;
    pValue: number;
    zScore: number;
    isSignificant: boolean;
    confidenceLevel: number;
    winner: 'A' | 'B' | null;
    rpvA: number;
    rpvB: number;
    rpvUplift: number;
    potentialRevenue: number;
}

export interface SavedABTest {
    id: string;
    name: string;
    input: ABTestInput;
    result: ABTestResult;
    createdAt: number;
}

export const ABTestService = {
    // Get all saved A/B tests
    async getABTests(): Promise<SavedABTest[]> {
        try {
            const { data, error } = await supabase
                .from('ab_tests')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching A/B tests:', error);
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
            console.error('Error in getABTests:', error);
            return [];
        }
    },

    // Save an A/B test
    async saveABTest(test: SavedABTest): Promise<boolean> {
        try {
            const dbTest = {
                id: test.id,
                name: test.name,
                input: test.input,
                result: test.result,
                created_at: new Date(test.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('ab_tests')
                .upsert(dbTest, { onConflict: 'id' });

            if (error) {
                console.error('Error saving A/B test:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveABTest:', error);
            return false;
        }
    },

    // Delete an A/B test
    async deleteABTest(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('ab_tests')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting A/B test:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteABTest:', error);
            return false;
        }
    }
};
