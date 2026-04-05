import { supabase } from '../lib/supabase';
import { PESTELInput, PESTELResult, PESTELFactorGroup } from '../types';

export interface SavedPESTEL {
    id: string;
    input: PESTELInput;
    data: PESTELResult;
    timestamp: number;
}

const STORAGE_KEY = 'mktlab_pestel_history';

export const PESTELService = {
    // Get all saved PESTEL reports (Supabase + LocalStorage)
    async getReports(): Promise<SavedPESTEL[]> {
        let supabaseResults: SavedPESTEL[] = [];
        let localResults: SavedPESTEL[] = [];

        // 1. Fetch from Supabase
        try {
            const { data, error } = await supabase
                .from('pestel_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data) {
                supabaseResults = data.map(item => ({
                    id: item.id,
                    input: item.input,
                    data: item.result_data,
                    timestamp: new Date(item.created_at).getTime()
                }));
            }
        } catch (error) {
            console.error('Error fetching Supabase PESTEL reports:', error);
        }

        // 2. Fetch from LocalStorage
        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (localData) {
                localResults = JSON.parse(localData);
            }
        } catch (error) {
            console.error('Error fetching LocalStorage PESTEL reports:', error);
        }

        // 3. Merge and deduplicate by ID
        const combined = new Map<string, SavedPESTEL>();
        localResults.forEach(r => combined.set(r.id, r));
        supabaseResults.forEach(r => combined.set(r.id, r));

        return Array.from(combined.values()).sort((a, b) => b.timestamp - a.timestamp);
    },

    // Save a PESTEL report (to both Supabase and LocalStorage)
    async saveReport(report: SavedPESTEL): Promise<boolean> {
        let supabaseSuccess = false;
        let localSuccess = false;

        // 1. Save to Supabase
        try {
            const dbReport = {
                id: report.id,
                input: report.input,
                result_data: report.data,
                created_at: new Date(report.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('pestel_reports')
                .upsert(dbReport, { onConflict: 'id' });

            if (!error) supabaseSuccess = true;
        } catch (error) {
            console.error('Error saving PESTEL report to Supabase:', error);
        }

        // 2. Save to LocalStorage (Always save local as a fallback)
        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            let history: SavedPESTEL[] = localData ? JSON.parse(localData) : [];
            
            // Remove existing if any, then add new/updated
            history = [report, ...history.filter(r => r.id !== report.id)].slice(0, 50);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
            localSuccess = true;
        } catch (error) {
            console.error('Error saving PESTEL report to LocalStorage:', error);
        }

        return supabaseSuccess || localSuccess;
    },

    // Delete a PESTEL report
    async deleteReport(id: string): Promise<boolean> {
        let supabaseSuccess = false;
        let localSuccess = false;

        // 1. Delete from Supabase
        try {
            const { error } = await supabase
                .from('pestel_reports')
                .delete()
                .eq('id', id);

            if (!error) supabaseSuccess = true;
        } catch (error) {
            console.error('Error deleting PESTEL report from Supabase:', error);
        }

        // 2. Delete from LocalStorage
        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (localData) {
                let history: SavedPESTEL[] = JSON.parse(localData);
                const filtered = history.filter(r => r.id !== id);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
                localSuccess = true;
            }
        } catch (error) {
            console.error('Error deleting PESTEL report from LocalStorage:', error);
        }

        return supabaseSuccess || localSuccess;
    }
};
