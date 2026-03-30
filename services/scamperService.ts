import { supabase } from '../lib/supabase';
import { ScamperSession } from '../types';

export const ScamperService = {
    // Get all saved sessions from Supabase
    async getSessions(): Promise<ScamperSession[]> {
        try {
            const { data, error } = await supabase
                .from('scamper_sessions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching SCAMPER sessions:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                topic: item.topic,
                context: item.problem || '', // Map problem -> context for backward compatibility
                results: item.results,
                savedIdeas: item.saved_ideas || [],
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getSessions:', error);
            return [];
        }
    },

    // Save a session (insert or update)
    async saveSession(session: ScamperSession): Promise<boolean> {
        try {
            const dbSession = {
                id: session.id,
                topic: session.topic,
                problem: session.context, // Map context -> problem for V2
                results: session.results,
                saved_ideas: session.savedIdeas || [],
                created_at: new Date(session.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('scamper_sessions')
                .upsert(dbSession, { onConflict: 'id' });

            if (error) {
                console.error('Error saving SCAMPER session:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveSession:', error);
            return false;
        }
    },

    // Delete a session
    async deleteSession(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('scamper_sessions')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting SCAMPER session:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteSession:', error);
            return false;
        }
    },

    // Migrate from localStorage (one-time)
    async migrateFromLocalStorage(): Promise<number> {
        try {
            const localData = localStorage.getItem('eng_app_scamper_sessions');
            if (!localData) return 0;

            const sessions: ScamperSession[] = JSON.parse(localData);
            if (!sessions || sessions.length === 0) return 0;

            let migrated = 0;
            for (const session of sessions) {
                const success = await this.saveSession(session);
                if (success) migrated++;
            }

            // Clear localStorage after successful migration
            if (migrated > 0) {
                localStorage.removeItem('eng_app_scamper_sessions');
            }

            return migrated;
        } catch (error) {
            console.error('Error migrating SCAMPER sessions:', error);
            return 0;
        }
    }
};
