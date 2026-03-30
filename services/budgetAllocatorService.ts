import { supabase } from '../lib/supabase';

// ═══════════════════════════════════════════════════════════════
// TYPES (matching BudgetAllocator.tsx)
// ═══════════════════════════════════════════════════════════════

export interface AssetChecklist {
    hasWebsite: boolean;
    hasCustomerList: boolean;
    hasCreativeAssets: boolean;
}

export interface ChannelBreakdown {
    channel: string;
    role: string;
    phase: 'AWARE' | 'TRIGGER' | 'CONVERT';
    totalAllocation: number;
    mediaSpend: number;
    productionCost: number;
    platformFee?: number;
    estimatedKpi: {
        metric: string;
        value: number;
        unitCost: number;
    };
    actionItem: string;
    warning?: string;
}

export interface DisabledChannel {
    name: string;
    reason: string;
}

export interface BudgetDistributionResult {
    totalBudget: number;
    productionBudget: number;
    mediaBudget: number;
    productionRatio: number;
    channels: ChannelBreakdown[];
    warnings: string[];
    disabledChannels: DisabledChannel[];
    strategyName: string;
}

export interface BudgetAllocatorInput {
    totalBudget: number;
    kpi: 'sales' | 'awareness' | 'retention' | 'custom';
    customKpi?: string;
    industry: string;
}

export interface SavedAllocation {
    id: string;
    input: BudgetAllocatorInput;
    assets: AssetChecklist;
    result: BudgetDistributionResult;
    timestamp: number;
}

// ═══════════════════════════════════════════════════════════════
// SUPABASE SERVICE
// ═══════════════════════════════════════════════════════════════

export const BudgetAllocatorService = {
    /**
     * Get all saved budget allocations
     */
    async getAllocations(): Promise<SavedAllocation[]> {
        try {
            const { data, error } = await supabase
                .from('budget_allocations')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching budget allocations:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                input: item.input,
                assets: item.assets,
                result: item.result,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getAllocations:', error);
            return [];
        }
    },

    /**
     * Save a budget allocation (insert or update)
     */
    async saveAllocation(allocation: SavedAllocation): Promise<boolean> {
        try {
            const dbAllocation = {
                id: allocation.id,
                input: allocation.input,
                assets: allocation.assets,
                result: allocation.result,
                created_at: new Date(allocation.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('budget_allocations')
                .upsert(dbAllocation, { onConflict: 'id' });

            if (error) {
                console.error('Error saving budget allocation:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveAllocation:', error);
            return false;
        }
    },

    /**
     * Delete a budget allocation
     */
    async deleteAllocation(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('budget_allocations')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting budget allocation:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteAllocation:', error);
            return false;
        }
    },

    /**
     * Migrate from localStorage to Supabase (one-time migration)
     */
    async migrateFromLocalStorage(): Promise<number> {
        try {
            const localData = localStorage.getItem('budget_allocator_v2_history');
            if (!localData) return 0;

            const allocations: SavedAllocation[] = JSON.parse(localData);
            let migrated = 0;

            for (const allocation of allocations) {
                const success = await this.saveAllocation(allocation);
                if (success) migrated++;
            }

            // Clear localStorage after successful migration
            if (migrated === allocations.length) {
                localStorage.removeItem('budget_allocator_v2_history');
            }

            return migrated;
        } catch (error) {
            console.error('Migration error:', error);
            return 0;
        }
    }
};
