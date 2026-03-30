import { supabase } from '../lib/supabase';
import { PESTELBuilderInput, PESTELBuilderResult } from '../types';

export interface SavedPESTEL {
    id: string;
    input: PESTELBuilderInput;
    data: PESTELBuilderResult;
    timestamp: number;
}

export const PESTELService = {
    // Get all saved PESTEL reports
    async getReports(): Promise<SavedPESTEL[]> {
        try {
            const { data, error } = await supabase
                .from('pestel_reports')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching PESTEL reports:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                input: item.input,
                data: item.result_data,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getReports:', error);
            return [];
        }
    },

    // Save a PESTEL report (insert or update)
    async saveReport(report: SavedPESTEL): Promise<boolean> {
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

            if (error) {
                console.error('Error saving PESTEL report:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveReport:', error);
            return false;
        }
    },

    // Delete a PESTEL report
    async deleteReport(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('pestel_reports')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting PESTEL report:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteReport:', error);
            return false;
        }
    }
};
