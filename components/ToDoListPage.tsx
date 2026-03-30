import React, { useState } from 'react';
import { useTasks } from './TaskContext';
import {
    CheckCircle2, Circle, Plus, Trash2, Check, PieChart,
    BarChart3, TrendingUp, Calendar, Clock, Target,
    ListTodo, Sparkles
} from 'lucide-react';

const ToDoListPage: React.FC = () => {
    // Use shared TaskContext
    const { tasks, addTask, toggleTask, deleteTask, clearCompleted } = useTasks();
    const [newTaskText, setNewTaskText] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

    // Handle add task with text input
    const handleAddTask = () => {
        if (!newTaskText.trim()) return;
        addTask(newTaskText);
        setNewTaskText('');
    };

    // Calculate metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Today's tasks
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTasks = tasks.filter(t => new Date(t.createdAt) >= today);
    const todayCompleted = todayTasks.filter(t => t.completed).length;

    // This week's productivity (simple calculation)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekTasks = tasks.filter(t => new Date(t.createdAt) >= weekAgo);
    const weekCompleted = weekTasks.filter(t => t.completed).length;

    // Filtered tasks
    const filteredTasks = tasks.filter(t => {
        if (filter === 'pending') return !t.completed;
        if (filter === 'completed') return t.completed;
        return true;
    });

    return (
        <div className="min-h-screen bg-soft-bg p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="bg-indigo-100 p-3 rounded-2xl">
                            <ListTodo size={28} className="text-indigo-600" />
                        </div>
                        To-Do List
                    </h1>
                    <p className="text-slate-500 mt-2">Quản lý công việc và theo dõi tiến độ của bạn</p>
                </div>

                {/* Stats Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-2xl border border-soft-border p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-indigo-100 p-2 rounded-xl">
                                <Target size={18} className="text-indigo-600" />
                            </div>
                            <span className="text-sm text-slate-500">Tổng cộng</span>
                        </div>
                        <div className="text-3xl font-bold text-slate-800">{totalTasks}</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-soft-border p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-emerald-100 p-2 rounded-xl">
                                <CheckCircle2 size={18} className="text-emerald-600" />
                            </div>
                            <span className="text-sm text-slate-500">Hoàn thành</span>
                        </div>
                        <div className="text-3xl font-bold text-emerald-600">{completedTasks}</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-soft-border p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-amber-100 p-2 rounded-xl">
                                <Clock size={18} className="text-amber-600" />
                            </div>
                            <span className="text-sm text-slate-500">Chờ xử lý</span>
                        </div>
                        <div className="text-3xl font-bold text-amber-500">{pendingTasks}</div>
                    </div>

                    <div className="bg-white rounded-2xl border border-soft-border p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-pink-100 p-2 rounded-xl">
                                <TrendingUp size={18} className="text-pink-600" />
                            </div>
                            <span className="text-sm text-slate-500">Tỷ lệ hoàn thành</span>
                        </div>
                        <div className="text-3xl font-bold text-pink-600">{completionRate}%</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Task List */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-soft-border p-6">
                        {/* Add Task Input */}
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                placeholder="Thêm công việc mới..."
                                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all"
                            />
                            <button
                                onClick={handleAddTask}
                                className="bg-indigo-600 text-white px-5 py-3 rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-medium"
                            >
                                <Plus size={18} /> Thêm
                            </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex gap-2 mb-4">
                            {(['all', 'pending', 'completed'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                >
                                    {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chờ xử lý' : 'Hoàn thành'}
                                    <span className="ml-1 opacity-70">
                                        ({f === 'all' ? totalTasks : f === 'pending' ? pendingTasks : completedTasks})
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Task List */}
                        <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                            {filteredTasks.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <Circle size={48} className="mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">Không có công việc nào</p>
                                </div>
                            ) : (
                                filteredTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all group ${task.completed
                                            ? 'bg-emerald-50 border-emerald-100'
                                            : 'bg-white border-slate-100 hover:border-slate-200 hover:shadow-sm'
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleTask(task.id)}
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${task.completed
                                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                                : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50'
                                                }`}
                                        >
                                            {task.completed && <Check size={14} />}
                                        </button>
                                        <div className="flex-1">
                                            <span className={`text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                                                }`}>
                                                {task.text}
                                            </span>
                                            <div className="text-xs text-slate-400 mt-1">
                                                {new Date(task.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-2"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Clear Completed Button */}
                        {completedTasks > 0 && (
                            <button
                                onClick={clearCompleted}
                                className="mt-4 w-full py-3 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            >
                                Xóa {completedTasks} task đã hoàn thành
                            </button>
                        )}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        {/* Progress Donut */}
                        <div className="bg-white rounded-2xl border border-soft-border p-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <PieChart size={18} className="text-indigo-500" />
                                Tiến độ tổng thể
                            </h3>

                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32 mb-4">
                                    <div
                                        className="w-full h-full rounded-full"
                                        style={{
                                            background: totalTasks > 0
                                                ? `conic-gradient(#10b981 0deg ${completionRate * 3.6}deg, #fbbf24 ${completionRate * 3.6}deg 360deg)`
                                                : 'conic-gradient(#e2e8f0 0deg 360deg)'
                                        }}
                                    />
                                    <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-slate-800">{completionRate}%</div>
                                            <div className="text-xs text-slate-400">hoàn thành</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-slate-600">Xong ({completedTasks})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                        <span className="text-slate-600">Chờ ({pendingTasks})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Today's Progress */}
                        <div className="bg-white rounded-2xl border border-soft-border p-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Calendar size={18} className="text-pink-500" />
                                Hôm nay
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Task tạo mới</span>
                                    <span className="font-bold text-slate-800">{todayTasks.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Đã hoàn thành</span>
                                    <span className="font-bold text-emerald-600">{todayCompleted}</span>
                                </div>

                                <div className="pt-2">
                                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-pink-400 to-pink-500 rounded-full transition-all"
                                            style={{ width: todayTasks.length > 0 ? `${(todayCompleted / todayTasks.length) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Week Stats */}
                        <div className="bg-white rounded-2xl border border-soft-border p-6">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <BarChart3 size={18} className="text-indigo-500" />
                                Tuần này
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Tổng task</span>
                                    <span className="font-bold text-slate-800">{weekTasks.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Hoàn thành</span>
                                    <span className="font-bold text-emerald-600">{weekCompleted}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-slate-500">Năng suất</span>
                                    <span className="font-bold text-indigo-600">
                                        {weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0}%
                                    </span>
                                </div>

                                {/* Mini bar chart simulation */}
                                <div className="pt-2 flex items-end gap-1 h-12">
                                    {[...Array(7)].map((_, i) => {
                                        const dayAgo = new Date();
                                        dayAgo.setDate(dayAgo.getDate() - (6 - i));
                                        dayAgo.setHours(0, 0, 0, 0);
                                        const nextDay = new Date(dayAgo);
                                        nextDay.setDate(nextDay.getDate() + 1);

                                        const dayTasks = tasks.filter(t => {
                                            const d = new Date(t.createdAt);
                                            return d >= dayAgo && d < nextDay && t.completed;
                                        }).length;

                                        const height = Math.max(dayTasks * 10, 4);

                                        return (
                                            <div
                                                key={i}
                                                className="flex-1 bg-indigo-200 rounded-t transition-all hover:bg-indigo-400"
                                                style={{ height: `${Math.min(height, 48)}px` }}
                                                title={`${dayAgo.toLocaleDateString('vi-VN')}: ${dayTasks} task`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <span>7 ngày trước</span>
                                    <span>Hôm nay</span>
                                </div>
                            </div>
                        </div>

                        {/* Motivation */}
                        {completionRate >= 80 && (
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white">
                                <div className="flex items-center gap-2 mb-2">
                                    <Sparkles size={20} />
                                    <span className="font-bold">Tuyệt vời!</span>
                                </div>
                                <p className="text-sm opacity-90">
                                    Bạn đã hoàn thành {completionRate}% công việc. Tiếp tục phát huy!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ToDoListPage;
