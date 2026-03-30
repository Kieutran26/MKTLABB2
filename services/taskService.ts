import { supabase } from '../lib/supabase';

export interface Task {
    id: string;
    text: string;
    completed: boolean;
    createdAt: number;
}

const STORAGE_KEY = 'homepage_tasks';

export const TaskService = {
    // Get all tasks from Supabase
    async getTasks(): Promise<Task[]> {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching tasks:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                text: item.text,
                completed: item.completed,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getTasks:', error);
            return [];
        }
    },

    // Add a new task
    async addTask(task: Task): Promise<boolean> {
        try {
            const dbTask = {
                id: task.id,
                text: task.text,
                completed: task.completed,
                created_at: new Date(task.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('tasks')
                .insert(dbTask);

            if (error) {
                console.error('Error adding task:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in addTask:', error);
            return false;
        }
    },

    // Update a task (toggle completed)
    async updateTask(id: string, completed: boolean): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ completed })
                .eq('id', id);

            if (error) {
                console.error('Error updating task:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in updateTask:', error);
            return false;
        }
    },

    // Delete a task
    async deleteTask(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting task:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteTask:', error);
            return false;
        }
    },

    // Migrate from localStorage (one-time)
    async migrateFromLocalStorage(): Promise<number> {
        try {
            const localData = localStorage.getItem(STORAGE_KEY);
            if (!localData) return 0;

            const tasks: Task[] = JSON.parse(localData);
            if (!tasks || tasks.length === 0) return 0;

            let migrated = 0;
            for (const task of tasks) {
                const success = await this.addTask(task);
                if (success) migrated++;
            }

            // Clear localStorage after successful migration
            if (migrated > 0) {
                localStorage.removeItem(STORAGE_KEY);
            }

            return migrated;
        } catch (error) {
            console.error('Error migrating tasks:', error);
            return 0;
        }
    }
};
