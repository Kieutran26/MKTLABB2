import { supabase } from '../lib/supabase';
import { VocabSet, Word } from '../types';

export interface SavedVocabSet {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
    updatedAt: number;
}

export interface SavedWord {
    id: string;
    setId: string;
    english: string;
    vietnamese: string;
    example?: string;
    starred: boolean;
    createdAt: number;
}

export const VocabService = {
    // ===== VOCAB SETS =====
    async getVocabSets(): Promise<SavedVocabSet[]> {
        try {
            const { data, error } = await supabase
                .from('vocab_sets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching vocab sets:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                createdAt: new Date(item.created_at).getTime(),
                updatedAt: new Date(item.updated_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getVocabSets:', error);
            return [];
        }
    },

    async saveVocabSet(vocabSet: SavedVocabSet): Promise<boolean> {
        try {
            const dbSet = {
                id: vocabSet.id,
                name: vocabSet.name,
                description: vocabSet.description,
                created_at: new Date(vocabSet.createdAt).toISOString(),
                updated_at: new Date(vocabSet.updatedAt).toISOString()
            };

            const { error } = await supabase
                .from('vocab_sets')
                .upsert(dbSet, { onConflict: 'id' });

            if (error) {
                console.error('Error saving vocab set:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveVocabSet:', error);
            return false;
        }
    },

    async deleteVocabSet(id: string): Promise<boolean> {
        try {
            // Cascade delete will handle words automatically
            const { error } = await supabase
                .from('vocab_sets')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting vocab set:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteVocabSet:', error);
            return false;
        }
    },

    // ===== WORDS =====
    async getWords(): Promise<SavedWord[]> {
        try {
            const { data, error } = await supabase
                .from('words')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching words:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                setId: item.set_id,
                english: item.english,
                vietnamese: item.vietnamese,
                example: item.example,
                starred: item.starred,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getWords:', error);
            return [];
        }
    },

    async getWordsBySet(setId: string): Promise<SavedWord[]> {
        try {
            const { data, error } = await supabase
                .from('words')
                .select('*')
                .eq('set_id', setId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching words by set:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                setId: item.set_id,
                english: item.english,
                vietnamese: item.vietnamese,
                example: item.example,
                starred: item.starred,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getWordsBySet:', error);
            return [];
        }
    },

    async getStarredWords(): Promise<SavedWord[]> {
        try {
            const { data, error } = await supabase
                .from('words')
                .select('*')
                .eq('starred', true)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching starred words:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                setId: item.set_id,
                english: item.english,
                vietnamese: item.vietnamese,
                example: item.example,
                starred: item.starred,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getStarredWords:', error);
            return [];
        }
    },

    async saveWord(word: SavedWord): Promise<boolean> {
        try {
            const dbWord = {
                id: word.id,
                set_id: word.setId,
                english: word.english,
                vietnamese: word.vietnamese,
                example: word.example,
                starred: word.starred,
                created_at: new Date(word.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('words')
                .upsert(dbWord, { onConflict: 'id' });

            if (error) {
                console.error('Error saving word:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveWord:', error);
            return false;
        }
    },

    async saveWords(words: SavedWord[]): Promise<boolean> {
        try {
            const dbWords = words.map(word => ({
                id: word.id,
                set_id: word.setId,
                english: word.english,
                vietnamese: word.vietnamese,
                example: word.example,
                starred: word.starred,
                created_at: new Date(word.createdAt).toISOString()
            }));

            const { error } = await supabase
                .from('words')
                .upsert(dbWords, { onConflict: 'id' });

            if (error) {
                console.error('Error saving words:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveWords:', error);
            return false;
        }
    },

    async deleteWord(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('words')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting word:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteWord:', error);
            return false;
        }
    },

    async toggleStar(id: string, starred: boolean): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('words')
                .update({ starred: !starred })
                .eq('id', id);

            if (error) {
                console.error('Error toggling star:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in toggleStar:', error);
            return false;
        }
    }
};
