
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X, ListTodo, Calendar, AlertCircle, AlignLeft, Clock } from 'lucide-react';
import { ToDoTask } from '../types';
import { TodoService, SavedTodo } from '../services/todoService';

const ToDoList: React.FC = () => {
    const [tasks, setTasks] = useState<ToDoTask[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [taskText, setTaskText] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [deadline, setDeadline] = useState('');
    const [note, setNote] = useState('');

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        setLoading(true);
        const savedTodos = await TodoService.getTodos();
        // Convert SavedTodo to ToDoTask format
        setTasks(savedTodos.map(t => ({
            id: t.id,
            text: t.text,
            completed: t.completed,
            createdAt: t.createdAt,
            priority: t.priority as 'low' | 'medium' | 'high',
            deadline: undefined,
            note: undefined
        })));
        setLoading(false);
    };

    const handleAddTask = async () => {
        if (!taskText.trim()) return;

        const newTodo: SavedTodo = {
            id: Date.now().toString(),
            text: taskText.trim(),
            completed: false,
            priority,
            createdAt: Date.now()
        };

        const success = await TodoService.addTodo(newTodo);
        if (success) {
            const newTask: ToDoTask = {
                id: newTodo.id,
                text: newTodo.text,
                completed: newTodo.completed,
                createdAt: newTodo.createdAt,
                priority: priority,
                deadline: deadline || undefined,
                note: note.trim() || undefined
            };
            setTasks([newTask, ...tasks]);
            resetForm();
            setShowModal(false);
        }
    };

    const resetForm = () => {
        setTaskText('');
        setPriority('medium');
        setDeadline('');
        setNote('');
    };

    const handleToggle = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            const success = await TodoService.toggleTodo(id, task.completed);
            if (success) {
                setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Xóa công việc này?')) {
            const success = await TodoService.deleteTodo(id);
            if (success) {
                setTasks(tasks.filter(t => t.id !== id));
            }
        }
    };

    const handleClearCompleted = async () => {
        if (confirm('Xóa tất cả công việc đã hoàn thành?')) {
            const success = await TodoService.clearCompleted();
            if (success) {
                setTasks(tasks.filter(t => !t.completed));
            }
        }
    };

    // Sort: Incomplete first, then by priority (High -> Low), then by deadline, then by creation date
    const sortedTasks = [...tasks].sort((a, b) => {
        // 1. Completed status (Incomplete first)
        if (a.completed !== b.completed) return a.completed ? 1 : -1;

        // 2. Priority (High > Medium > Low)
        const pMap = { high: 3, medium: 2, low: 1 };
        if (pMap[a.priority] !== pMap[b.priority]) {
            return pMap[b.priority] - pMap[a.priority];
        }

        // 3. Deadline (Earliest first, non-deadline last)
        if (a.deadline && b.deadline) return a.deadline.localeCompare(b.deadline);
        if (a.deadline) return -1;
        if (b.deadline) return 1;

        // 4. Created Date (Newest first)
        return b.createdAt - a.createdAt;
    });

    const getPriorityColor = (p: string) => {
        switch (p) {
            case 'high': return 'text-red-600 bg-red-50 border-red-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-slate-500 bg-slate-100 border-slate-200';
            default: return 'text-slate-500';
        }
    };

    const getPriorityLabel = (p: string) => {
        switch (p) {
            case 'high': return 'Cao';
            case 'medium': return 'TB';
            case 'low': return 'Thấp';
            default: return '';
        }
    };

    return (
        <div className="max-w-4xl mx-auto pt-10 px-4 pb-20">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
                    <ListTodo className="text-slate-700" strokeWidth={1.5} />
                    To-Do List
                </h2>
                <div className="flex gap-2">
                    {tasks.some(t => t.completed) && (
                        <button
                            onClick={handleClearCompleted}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-sm border border-transparent hover:border-red-100"
                        >
                            Xóa đã xong
                        </button>
                    )}
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)]"
                    >
                        <Plus size={20} strokeWidth={1.5} /> Thêm việc
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {sortedTasks.map(task => (
                    <div
                        key={task.id}
                        className={`group flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200
                    ${task.completed
                                ? 'bg-slate-50 border-slate-100 opacity-60'
                                : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-100'
                            }`}
                    >
                        <button
                            onClick={() => handleToggle(task.id)}
                            className={`mt-1 min-w-[24px] h-6 rounded-full border-2 flex items-center justify-center transition-all
                        ${task.completed
                                    ? 'bg-green-500 border-green-500 text-white'
                                    : 'border-slate-300 hover:border-indigo-500 text-transparent'
                                }`}
                        >
                            <Check size={14} strokeWidth={3} />
                        </button>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                                <div className={`text-lg font-medium leading-tight ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                    {task.text}
                                </div>
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                    {getPriorityLabel(task.priority)}
                                </span>
                            </div>

                            {(task.deadline || task.note) && (
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-500">
                                    {task.deadline && (
                                        <div className={`flex items-center gap-1.5 ${new Date(task.deadline) < new Date() && !task.completed ? 'text-red-500 font-medium' : ''}`}>
                                            <Clock size={14} strokeWidth={1.5} />
                                            <span>{new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    )}
                                    {task.note && (
                                        <div className="flex items-center gap-1.5 max-w-full">
                                            <AlignLeft size={14} strokeWidth={1.5} className="flex-shrink-0" />
                                            <span className="truncate">{task.note}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => handleDelete(task.id)}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        >
                            <Trash2 size={18} strokeWidth={1.5} />
                        </button>
                    </div>
                ))}

                {tasks.length === 0 && (
                    <div className="text-center py-20 text-slate-400">
                        <ListTodo className="mx-auto mb-4 opacity-30" size={56} strokeWidth={1} />
                        <p>Chưa có công việc nào.</p>
                        <button onClick={() => setShowModal(true)} className="text-indigo-600 font-medium hover:underline mt-2">
                            Thêm công việc đầu tiên
                        </button>
                    </div>
                )}
            </div>

            {/* Add Task Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col border border-slate-100">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">Thêm công việc mới</h3>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={24} strokeWidth={1.5} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Tên công việc <span className="text-red-500">*</span></label>
                                <input
                                    autoFocus
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    placeholder="Ví dụ: Học 20 từ vựng mới..."
                                    value={taskText}
                                    onChange={e => setTaskText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddTask()}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Độ quan trọng</label>
                                    <select
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 bg-white transition-all"
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                    >
                                        <option value="low">Thấp</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="high">Cao</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Hạn chót (Deadline)</label>
                                    <input
                                        type="date"
                                        className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-slate-600"
                                        value={deadline}
                                        onChange={e => setDeadline(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">Ghi chú thêm</label>
                                <textarea
                                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-24 resize-none"
                                    placeholder="Chi tiết công việc..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="p-5 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-3xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 text-slate-500 font-medium hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddTask}
                                className="flex-1 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-soft"
                            >
                                Thêm việc
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ToDoList;
