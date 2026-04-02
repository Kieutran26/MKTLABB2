import { supabase } from '../lib/supabase';

export interface SavedTodo {
    id: string;
    text: string;
    completed: boolean;
    priority: string;
    createdAt: number;
}

export const TodoService = {
    async getTodos(): Promise<SavedTodo[]> {
        try {
            const { data, error } = await supabase
                .from('todos')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching todos:', error);
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
            console.error('Error in getTodos:', error);
            return [];
        }
    },

    async addTodo(todo: any): Promise<boolean> {
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
                console.error('Error adding todo:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in addTodo:', error);
            return false;
        }
    },

    async toggleTodo(id: string, completed: boolean): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('todos')
                .update({ completed: !completed })
                .eq('id', id);

            if (error) {
                console.error('Error toggling todo:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in toggleTodo:', error);
            return false;
        }
    },

    async deleteTodo(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting todo:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteTodo:', error);
            return false;
        }
    },

    async clearCompleted(): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('todos')
                .delete()
                .eq('completed', true);

            if (error) {
                console.error('Error clearing completed todos:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in clearCompleted:', error);
            return false;
        }
    }
};
