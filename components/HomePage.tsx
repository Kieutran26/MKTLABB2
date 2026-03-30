import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import TranslationView from './TranslationView';
import { useTasks } from './TaskContext';
import {
    Brain, Lightbulb, Image as ImageIcon, TrendingUp,
    Target, Users, Map, Heart, Zap, PenTool, CalendarDays,
    Mail, MonitorPlay, PieChart, Calculator, Activity,
    ArrowRight, Clock, FileText, CheckCircle2, Circle,
    Plus, Trash2, Check, BarChart3, Layers, Sparkles,
    BookOpen, ChevronRight, Cloud
} from 'lucide-react';

interface HomePageProps {
    setView: (view: ViewState) => void;
}

interface ProgressItem {
    id: string;
    name: string;
    icon: any;
    storageKey: string;
    viewId: ViewState;
    color: string;
    bgColor: string;
}

const HomePage: React.FC<HomePageProps> = ({ setView }) => {
    // Use shared TaskContext
    const { tasks, addTask, toggleTask, deleteTask } = useTasks();
    const [newTaskText, setNewTaskText] = useState('');

    // Progress Data
    const [progressData, setProgressData] = useState<Record<string, number>>({});

    // Tracked tools for metrics
    const trackedTools: ProgressItem[] = [
        { id: 'emotion_map', name: 'Emotion Map', icon: Heart, storageKey: 'emotion_map_history', viewId: 'AUDIENCE_EMOTION_MAP', color: '#ec4899', bgColor: 'bg-pink-50' },
        { id: 'customer_journey', name: 'Customer Journey', icon: Map, storageKey: 'customer_journey_history', viewId: 'CUSTOMER_JOURNEY_MAPPER', color: '#6366f1', bgColor: 'bg-indigo-50' },
        { id: 'pricing', name: 'Pricing Analyzer', icon: TrendingUp, storageKey: 'pricing_analyzer_history', viewId: 'PRICING_ANALYZER', color: '#10b981', bgColor: 'bg-emerald-50' },
        { id: 'auto_brief', name: 'Auto Brief', icon: FileText, storageKey: 'auto_brief_history', viewId: 'AUTO_BRIEF', color: '#8b5cf6', bgColor: 'bg-violet-50' },
        { id: 'scamper', name: 'SCAMPER', icon: Lightbulb, storageKey: 'eng_app_scamper_sessions', viewId: 'SCAMPER_TOOL', color: '#f59e0b', bgColor: 'bg-amber-50' },
        { id: 'mindmap', name: 'Mindmap AI', icon: Brain, storageKey: 'eng_app_mindmaps', viewId: 'MINDMAP_GENERATOR', color: '#3b82f6', bgColor: 'bg-blue-50' },
        { id: 'insight', name: 'Insight Finder', icon: Sparkles, storageKey: 'insight_finder_history', viewId: 'INSIGHT_FINDER', color: '#06b6d4', bgColor: 'bg-cyan-50' },
        { id: 'brand_vault', name: 'Brand Vault', icon: Target, storageKey: 'brand_vault_brands', viewId: 'BRAND_VAULT', color: '#6366f1', bgColor: 'bg-indigo-50' },
    ];

    // Load progress data
    useEffect(() => {
        const data: Record<string, number> = {};
        trackedTools.forEach(tool => {
            try {
                const stored = localStorage.getItem(tool.storageKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    data[tool.id] = Array.isArray(parsed) ? parsed.length : 1;
                } else {
                    data[tool.id] = 0;
                }
            } catch {
                data[tool.id] = 0;
            }
        });
        setProgressData(data);
    }, []);

    // Handle add task with text input
    const handleAddTask = () => {
        if (!newTaskText.trim()) return;
        addTask(newTaskText);
        setNewTaskText('');
    };

    // Calculate metrics
    const totalItems = Object.values(progressData).reduce((a: number, b: number) => a + b, 0);
    const activeTools = trackedTools.filter(t => progressData[t.id] > 0);
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    // Generate donut chart gradient
    const generateDonutGradient = () => {
        if (activeTools.length === 0) return 'conic-gradient(#e2e8f0 0deg 360deg)';

        let currentAngle = 0;
        const segments: string[] = [];

        activeTools.forEach(tool => {
            const itemCount = progressData[tool.id] as number || 0;
            const percentage = (itemCount / totalItems) * 360;
            segments.push(`${tool.color} ${currentAngle}deg ${currentAngle + percentage}deg`);
            currentAngle += percentage;
        });

        return `conic-gradient(${segments.join(', ')})`;
    };

    // Feature guides for upgraded features
    const featureGuides = [
        {
            id: 'SCAMPER_TOOL',
            name: 'SCAMPER V2',
            icon: Lightbulb,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            badge: 'Design Thinking',
            tips: [
                'Nhập Pain Point cụ thể để AI tập trung giải quyết',
                'Ý tưởng theo format Idea Card: Tên + Cách làm + Ví dụ',
                'Ưu tiên Micro-Innovation (thay đổi nhỏ, chi phí thấp)'
            ]
        },
        {
            id: 'MINDMAP_GENERATOR',
            name: 'Mindmap AI V2',
            icon: Brain,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            badge: 'MECE Logic',
            tips: [
                'Nhập Mục tiêu (VD: Kinh doanh) để AI phân nhánh phù hợp',
                'Tuân thủ MECE: Không trùng lặp, Không bỏ sót',
                'Chọn độ sâu 2-4 cấp tùy mục đích'
            ]
        },
        {
            id: 'AUTO_BRIEF',
            name: 'Auto Brief V2',
            icon: FileText,
            color: 'text-violet-600',
            bgColor: 'bg-violet-50',
            badge: 'Budget-Conscious',
            tips: [
                'AI tự động điều chỉnh mục tiêu theo ngân sách',
                'Insight theo format: Desire - Barrier - Opportunity',
                'Execution plan chia 3 phase: Teasing, Booming, Sustain'
            ]
        },
        {
            id: 'INSIGHT_FINDER',
            name: 'Insight Finder V2',
            icon: Sparkles,
            color: 'text-cyan-600',
            bgColor: 'bg-cyan-50',
            badge: 'Consumer Psychology',
            tips: [
                'Output theo công thức: Desire + Barrier = Opportunity',
                'Thêm trường Target Audience để insight chính xác hơn',
                'Mỗi insight đi kèm Emotional Trigger'
            ]
        }
    ];

    const categories = [
        {
            title: 'Strategy & Research',
            icon: Brain,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50',
            description: 'Phân tích thị trường và thấu hiểu khách hàng.',
            tools: [
                { id: 'MASTERMIND_STRATEGY', name: 'Mastermind Strategy', icon: Brain },
                { id: 'CUSTOMER_JOURNEY_MAPPER', name: 'Customer Journey', icon: Map },
                { id: 'PERSONA_BUILDER', name: 'Persona Builder', icon: Users },
                { id: 'AUDIENCE_EMOTION_MAP', name: 'Emotion Map', icon: Heart },
            ]
        },
        {
            title: 'Ideation & Content',
            icon: Lightbulb,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            description: 'Tìm ý tưởng và viết nội dung sáng tạo.',
            tools: [
                { id: 'HOOK_GENERATOR', name: 'Hook Generator', icon: Zap },
                { id: 'CONTENT_WRITER', name: 'Viết Content', icon: PenTool },
                { id: 'SMART_CALENDAR', name: 'Content Calendar', icon: CalendarDays },
                { id: 'SCAMPER_TOOL', name: 'SCAMPER', icon: Lightbulb },
            ]
        },
        {
            title: 'Design & Visuals',
            icon: ImageIcon,
            color: 'text-pink-600',
            bgColor: 'bg-pink-50',
            description: 'Tạo mockup và thiết kế hình ảnh.',
            tools: [
                { id: 'VISUAL_EMAIL', name: 'Visual Email', icon: Mail },
                { id: 'MOCKUP_GENERATOR', name: 'Mockup Generator', icon: MonitorPlay },
                { id: 'KEY_VISUALS_CREATE', name: 'Key Visuals', icon: ImageIcon },
            ]
        },
        {
            title: 'Ads & Performance',
            icon: TrendingUp,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            description: 'Tính toán ngân sách và đo hiệu suất.',
            tools: [
                { id: 'BUDGET_ALLOCATOR', name: 'Budget Allocator', icon: PieChart },
                { id: 'AB_TESTING', name: 'A/B Testing', icon: Calculator },
                { id: 'ADS_HEALTH_CHECKER', name: 'Ads Health', icon: Activity },
                { id: 'ROAS_FORECASTER', name: 'ROAS Forecaster', icon: TrendingUp },
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-soft-bg">
            {/* Translation Section - Primary */}
            <div className="border-b border-soft-border bg-white">
                <TranslationView />
            </div>

            {/* Dashboard Overview - Tasks + Chart */}
            <div className="p-8 border-b border-soft-border">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <BarChart3 className="text-indigo-500" /> Dashboard
                        </h2>
                        <p className="text-slate-500">Quản lý công việc và theo dõi tiến trình sử dụng công cụ.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* To-Do List */}
                        <div className="bg-white rounded-2xl border border-soft-border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <CheckCircle2 size={18} className="text-emerald-500" />
                                    To-Do List
                                </h3>
                                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-medium">
                                    {completedTasks}/{tasks.length} hoàn thành
                                </span>
                            </div>

                            {/* Add Task Input */}
                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                    placeholder="Thêm công việc mới..."
                                    className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 transition-all"
                                />
                                <button
                                    onClick={handleAddTask}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition-all"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Task List */}
                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {tasks.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400">
                                        <Circle size={32} className="mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Chưa có công việc nào</p>
                                    </div>
                                ) : (
                                    tasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${task.completed
                                                ? 'bg-emerald-50 border-emerald-100'
                                                : 'bg-white border-slate-100 hover:border-slate-200'
                                                }`}
                                        >
                                            <button
                                                onClick={() => toggleTask(task.id)}
                                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${task.completed
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-slate-300 hover:border-indigo-500'
                                                    }`}
                                            >
                                                {task.completed && <Check size={12} />}
                                            </button>
                                            <span className={`flex-1 text-sm ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'
                                                }`}>
                                                {task.text}
                                            </span>
                                            <button
                                                onClick={() => deleteTask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Task Stats & Chart */}
                            {tasks.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-4">
                                        {/* Mini Donut Chart */}
                                        <div className="relative w-16 h-16 flex-shrink-0">
                                            <div
                                                className="w-full h-full rounded-full"
                                                style={{
                                                    background: `conic-gradient(#10b981 0deg ${taskCompletionRate * 3.6}deg, #fbbf24 ${taskCompletionRate * 3.6}deg 360deg)`
                                                }}
                                            />
                                            <div className="absolute inset-1.5 bg-white rounded-full flex items-center justify-center">
                                                <span className="text-sm font-bold text-slate-700">{taskCompletionRate}%</span>
                                            </div>
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 bg-emerald-50 rounded-lg">
                                                <div className="text-lg font-bold text-emerald-600">{completedTasks}</div>
                                                <div className="text-xs text-emerald-500">Hoàn thành</div>
                                            </div>
                                            <div className="text-center p-2 bg-amber-50 rounded-lg">
                                                <div className="text-lg font-bold text-amber-500">{pendingTasks}</div>
                                                <div className="text-xs text-amber-400">Chờ xử lý</div>
                                            </div>
                                            <div className="text-center p-2 bg-slate-50 rounded-lg">
                                                <div className="text-lg font-bold text-slate-600">{tasks.length}</div>
                                                <div className="text-xs text-slate-400">Tổng cộng</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-3">
                                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
                                                style={{ width: `${taskCompletionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Combined Progress Charts */}
                        <div className="bg-white rounded-2xl border border-soft-border p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <PieChart size={18} className="text-indigo-500" />
                                    Thống kê tổng quan
                                </h3>
                            </div>

                            {/* Two Charts Row */}
                            <div className="grid grid-cols-2 gap-6 mb-4">
                                {/* To-Do Progress Chart */}
                                <div className="text-center">
                                    <div className="relative w-24 h-24 mx-auto mb-3">
                                        <div
                                            className="w-full h-full rounded-full"
                                            style={{
                                                background: tasks.length > 0
                                                    ? `conic-gradient(#10b981 0deg ${taskCompletionRate * 3.6}deg, #fbbf24 ${taskCompletionRate * 3.6}deg 360deg)`
                                                    : 'conic-gradient(#e2e8f0 0deg 360deg)'
                                            }}
                                        />
                                        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-slate-800">{taskCompletionRate}%</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-medium text-slate-600 mb-2">To-Do Progress</div>
                                    <div className="flex justify-center gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                            <span className="text-slate-500">Xong ({completedTasks})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                            <span className="text-slate-500">Chờ ({pendingTasks})</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tool Usage Chart */}
                                <div className="text-center">
                                    <div className="relative w-24 h-24 mx-auto mb-3">
                                        <div
                                            className="w-full h-full rounded-full"
                                            style={{ background: generateDonutGradient() }}
                                        />
                                        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
                                            <div className="text-center">
                                                <div className="text-lg font-bold text-slate-800">{totalItems}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-medium text-slate-600 mb-2">Dữ liệu đã lưu</div>
                                    <div className="flex justify-center gap-4 text-xs">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                            <span className="text-slate-500">Tools ({activeTools.length})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                                            <span className="text-slate-500">Còn lại ({trackedTools.length - activeTools.length})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Legend for tools */}
                            <div className="pt-4 border-t border-slate-100">
                                <div className="text-xs font-medium text-slate-500 mb-2">Công cụ đang dùng</div>
                                <div className="flex flex-wrap gap-2">
                                    {activeTools.length === 0 ? (
                                        <div className="text-xs text-slate-400">Chưa có dữ liệu</div>
                                    ) : (
                                        activeTools.map(tool => (
                                            <button
                                                key={tool.id}
                                                onClick={() => setView(tool.viewId)}
                                                className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 transition-all text-xs"
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: tool.color }}
                                                />
                                                <span className="text-slate-600">{tool.name}</span>
                                                <span className="font-bold text-slate-800">{progressData[tool.id]}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Quick Stats Row */}
                            <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-xl font-bold text-emerald-600">{completedTasks}</div>
                                    <div className="text-xs text-slate-400">Task xong</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-amber-500">{pendingTasks}</div>
                                    <div className="text-xs text-slate-400">Task chờ</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-indigo-600">{activeTools.length}</div>
                                    <div className="text-xs text-slate-400">Tools dùng</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-bold text-slate-400">{totalItems}</div>
                                    <div className="text-xs text-slate-400">Mục lưu</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Guides - V2 Updated */}
            <div className="p-8 border-b border-soft-border bg-gradient-to-br from-indigo-50/50 to-white">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <BookOpen className="text-indigo-500" /> Hướng dẫn tính năng V2
                        </h2>
                        <p className="text-slate-500">Các tính năng đã được nâng cấp với AI thông minh hơn.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {featureGuides.map(feature => (
                            <div
                                key={feature.id}
                                className="bg-white rounded-2xl border border-soft-border p-5 hover:shadow-soft transition-all duration-300 cursor-pointer group"
                                onClick={() => setView(feature.id as ViewState)}
                            >
                                <div className="flex items-center gap-3 mb-3">
                                    <div className={`p-2.5 rounded-xl ${feature.bgColor}`}>
                                        <feature.icon size={20} className={feature.color} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 text-sm">{feature.name}</h4>
                                        <span className={`text-xs ${feature.color} ${feature.bgColor} px-2 py-0.5 rounded-full`}>
                                            {feature.badge}
                                        </span>
                                    </div>
                                </div>

                                <ul className="space-y-2">
                                    {feature.tips.map((tip, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs text-slate-500">
                                            <ChevronRight size={12} className={`mt-0.5 flex-shrink-0 ${feature.color}`} />
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-600 group-hover:translate-x-1 transition-all">
                                    Dùng ngay <ArrowRight size={12} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tools Overview Section */}
            <div className="p-8">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                            <Layers className="text-indigo-500" /> Khám phá công cụ
                        </h2>
                        <p className="text-slate-500">Truy cập nhanh các công cụ Marketing AI theo luồng công việc.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {categories.map((category) => (
                            <div
                                key={category.title}
                                className="bg-white rounded-2xl border border-soft-border p-6 hover:shadow-soft transition-all duration-300"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`p-3 rounded-xl ${category.bgColor}`}>
                                        <category.icon size={24} className={category.color} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-800">{category.title}</h3>
                                        <p className="text-sm text-slate-500">{category.description}</p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    {category.tools.map((tool) => (
                                        <button
                                            key={tool.id}
                                            onClick={() => setView(tool.id as ViewState)}
                                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-soft-bg hover:bg-slate-100 transition-all duration-200 group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <tool.icon size={18} className="text-slate-400 group-hover:text-slate-600" strokeWidth={1.5} />
                                                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800">{tool.name}</span>
                                            </div>
                                            <ArrowRight size={16} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
