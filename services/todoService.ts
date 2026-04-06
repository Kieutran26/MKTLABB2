import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface SavedTodo {
    id: string;
    text: string;
    completed: boolean;
    priority: string;
    createdAt: number;
    deadline?: string | null;
    note?: string | null;
}

/** Readable PostgREST / Supabase error for logs (avoids `[Object]` in DevTools). */
function formatSupabaseErr(err: {
    message?: string;
    code?: string;
    details?: string;
    hint?: string;
}): string {
    const parts = [
        err.message,
        err.code ? `code=${err.code}` : '',
        err.details ? `details=${err.details}` : '',
        err.hint ? `hint=${err.hint}` : '',
    ].filter(Boolean);
    return parts.join(' | ') || 'unknown error';
}

export const TodoService = {
    async getTodos(): Promise<SavedTodo[]> {
        if (!isSupabaseConfigured) {
            return [];
        }
        try {
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                const code = (error as { code?: string }).code;
                if (code === 'PGRST205') {
                    console.info(
                        '[todos] table `public.todos` missing — run docs/legacy-sql/supabase-todos.sql in Supabase SQL editor (optional).'
                    );
                } else {
                    console.warn(
                        '[todos] fetch failed:',
                        formatSupabaseErr(error),
                        '(create table `todos` in Supabase or check RLS policies)'
                    );
                }
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                text: item.text,
                completed: item.completed,
                priority: item.priority,
                deadline: item.deadline,
                note: item.note,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.warn('[todos] getTodos exception:', error);
            return [];
        }
    },

    async addTodo(todo: any): Promise<boolean> {
        if (!isSupabaseConfigured) return false;
        try {
            const dbTodo = {
                id: todo.id,
                text: todo.text,
                completed: todo.completed,
                priority: todo.priority,
                deadline: todo.deadline || null,
                note: todo.note || null,
                created_at: new Date(todo.createdAt || Date.now()).toISOString()
            };

            const { error } = await supabase
                .from('todos')
                .insert(dbTodo);

            if (error) {
                console.warn('[todos] add failed:', formatSupabaseErr(error));
                return false;
            }

            return true;
        } catch (error) {
            console.warn('[todos] addTodo exception:', error);
            return false;
        }
    },

    async toggleTodo(id: string, completed: boolean): Promise<boolean> {
        if (!isSupabaseConfigured) return false;
        try {
            const { error } = await supabase
                .from('todos')
                .update({ completed: !completed })
                .eq('id', id);

            if (error) {
                console.warn('[todos] toggle failed:', formatSupabaseErr(error));
                return false;
            }

            return true;
        } catch (error) {
            console.warn('[todos] toggleTodo exception:', error);
            return false;
        }
    },

    async deleteTodo(id: string): Promise<boolean> {
        if (!isSupabaseConfigured) return false;
        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', id);

            if (error) {
                console.warn('[todos] delete failed:', formatSupabaseErr(error));
                return false;
            }

            return true;
        } catch (error) {
            console.warn('[todos] deleteTodo exception:', error);
            return false;
        }
    },

    async clearCompleted(): Promise<boolean> {
        if (!isSupabaseConfigured) return false;
        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('completed', true);

            if (error) {
                console.warn('[todos] clearCompleted failed:', formatSupabaseErr(error));
                return false;
            }

            return true;
        } catch (error) {
            console.warn('[todos] clearCompleted exception:', error);
            return false;
        }
    }
};
