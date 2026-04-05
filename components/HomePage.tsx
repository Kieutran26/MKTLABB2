import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import TranslationView from './TranslationView';
import { useTasks } from './TaskContext';
import {
    Brain, Lightbulb, Image as ImageIcon, TrendingUp,
    Target, Users, Map, Heart, Zap, PenTool, CalendarDays,
    Mail, MonitorPlay, PieChart, Calculator, Activity,
    ArrowRight, FileText, CheckCircle2, Circle,
    Plus, Trash2, Check, BarChart3, Layers, Sparkles,
    BookOpen
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

    // Feature guides — mỗi thẻ một màu soft (pastel), bullet đậm cùng tông
    const featureGuides = [
        {
            id: 'SCAMPER_TOOL',
            name: 'SCAMPER V2',
            icon: Lightbulb,
            accentSoftBg: '#FDE2E4',
            accentIcon: '#BE123C',
            accentBullet: '#BE123C',
            hashBadge: '#IDEATE',
            stackTag: '#MKTStack',
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
            accentSoftBg: '#EDE9FE',
            accentIcon: '#5B21B6',
            accentBullet: '#5B21B6',
            hashBadge: '#AI',
            stackTag: '#MKTStack',
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
            accentSoftBg: '#D1FAE5',
            accentIcon: '#047857',
            accentBullet: '#047857',
            hashBadge: '#BRIEF',
            stackTag: '#MKTStack',
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
            accentSoftBg: '#FEF3C7',
            accentIcon: '#B45309',
            accentBullet: '#B45309',
            hashBadge: '#INSIGHT',
            stackTag: '#MKTStack',
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
            accentSoftBg: '#EDE9FE',
            accentIcon: '#5B21B6',
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
            accentSoftBg: '#FEF3C7',
            accentIcon: '#B45309',
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
            accentSoftBg: '#FDE2E4',
            accentIcon: '#BE123C',
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
            accentSoftBg: '#D1FAE5',
            accentIcon: '#047857',
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
        <div className="min-h-full bg-soft-bg">
            {/* Dịch thuật AI — cùng nền & viền với Dashboard / Khám phá công cụ */}
            <div className="border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-14 md:px-10 md:py-20">
                <TranslationView />
            </div>

            {/* Dashboard — editorial minimal (cùng ngôn ngữ với Khám phá công cụ) */}
            <div className="border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-14 md:px-10 md:py-20">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-10 md:mb-12 max-w-2xl">
                        <div className="mb-4 flex items-center gap-3 text-stone-400">
                            <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#FEF3C7] text-[#B45309]"
                                aria-hidden
                            >
                                <BarChart3 size={20} strokeWidth={1.25} />
                            </span>
                            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                Tổng quan
                            </span>
                        </div>
                        <h2 className="font-sans text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
                            Dashboard
                        </h2>
                        <p className="mt-4 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                            Quản lý công việc và theo dõi tiến trình sử dụng công cụ.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
                        {/* To-Do List */}
                        <div className="rounded-2xl border border-stone-200/90 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-300 md:p-10 hover:border-stone-300">
                            <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
                                <div className="flex items-start gap-5">
                                    <div
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#D1FAE5] text-[#047857]"
                                        aria-hidden
                                    >
                                        <CheckCircle2 size={22} strokeWidth={1.25} />
                                    </div>
                                    <div className="min-w-0 pt-0.5">
                                        <h3 className="font-sans text-xl font-medium tracking-tight text-stone-900">
                                            To-Do List
                                        </h3>
                                    </div>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-emerald-800/90">
                                    {completedTasks}/{tasks.length} hoàn thành
                                </span>
                            </div>

                            <div className="mb-6 flex gap-2">
                                <input
                                    type="text"
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                    placeholder="Thêm công việc mới..."
                                    className="min-w-0 flex-1 rounded-xl border border-stone-200/90 bg-white px-4 py-2.5 text-sm font-normal text-stone-800 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTask}
                                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#3d9b8c] text-white transition-colors hover:bg-[#358f81] focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
                                    aria-label="Thêm công việc"
                                >
                                    <Plus size={20} strokeWidth={1.25} />
                                </button>
                            </div>

                            <div className="custom-scrollbar max-h-[300px] space-y-0 overflow-y-auto">
                                {tasks.length === 0 ? (
                                    <div className="border-t border-stone-100 pt-8 text-center text-stone-500">
                                        <Circle size={32} strokeWidth={1.25} className="mx-auto mb-3 text-stone-300" />
                                        <p className="text-sm font-normal">Chưa có công việc nào</p>
                                    </div>
                                ) : (
                                    <ul className="border-t border-stone-100">
                                        {tasks.map(task => (
                                            <li
                                                key={task.id}
                                                className="border-b border-stone-100 last:border-0"
                                            >
                                                <div
                                                    className={`group flex items-center gap-3 rounded-lg px-1 py-3 transition-colors ${task.completed ? 'bg-emerald-50/50' : 'hover:bg-stone-50/80'
                                                        }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleTask(task.id)}
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${task.completed
                                                            ? 'border-[#3d9b8c] bg-[#3d9b8c] text-white'
                                                            : 'border-stone-300 bg-white hover:border-stone-400'
                                                            }`}
                                                    >
                                                        {task.completed && <Check size={12} strokeWidth={2.5} />}
                                                    </button>
                                                    <span
                                                        className={`min-w-0 flex-1 text-sm font-normal ${task.completed ? 'text-stone-400 line-through' : 'text-stone-700'
                                                            }`}
                                                    >
                                                        {task.text}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteTask(task.id)}
                                                        className="p-1 text-stone-300 opacity-0 transition-opacity hover:text-red-600 group-hover:opacity-100"
                                                        aria-label="Xóa công việc"
                                                    >
                                                        <Trash2 size={14} strokeWidth={1.25} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {tasks.length > 0 && (
                                <div className="mt-8 border-t border-stone-100 pt-8">
                                    <div className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 shrink-0">
                                            <div
                                                className="h-full w-full rounded-full border border-stone-200/90"
                                                style={{
                                                    background: `conic-gradient(#3d9b8c 0deg ${taskCompletionRate * 3.6}deg, #fcd34d ${taskCompletionRate * 3.6}deg 360deg)`
                                                }}
                                            />
                                            <div className="absolute inset-1.5 flex items-center justify-center rounded-full border border-stone-100 bg-white">
                                                <span className="text-sm font-medium text-stone-800">{taskCompletionRate}%</span>
                                            </div>
                                        </div>

                                        <div className="grid flex-1 grid-cols-3 gap-2">
                                            <div className="rounded-xl border border-stone-100 bg-emerald-50/60 p-2 text-center">
                                                <div className="text-lg font-medium text-emerald-800">{completedTasks}</div>
                                                <div className="text-[10px] font-medium uppercase tracking-wide text-emerald-800/70">
                                                    Hoàn thành
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-stone-100 bg-amber-50/60 p-2 text-center">
                                                <div className="text-lg font-medium text-amber-900">{pendingTasks}</div>
                                                <div className="text-[10px] font-medium uppercase tracking-wide text-amber-900/70">
                                                    Chờ xử lý
                                                </div>
                                            </div>
                                            <div className="rounded-xl border border-stone-100 bg-stone-50 p-2 text-center">
                                                <div className="text-lg font-medium text-stone-800">{tasks.length}</div>
                                                <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                                    Tổng cộng
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="h-2.5 overflow-hidden rounded-full bg-stone-100">
                                            <div
                                                className="h-full rounded-full bg-[#3d9b8c] transition-all duration-500"
                                                style={{ width: `${taskCompletionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thống kê tổng quan */}
                        <div className="rounded-2xl border border-stone-200/90 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-300 md:p-10 hover:border-stone-300">
                            <div className="mb-8 flex items-start gap-5">
                                <div
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EDE9FE] text-[#5B21B6]"
                                    aria-hidden
                                >
                                    <PieChart size={22} strokeWidth={1.25} />
                                </div>
                                <div className="min-w-0 pt-0.5">
                                    <h3 className="font-sans text-xl font-medium tracking-tight text-stone-900">
                                        Thống kê tổng quan
                                    </h3>
                                </div>
                            </div>

                            <div className="mb-6 grid grid-cols-2 gap-8">
                                <div className="text-center">
                                    <div className="relative mx-auto mb-3 h-24 w-24">
                                        <div
                                            className="h-full w-full rounded-full border border-stone-200/90"
                                            style={{
                                                background:
                                                    tasks.length > 0
                                                        ? `conic-gradient(#3d9b8c 0deg ${taskCompletionRate * 3.6}deg, #fcd34d ${taskCompletionRate * 3.6}deg 360deg)`
                                                        : '#e7e5e4'
                                            }}
                                        />
                                        <div className="absolute inset-2 flex items-center justify-center rounded-full border border-stone-100 bg-white">
                                            <div className="text-lg font-medium text-stone-800">{taskCompletionRate}%</div>
                                        </div>
                                    </div>
                                    <div className="mb-2 text-xs font-medium text-stone-800">To-Do Progress</div>
                                    <div className="flex flex-col justify-center gap-2 text-xs font-normal text-stone-600 sm:flex-row sm:gap-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#3d9b8c]" />
                                            <span>Xong ({completedTasks})</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                                            <span>Chờ ({pendingTasks})</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="relative mx-auto mb-3 h-24 w-24">
                                        <div
                                            className="h-full w-full rounded-full border border-stone-200/90"
                                            style={{ background: generateDonutGradient() }}
                                        />
                                        <div className="absolute inset-2 flex items-center justify-center rounded-full border border-stone-100 bg-white">
                                            <div className="text-lg font-medium text-stone-800">{totalItems}</div>
                                        </div>
                                    </div>
                                    <div className="mb-2 text-xs font-medium text-stone-800">Dữ liệu đã lưu</div>
                                    <div className="flex flex-col justify-center gap-2 text-xs font-normal text-stone-600 sm:flex-row sm:gap-4">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#3d9b8c]" />
                                            <span>Tools ({activeTools.length})</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-stone-300" />
                                            <span>Còn lại ({trackedTools.length - activeTools.length})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-stone-100 pt-6">
                                <div className="mb-3 text-xs font-medium text-stone-800">Công cụ đang dùng</div>
                                <div className="flex flex-wrap gap-2">
                                    {activeTools.length === 0 ? (
                                        <div className="text-xs font-normal text-stone-500">Chưa có dữ liệu</div>
                                    ) : (
                                        activeTools.map(tool => (
                                            <button
                                                key={tool.id}
                                                type="button"
                                                onClick={() => setView(tool.viewId)}
                                                className="flex items-center gap-1.5 rounded-full border border-stone-200/90 bg-stone-50/80 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
                                            >
                                                <span
                                                    className="h-2 w-2 shrink-0 rounded-full"
                                                    style={{ backgroundColor: tool.color }}
                                                />
                                                <span>{tool.name}</span>
                                                <span className="text-stone-500">{progressData[tool.id]}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-stone-100 pt-6 sm:grid-cols-4">
                                <div className="text-center">
                                    <div className="text-xl font-medium text-emerald-800">{completedTasks}</div>
                                    <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                        Task xong
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-medium text-amber-800">{pendingTasks}</div>
                                    <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                        Task chờ
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-medium text-violet-800">{activeTools.length}</div>
                                    <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                        Tools dùng
                                    </div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-medium text-stone-900">{totalItems}</div>
                                    <div className="text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                        Mục lưu
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hướng dẫn tính năng — cùng ngôn ngữ visual với Khám phá công cụ (editorial minimal) */}
            <div className="border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-14 md:px-10 md:py-20">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-12 md:mb-16 max-w-2xl">
                        <div className="mb-4 flex items-center gap-3 text-stone-400">
                            <BookOpen size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                Hướng dẫn
                            </span>
                        </div>
                        <h2 className="font-sans text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
                            Hướng dẫn tính năng
                        </h2>
                        <p className="mt-4 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                            Nâng cấp AI — nhấn thẻ để mở công cụ tương ứng.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-10 xl:grid-cols-4 xl:gap-8">
                        {featureGuides.map(feature => (
                            <button
                                type="button"
                                key={feature.id}
                                className="group text-left rounded-2xl border border-stone-200/90 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-300 md:p-10 hover:border-stone-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
                                onClick={() => setView(feature.id as ViewState)}
                            >
                                <div className="mb-8 flex items-start gap-5">
                                    <div
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                                        style={{ backgroundColor: feature.accentSoftBg, color: feature.accentIcon }}
                                        aria-hidden
                                    >
                                        <feature.icon size={22} strokeWidth={1.25} />
                                    </div>
                                    <div className="min-w-0 pt-0.5">
                                        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                                            <h3 className="font-sans text-xl font-medium tracking-tight text-stone-900">
                                                {feature.name}
                                            </h3>
                                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-stone-500">
                                                {feature.hashBadge}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-sm font-normal text-stone-500">{feature.stackTag}</p>
                                    </div>
                                </div>

                                <ul className="border-t border-stone-100 pt-6">
                                    {feature.tips.map((tip, idx) => (
                                        <li key={idx} className="border-b border-stone-100 last:border-0">
                                            <div className="flex items-start gap-3 py-3.5">
                                                <ArrowRight
                                                    size={15}
                                                    strokeWidth={1.25}
                                                    className="mt-0.5 shrink-0 text-stone-300"
                                                    style={{ color: feature.accentBullet }}
                                                    aria-hidden
                                                />
                                                <span className="text-sm font-normal leading-relaxed text-stone-600">
                                                    {tip}
                                                </span>
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-6 flex items-center gap-1 text-sm font-medium text-stone-600 transition-colors group-hover:text-stone-900">
                                    Khám phá
                                    <ArrowRight
                                        size={15}
                                        strokeWidth={1.25}
                                        className="shrink-0 text-stone-300 transition-colors group-hover:text-stone-500"
                                    />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Khám phá công cụ — Editorial Minimalism (chỉ section này) */}
            <div className="border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-14 md:px-10 md:py-20">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-12 md:mb-16 max-w-2xl">
                        <div className="mb-4 flex items-center gap-3 text-stone-400">
                            <Layers size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                Marketing stack
                            </span>
                        </div>
                        <h2 className="font-sans text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
                            Khám phá công cụ
                        </h2>
                        <p className="mt-4 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                            Truy cập nhanh các công cụ Marketing AI theo luồng công việc.
                        </p>
                    </header>

                    <div className="grid grid-cols-1 gap-10 md:grid-cols-2 md:gap-12 lg:gap-14">
                        {categories.map((category) => (
                            <article
                                key={category.title}
                                className="group/card rounded-2xl border border-stone-200/90 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-300 md:p-10 hover:border-stone-300"
                            >
                                <div className="mb-8 flex items-start gap-5">
                                    <div
                                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                                        style={{ backgroundColor: category.accentSoftBg, color: category.accentIcon }}
                                        aria-hidden
                                    >
                                        <category.icon size={22} strokeWidth={1.25} />
                                    </div>
                                    <div className="min-w-0 pt-0.5">
                                        <h3 className="font-sans text-xl font-medium tracking-tight text-stone-900">
                                            {category.title}
                                        </h3>
                                        <p className="mt-2 text-sm font-normal leading-relaxed text-stone-500">
                                            {category.description}
                                        </p>
                                    </div>
                                </div>

                                <ul className="border-t border-stone-100 pt-6">
                                    {category.tools.map((tool) => (
                                        <li key={tool.id} className="border-b border-stone-100 last:border-0">
                                            <button
                                                type="button"
                                                onClick={() => setView(tool.id as ViewState)}
                                                className="group -mx-2 flex w-full items-center justify-between gap-3 rounded-lg px-2 py-3.5 text-left transition-colors duration-200 hover:bg-stone-50/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-300 focus-visible:ring-offset-2"
                                            >
                                                <span className="flex min-w-0 items-center gap-3">
                                                    <tool.icon
                                                        size={17}
                                                        strokeWidth={1.25}
                                                        className="shrink-0 opacity-60 transition-opacity group-hover:opacity-80"
                                                        style={{ color: category.accentIcon }}
                                                    />
                                                    <span className="truncate text-sm font-medium text-stone-600 transition-colors group-hover:text-stone-900">
                                                        {tool.name}
                                                    </span>
                                                </span>
                                                <ArrowRight
                                                    size={15}
                                                    strokeWidth={1.25}
                                                    className="shrink-0 text-stone-300 transition-colors group-hover:text-stone-500"
                                                />
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomePage;
