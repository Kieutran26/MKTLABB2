import { supabase } from '../lib/supabase';
import { StrategicModelData } from './geminiService';
import type { OptimkiModelType, OptimkiResult } from '../types';

export interface SavedStrategicModel {
    id: string;
    name: string;
    brandId: string;
    productInfo: string;
    results: Record<string, StrategicModelData | null>; // SWOT, AIDA, 4P, 5W1H, SMART
    createdAt: number;
}

/** One saved Opti M.KI report for history grid (IMC-style cards). */
export interface SavedOptimkiHistoryItem {
    id: string;
    name: string;
    brandId: string | null;
    ten_thuong_hieu: string;
    nganh_hang: string;
    budgetHint: string;
    timelineHint: string;
    result: OptimkiResult;
    createdAt: number;
}

function pickOptimkiResultFromOutput(output: unknown): OptimkiResult | null {
    if (!output || typeof output !== 'object') return null;
    
    // Check if it's already a direct OptimkiResult (legacy or clean save)
    const direct = output as Record<string, unknown>;
    if (
        typeof direct.html_report === 'string' &&
        typeof direct.brand_name === 'string'
    ) {
        return direct as unknown as OptimkiResult;
    }

    // Check if it's wrapped in a modelType key (standard save)
    for (const v of Object.values(output as Record<string, unknown>)) {
        if (
            v &&
            typeof v === 'object' &&
            typeof (v as { html_report?: unknown }).html_report === 'string' &&
            typeof (v as { brand_name?: unknown }).brand_name === 'string'
        ) {
            return v as OptimkiResult;
        }
    }
    return null;
}

function trimMeta(s: string, max = 28): string {
    const t = s.trim();
    if (!t) return '—';
    return t.length > max ? `${t.slice(0, max)}…` : t;
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
    },

    /** History for Opti M.KI: OPTIMKI rows + legacy STRATEGIC_GROUP saves + LOCAL FALLBACK. */
    async getOptimkiHistory(): Promise<SavedOptimkiHistoryItem[]> {
        const rows: SavedOptimkiHistoryItem[] = [];

        // 1. Fetch from LocalStorage (Fallback)
        try {
            const localRaw = localStorage.getItem('mkt_optimki_history');
            if (localRaw) {
                const localItems = JSON.parse(localRaw);
                if (Array.isArray(localItems)) {
                    rows.push(...localItems);
                }
            }
        } catch (e) {
            console.error('Error reading local history:', e);
        }

        // 2. Fetch from Supabase (Cloud)
        try {
            const { data, error } = await supabase
                .from('marketing_plans')
                .select('*')
                .in('type', ['OPTIMKI', 'STRATEGIC_GROUP'])
                .order('created_at', { ascending: false });

            if (error) {
                console.warn('[Supabase] Could not fetch cloud history:', error.message);
            } else if (data) {
                for (const item of data) {
                    // Skip if already in local (prevent duplicates if synced)
                    if (rows.some(r => r.id === item.id)) continue;

                    const result = pickOptimkiResultFromOutput(item.generated_output);
                    if (!result) continue;

                    const input = (item.input_data || {}) as Record<string, unknown>;
                    const ten =
                        (typeof input.ten_thuong_hieu === 'string' && input.ten_thuong_hieu) ||
                        result.brand_name ||
                        '';
                    const nganh =
                        (typeof input.nganh_hang === 'string' && input.nganh_hang) || '';
                    const budgetRaw =
                        typeof input.so_lieu_ngan_sach === 'string' ? input.so_lieu_ngan_sach : '';
                    const timeRaw =
                        typeof input.thoi_gian_dia_diem === 'string' ? input.thoi_gian_dia_diem : '';

                    rows.push({
                        id: item.id,
                        name: item.name || `${result.brand_name} · ${result.model_type}`,
                        brandId: item.brand_id ?? null,
                        ten_thuong_hieu: ten,
                        nganh_hang: nganh,
                        budgetHint: trimMeta(budgetRaw, 14),
                        timelineHint: trimMeta(timeRaw, 22),
                        result,
                        createdAt: new Date(item.created_at).getTime(),
                    });
                }
            }
        } catch (error) {
            console.error('Connection error fetching cloud history:', error);
        }

        // Sort combined history by newest first
        return rows.sort((a, b) => b.createdAt - a.createdAt);
    },

    async saveOptimkiPlan(params: {
        id: string;
        name: string;
        brandId: string;
        modelType: OptimkiModelType;
        result: OptimkiResult;
        inputSnapshot: {
            ten_thuong_hieu: string;
            nganh_hang: string;
            so_lieu_ngan_sach: string;
            thoi_gian_dia_diem: string;
            mo_ta: string;
        };
        createdAt: number;
    }): Promise<boolean> {
        const localItem: SavedOptimkiHistoryItem = {
            id: params.id,
            name: params.name,
            brandId: params.brandId,
            ten_thuong_hieu: params.inputSnapshot.ten_thuong_hieu,
            nganh_hang: params.inputSnapshot.nganh_hang,
            budgetHint: trimMeta(params.inputSnapshot.so_lieu_ngan_sach, 14),
            timelineHint: trimMeta(params.inputSnapshot.thoi_gian_dia_diem, 22),
            result: params.result,
            createdAt: params.createdAt
        };

        // Helper to save locally
        const saveLocally = () => {
            try {
                const existing = JSON.parse(localStorage.getItem('mkt_optimki_history') || '[]');
                localStorage.setItem('mkt_optimki_history', JSON.stringify([localItem, ...existing].slice(0, 50)));
                console.log('✅ Opti M.KI saved to LocalStorage (Fallback)');
                return true;
            } catch (e) {
                console.error('Failed to save to LocalStorage:', e);
                return false;
            }
        };

        try {
            // Get current user for RLS
            const { data: { user } } = await supabase.auth.getUser();

            const dbModel = {
                id: params.id.length > 36 ? undefined : params.id,
                name: params.name,
                user_id: user?.id || null, // Critical for RLS
                brand_id:
                    params.brandId === 'manual' || params.brandId === 'unknown'
                        ? null
                        : params.brandId,
                type: 'OPTIMKI',
                input_data: params.inputSnapshot,
                generated_output: { [params.modelType]: params.result },
                created_at: new Date(params.createdAt).toISOString(),
            };

            const { error } = await supabase.from('marketing_plans').upsert(dbModel);

            if (error) {
                console.error('Error saving Opti M.KI plan to Supabase:', error);
                // If it's a network error or RLS error, use fallback
                return saveLocally();
            }

            return true;
        } catch (error: any) {
            console.error('Critical save error (likely network):', error);
            // On hard network failure (Failed to fetch), use fallback
            return saveLocally();
        }
    },
};
