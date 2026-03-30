import { supabase } from '../lib/supabase';
import { EmailDocument, SavedEmailDesign } from '../types';

const TABLE_NAME = 'email_designs';

// Database row type
interface EmailDesignRow {
    id: string;
    name: string;
    doc: EmailDocument;
    created_at: string;
    updated_at: string;
}

// Convert DB row to SavedEmailDesign
const rowToDesign = (row: EmailDesignRow): SavedEmailDesign => ({
    id: row.id,
    name: row.name,
    doc: row.doc,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
});

export const emailDesignService = {
    /**
     * Get all saved email designs (ordered by updated_at DESC)
     */
    async getAll(): Promise<SavedEmailDesign[]> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching email designs:', error);
            return [];
        }

        return (data || []).map(rowToDesign);
    },

    /**
     * Save (upsert) an email design
     */
    async save(design: SavedEmailDesign): Promise<boolean> {
        const { error } = await supabase
            .from(TABLE_NAME)
            .upsert({
                id: design.id,
                name: design.name,
                doc: design.doc,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'id' });

        if (error) {
            console.error('Error saving email design:', error);
            return false;
        }

        return true;
    },

    /**
     * Delete an email design by ID
     */
    async delete(id: string): Promise<boolean> {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting email design:', error);
            return false;
        }

        return true;
    },

    /**
     * Get a single design by ID
     */
    async getById(id: string): Promise<SavedEmailDesign | null> {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .eq('id', id)
            .eq('id', id)
            .single();

        if (data) {
            console.log(`[DEBUG] Service getById(${id}) found:`, data.name);
            // Ensure doc is valid
            if (!data.doc || !data.doc.blocks) {
                console.warn('[DEBUG] WARNING: Service returned design with empty/invalid doc!');
            }
        } else {
            console.log(`[DEBUG] Service getById(${id}) NOT FOUND`);
        }

        if (error) {
            console.error('Error fetching email design:', error);
            return null;
        }

        return data ? rowToDesign(data) : null;
    }
};
