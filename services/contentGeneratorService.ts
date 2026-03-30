import { supabase } from '../lib/supabase';
import { ContentHistoryRecord } from '../types';

export const ContentGeneratorService = {
    // Get all content history
    async getContentHistory(): Promise<ContentHistoryRecord[]> {
        try {
            const { data, error } = await supabase
                .from('content_history')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching content history:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                timestamp: new Date(item.created_at).getTime(),
                originalContent: item.original_content,
                selectedPlatforms: item.selected_platforms,
                results: item.results
            }));
        } catch (error) {
            console.error('Error in getContentHistory:', error);
            return [];
        }
    },

    // Add content to history
    async addContentHistory(record: ContentHistoryRecord): Promise<boolean> {
        try {
            const dbRecord = {
                id: record.id,
                original_content: record.originalContent,
                selected_platforms: record.selectedPlatforms,
                results: record.results,
                created_at: new Date(record.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('content_history')
                .insert(dbRecord);

            if (error) {
                console.error('Error adding content history:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in addContentHistory:', error);
            return false;
        }
    },

    // Delete content from history
    async deleteContentHistory(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('content_history')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting content history:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteContentHistory:', error);
            return false;
        }
    }
};
