// STP Service - Save/Load STP analyses to Supabase
import { supabase } from '../lib/supabase';
import { STPInput, STPResult } from '../types';

export interface SavedSTP {
    id: string;
    input: STPInput;
    data: STPResult;
    timestamp: number;
}

const TABLE_NAME = 'stp_analyses';

export const STPService = {
    async saveSTP(stp: SavedSTP): Promise<boolean> {
        try {
            const { error } = await supabase
                .from(TABLE_NAME)
                .upsert({
                    id: stp.id,
                    input_data: stp.input,
                    result_data: stp.data,
                    created_at: new Date(stp.timestamp).toISOString()
                });

            if (error) {
                console.error('Error saving STP:', error);
                // Fallback to localStorage
                const existing = JSON.parse(localStorage.getItem('stp_history') || '[]');
                const updated = [stp, ...existing.filter((s: SavedSTP) => s.id !== stp.id)];
                localStorage.setItem('stp_history', JSON.stringify(updated));
            }
            return true;
        } catch (err) {
            console.error('STP save error:', err);
            // Fallback to localStorage
            const existing = JSON.parse(localStorage.getItem('stp_history') || '[]');
            const updated = [stp, ...existing.filter((s: SavedSTP) => s.id !== stp.id)];
            localStorage.setItem('stp_history', JSON.stringify(updated));
            return true;
        }
    },

    async getSTPHistory(): Promise<SavedSTP[]> {
        try {
            const { data, error } = await supabase
                .from(TABLE_NAME)
                .select('*')
                .order('created_at', { ascending: false });

            if (error || !data) {
                // Fallback to localStorage
                return JSON.parse(localStorage.getItem('stp_history') || '[]');
            }

            return data.map((row: any) => ({
                id: row.id,
                input: row.input_data,
                data: row.result_data,
                timestamp: new Date(row.created_at).getTime()
            }));
        } catch (err) {
            return JSON.parse(localStorage.getItem('stp_history') || '[]');
        }
    },

    async deleteSTP(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from(TABLE_NAME)
                .delete()
                .eq('id', id);

            if (error) {
                // Fallback to localStorage
                const existing = JSON.parse(localStorage.getItem('stp_history') || '[]');
                const updated = existing.filter((s: SavedSTP) => s.id !== id);
                localStorage.setItem('stp_history', JSON.stringify(updated));
            }
            return true;
        } catch (err) {
            const existing = JSON.parse(localStorage.getItem('stp_history') || '[]');
            const updated = existing.filter((s: SavedSTP) => s.id !== id);
            localStorage.setItem('stp_history', JSON.stringify(updated));
            return true;
        }
    }
};
