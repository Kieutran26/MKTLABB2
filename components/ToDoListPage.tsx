import React, { useState } from 'react';
import { useTasks } from './TaskContext';
import {
    CheckCircle2, Circle, Plus, Trash2, Check, PieChart,
    BarChart3, TrendingUp, Calendar, Clock, Target,
    ListTodo, Sparkles
} from 'lucide-react';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

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
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            {/* ── Standardized Header ────────────────────────────────────────── */}
            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 lg:flex-row lg:items-start lg:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <ListTodo size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Personal Productivity
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        To-Do List
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Quản lý công việc và theo dõi tiến độ của bạn một cách khoa học.
                    </p>
                </div>
            </header>

            {/* ── Scrollable Content Area ───────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-8 md:px-8">
                <div className="mx-auto max-w-7xl">

                {/* Stats Cards Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className={`${cardClass} p-5`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-stone-100 p-2 rounded-xl">
                                <Target size={18} className="text-stone-600" />
                            </div>
                            <span className="text-sm text-stone-500">Tổng cộng</span>
                        </div>
                        <div className="text-3xl font-semibold text-stone-900">{totalTasks}</div>
                    </div>

                    <div className={`${cardClass} p-5`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-emerald-100 p-2 rounded-xl">
                                <CheckCircle2 size={18} className="text-emerald-600" />
                            </div>
                            <span className="text-sm text-stone-500">Hoàn thành</span>
                        </div>
                        <div className="text-3xl font-bold text-emerald-600">{completedTasks}</div>
                    </div>

                    <div className={`${cardClass} p-5`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-amber-100 p-2 rounded-xl">
                                <Clock size={18} className="text-amber-600" />
                            </div>
                            <span className="text-sm text-stone-500">Chờ xử lý</span>
                        </div>
                        <div className="text-3xl font-bold text-amber-500">{pendingTasks}</div>
                    </div>

                    <div className={`${cardClass} p-5`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="bg-stone-100 p-2 rounded-xl">
                                <TrendingUp size={18} className="text-stone-600" />
                            </div>
                            <span className="text-sm text-stone-500">Tỷ lệ hoàn thành</span>
                        </div>
                        <div className="text-3xl font-semibold text-stone-900">{completionRate}%</div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Task List */}
                    <div className={`lg:col-span-2 ${cardClass} p-6`}>
                        {/* Add Task Input */}
                        <div className="flex gap-2 mb-6">
                            <input
                                type="text"
                                value={newTaskText}
                                onChange={(e) => setNewTaskText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                placeholder="Thêm công việc mới..."
                                className={`flex-1 ${inputClass}`}
                            />
                            <button
                                onClick={handleAddTask}
                                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                            >
                                <Plus size={18} /> Thêm
                            </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="mb-4 inline-flex gap-1 rounded-full border border-stone-200 bg-stone-50 p-1">
                            {(['all', 'pending', 'completed'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${filter === f
                                        ? 'bg-stone-900 text-white'
                                        : 'text-stone-600 hover:bg-white'
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
                                <div className="text-center py-12 text-stone-400">
                                    <Circle size={48} className="mx-auto mb-3 opacity-50" />
                                    <p className="text-sm">Không có công việc nào</p>
                                </div>
                            ) : (
                                filteredTasks.map(task => (
                                    <div
                                        key={task.id}
                                        className={`group flex items-center gap-4 rounded-2xl border p-4 transition-colors ${task.completed
                                            ? 'border-stone-200 bg-stone-50/70'
                                            : 'border-stone-200/90 bg-white hover:bg-stone-50/50'
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleTask(task.id)}
                                            className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${task.completed
                                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                                : 'border-stone-300 hover:border-stone-500 hover:bg-stone-50'
                                                }`}
                                        >
                                            {task.completed && <Check size={14} />}
                                        </button>
                                        <div className="flex-1">
                                            <span className={`text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                                                }`}>
                                                {task.text}
                                            </span>
                                            <div className="mt-1 text-xs text-stone-400">
                                                {new Date(task.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-rose-500 transition-all p-2"
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
                                className="mt-4 w-full rounded-xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50 hover:text-rose-600"
                            >
                                Xóa {completedTasks} task đã hoàn thành
                            </button>
                        )}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-6">
                        {/* Progress Donut */}
                        <div className={`${cardClass} p-6`}>
                            <h3 className="flex items-center gap-2 mb-4 text-sm font-medium text-stone-900">
                                <PieChart size={18} className="text-stone-500" />
                                Tiến độ tổng thể
                            </h3>

                            <div className="flex flex-col items-center">
                                <div className="relative w-32 h-32 mb-4">
                                    <div
                                        className="w-full h-full rounded-full"
                                        style={{
                                            background: totalTasks > 0
                                                ? `conic-gradient(#10b981 0deg ${completionRate * 3.6}deg, #fbbf24 ${completionRate * 3.6}deg 360deg)`
                                                : 'conic-gradient(#e7e5e4 0deg 360deg)'
                                        }}
                                    />
                                    <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-2xl font-semibold text-stone-900">{completionRate}%</div>
                                            <div className="text-xs text-stone-400">hoàn thành</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-6 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                        <span className="text-stone-600">Xong ({completedTasks})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                                        <span className="text-stone-600">Chờ ({pendingTasks})</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Today's Progress */}
                        <div className={`${cardClass} p-6`}>
                            <h3 className="flex items-center gap-2 mb-4 text-sm font-medium text-stone-900">
                                <Calendar size={18} className="text-stone-500" />
                                Hôm nay
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-stone-500">Task tạo mới</span>
                                    <span className="font-semibold text-stone-900">{todayTasks.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-stone-500">Đã hoàn thành</span>
                                    <span className="font-bold text-emerald-600">{todayCompleted}</span>
                                </div>

                                <div className="pt-2">
                                    <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-stone-900 rounded-full transition-all"
                                            style={{ width: todayTasks.length > 0 ? `${(todayCompleted / todayTasks.length) * 100}%` : '0%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Week Stats */}
                        <div className={`${cardClass} p-6`}>
                            <h3 className="flex items-center gap-2 mb-4 text-sm font-medium text-stone-900">
                                <BarChart3 size={18} className="text-stone-500" />
                                Tuần này
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-stone-500">Tổng task</span>
                                    <span className="font-semibold text-stone-900">{weekTasks.length}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-stone-500">Hoàn thành</span>
                                    <span className="font-bold text-emerald-600">{weekCompleted}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-stone-500">Năng suất</span>
                                    <span className="font-semibold text-stone-900">
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
                                                className="flex-1 bg-stone-200 rounded-t transition-all hover:bg-stone-400"
                                                style={{ height: `${Math.min(height, 48)}px` }}
                                                title={`${dayAgo.toLocaleDateString('vi-VN')}: ${dayTasks} task`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-xs text-stone-400">
                                    <span>7 ngày trước</span>
                                    <span>Hôm nay</span>
                                </div>
                            </div>
                        </div>

                        {/* Motivation */}
                        {completionRate >= 80 && (
                            <div className="rounded-2xl border border-stone-200 bg-white p-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-100 text-stone-600">
                                    <Sparkles size={18} />
                                </div>
                                <span className="font-medium text-stone-900">Tuyệt vời!</span>
                            </div>
                            <p className="text-sm text-stone-600">
                                Bạn đã hoàn thành {completionRate}% công việc. Tiếp tục phát huy!
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
</div>
    );
};

export default ToDoListPage;
