import { supabase } from '../lib/supabase';
import { MindmapProject } from '../types';

export const MindmapService = {
    // Get all saved mindmaps from Supabase
    async getMindmaps(): Promise<MindmapProject[]> {
        try {
            const { data, error } = await supabase
                .from('mindmaps')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) {
                console.error('Error fetching mindmaps:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                nodes: item.nodes,
                edges: item.edges,
                viewport: item.viewport,
                createdAt: new Date(item.created_at).getTime(),
                updatedAt: new Date(item.updated_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getMindmaps:', error);
            return [];
        }
    },

    // Save a mindmap (insert or update)
    async saveMindmap(project: MindmapProject): Promise<boolean> {
        try {
            const dbMindmap = {
                id: project.id,
                name: project.name,
                nodes: project.nodes,
                edges: project.edges,
                viewport: project.viewport || null,
                created_at: new Date(project.createdAt).toISOString(),
                updated_at: new Date(project.updatedAt).toISOString()
            };

            const { error } = await supabase
                .from('mindmaps')
                .upsert(dbMindmap, { onConflict: 'id' });

            if (error) {
                console.error('Error saving mindmap:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveMindmap:', error);
            return false;
        }
    },

    // Delete a mindmap
    async deleteMindmap(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('mindmaps')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting mindmap:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteMindmap:', error);
            return false;
        }
    },

    // Migrate from localStorage (one-time)
    async migrateFromLocalStorage(): Promise<number> {
        try {
            const localData = localStorage.getItem('eng_app_mindmaps');
            if (!localData) return 0;

            const mindmaps: MindmapProject[] = JSON.parse(localData);
            if (!mindmaps || mindmaps.length === 0) return 0;

            let migrated = 0;
            for (const mindmap of mindmaps) {
                const success = await this.saveMindmap(mindmap);
                if (success) migrated++;
            }

            // Clear localStorage after successful migration
            if (migrated > 0) {
                localStorage.removeItem('eng_app_mindmaps');
            }

            return migrated;
        } catch (error) {
            console.error('Error migrating mindmaps:', error);
            return 0;
        }
    }
};
