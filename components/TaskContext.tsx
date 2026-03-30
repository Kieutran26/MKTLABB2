import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { TodoService } from '../services/todoService';
import { ToDoTask as Task } from '../types';

interface TaskContextType {
    tasks: Task[];
    addTask: (text: string) => void;
    toggleTask: (id: string) => void;
    deleteTask: (id: string) => void;
    clearCompleted: () => void;
    isLoading: boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load tasks from Supabase on mount
    useEffect(() => {
        const loadTasks = async () => {
            setIsLoading(true);
            const data = await TodoService.getTodos();
            setTasks(data as any);
            setIsLoading(false);
        };
        loadTasks();
    }, []);

    // OPTIMISTIC UPDATE functions
    const addTask = (text: string) => {
        if (!text.trim()) return;
        const newTask: any = {
            id: Date.now().toString(),
            text: text.trim(),
            completed: false,
            priority: 'medium',
            createdAt: Date.now()
        };

        // Optimistic: Update UI immediately
        setTasks(prev => [newTask, ...prev]);

        // Then sync to DB in background
        TodoService.addTodo(newTask).catch(err => {
            console.error('Failed to save task:', err);
            // Rollback if failed
            setTasks(prev => prev.filter(t => t.id !== newTask.id));
        });
    };

    const toggleTask = (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        // Optimistic: Update UI immediately
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));

        // Then sync to DB
        TodoService.toggleTodo(id, task.completed).catch(err => {
            console.error('Failed to update task:', err);
            // Rollback if failed
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: task.completed } : t));
        });
    };

    const deleteTask = (id: string) => {
        const taskToDelete = tasks.find(t => t.id === id);

        // Optimistic: Remove from UI immediately
        setTasks(prev => prev.filter(t => t.id !== id));

        // Then sync to DB
        TodoService.deleteTodo(id).catch(err => {
            console.error('Failed to delete task:', err);
            // Rollback if failed
            if (taskToDelete) {
                setTasks(prev => [...prev, taskToDelete]);
            }
        });
    };

    const clearCompleted = () => {
        const completedIds = tasks.filter(t => t.completed).map(t => t.id);
        setTasks(prev => prev.filter(t => !t.completed));

        TodoService.clearCompleted().catch(console.error);
    };

    return (
        <TaskContext.Provider value={{ tasks, addTask, toggleTask, deleteTask, clearCompleted, isLoading }}>
            {children}
        </TaskContext.Provider>
    );
};

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};
