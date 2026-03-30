import { dbHelpers } from '../lib/supabase';

// Types matching the DB schema
export interface SalaryConfig {
    gross: number;
    standardDays: number;
    workOnSaturday: boolean;
    otMultiplier: number;
    rewardItemPrice: number;
    rewardItemName: string;
    startWorkDate: string;
}

export interface AttendanceRecord {
    id?: string;
    date: string; // date_str in DB
    type: 'FULL' | 'HALF' | 'OFF' | 'LEAVE' | 'OT';
    otHours: number;
}

const CONFIG_TABLE = 'salary_configs';
const ATTENDANCE_TABLE = 'salary_attendance';
const CONFIG_ID = 'default';

export const salaryService = {
    // --- Config ---
    async getConfig(): Promise<SalaryConfig | null> {
        const data = await dbHelpers.getById<any>(CONFIG_TABLE, CONFIG_ID);
        if (!data) return null;

        return {
            gross: Number(data.gross),
            standardDays: Number(data.standard_days),
            workOnSaturday: data.work_on_saturday,
            otMultiplier: Number(data.ot_multiplier),
            rewardItemPrice: Number(data.reward_item_price),
            rewardItemName: data.reward_item_name,
            startWorkDate: data.start_work_date,
        };
    },

    async saveConfig(config: SalaryConfig): Promise<boolean> {
        const dbData = {
            id: CONFIG_ID,
            gross: config.gross,
            standard_days: config.standardDays,
            work_on_saturday: config.workOnSaturday,
            ot_multiplier: config.otMultiplier,
            reward_item_price: config.rewardItemPrice,
            reward_item_name: config.rewardItemName,
            start_work_date: config.startWorkDate,
            updated_at: new Date().toISOString()
        };

        // We use insert with upsert behavior via 'upsert' method if available, 
        // but dbHelpers.update is by ID. Since 'default' ID exists, we can try update first or just use direct supabase client if helper is limited, 
        // but dbHelpers is wrapping simple single-record ops.
        // Let's rely on update since we inserted the default row in migration.
        const result = await dbHelpers.update(CONFIG_TABLE, CONFIG_ID, dbData);
        // If update fails (maybe row deleted?), try insert
        if (!result) {
            const insertResult = await dbHelpers.insert(CONFIG_TABLE, dbData);
            return !!insertResult;
        }
        return !!result;
    },

    // --- Attendance ---
    async getAllAttendance(): Promise<Record<string, { type: AttendanceRecord['type']; otHours: number }>> {
        // Fetch ALL records. If dataset grows large, filtering by month is better.
        // For now, assuming reasonable size (< thousands).
        const records = await dbHelpers.getAll<any>(ATTENDANCE_TABLE);

        const map: Record<string, { type: AttendanceRecord['type']; otHours: number }> = {};
        records.forEach(r => {
            map[r.date_str] = {
                type: r.type,
                otHours: Number(r.ot_hours)
            };
        });
        return map;
    },

    async saveAttendance(dateStr: string, type: AttendanceRecord['type'], otHours: number): Promise<boolean> {
        // Since we want to UPSERT by date_str (which is unique), usually we need specialized upsert.
        // dbHelpers doesn't expose upsert directly by non-ID field easily without modification.
        // However, we can check if exists first or just delete and insert (simple but less atomic).
        // Or better: use dbHelpers.insert but we need to handle conflict. 
        // Let's try to find record by date first? dbHelpers doesn't have findByField.

        // Actually, let's just use the `supabase` client directly for specific upsert functionality 
        // to be cleaner, but keeping consistency with dbHelpers where possible.
        // Since `date_str` is UNIQUE, we can use Supabase's upsert.

        const { supabase } = await import('../lib/supabase'); // Dynamic import to avoid circular dep if any, though likely fine.

        const { error } = await supabase
            .from(ATTENDANCE_TABLE)
            .upsert({
                date_str: dateStr,
                type: type,
                ot_hours: otHours
            }, { onConflict: 'date_str' });

        if (error) {
            console.error('Error saving attendance:', error);
            return false;
        }
        return true;
    },

    async deleteAttendance(dateStr: string): Promise<boolean> {
        const { supabase } = await import('../lib/supabase');

        const { error } = await supabase
            .from(ATTENDANCE_TABLE)
            .delete()
            .eq('date_str', dateStr);

        if (error) {
            console.error('Error deleting attendance:', error);
            return false;
        }
        return true;
    }
};
