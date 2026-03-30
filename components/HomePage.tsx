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
        <div className="min-h-screen bg-soft-bg">
            {/* Translation — nền kem khớp các section Neubrutalism */}
            <div className="border-b border-slate-200 bg-[#F5F5F0]">
                <TranslationView />
            </div>

            {/* Dashboard — Neubrutalism (khớp Feature V2 / Khám phá công cụ) */}
            <div className="px-4 py-8 md:px-8 border-b border-slate-200 bg-[#F5F5F0]">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-black mb-2 flex items-center gap-3">
                            <span
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black bg-[#FEF3C7] text-[#B45309] shadow-[1px_1px_0_0_#000]"
                                aria-hidden
                            >
                                <BarChart3 size={22} strokeWidth={1.5} />
                            </span>
                            Dashboard
                        </h2>
                        <p className="text-slate-600 font-semibold text-sm">
                            Quản lý công việc và theo dõi tiến trình sử dụng công cụ.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
                        {/* To-Do List */}
                        <div className="group bg-white rounded-[20px] border border-black p-6 md:p-8 shadow-[3px_3px_0_0_#000] transition-[transform,box-shadow] duration-100 ease-out hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
                            <div className="flex items-center justify-between gap-2 mb-5">
                                <h3 className="font-black text-black flex items-center gap-2 text-base">
                                    <span
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black bg-[#D1FAE5] text-[#047857] shadow-[1px_1px_0_0_#000]"
                                        aria-hidden
                                    >
                                        <CheckCircle2 size={20} strokeWidth={1.5} />
                                    </span>
                                    To-Do List
                                </h3>
                                <span className="rounded-full border border-black bg-[#D1FAE5] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#047857]">
                                    {completedTasks}/{tasks.length} hoàn thành
                                </span>
                            </div>

                            <div className="flex gap-2 mb-4">
                                <input
                                    type="text"
                                    value={newTaskText}
                                    onChange={(e) => setNewTaskText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                                    placeholder="Thêm công việc mới..."
                                    className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-black bg-white text-sm font-semibold text-black placeholder:text-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddTask}
                                    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl border border-black bg-[#48b9a7] text-white shadow-[1px_1px_0_0_#000] transition-[transform,box-shadow] duration-100 ease-out hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[1px] active:translate-y-[1px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                                    aria-label="Thêm công việc"
                                >
                                    <Plus size={20} strokeWidth={1.5} />
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar">
                                {tasks.length === 0 ? (
                                    <div className="text-center py-10 text-slate-500 border-t border-black pt-6">
                                        <Circle size={36} strokeWidth={1.5} className="mx-auto mb-2 text-black/25" />
                                        <p className="text-sm font-semibold">Chưa có công việc nào</p>
                                    </div>
                                ) : (
                                    tasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`flex items-center gap-3 p-3 rounded-xl border border-black transition-colors group ${task.completed
                                                ? 'bg-[#D1FAE5]/40'
                                                : 'bg-white hover:bg-black/[0.03]'
                                                }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleTask(task.id)}
                                                className={`w-5 h-5 shrink-0 rounded-full border border-black flex items-center justify-center transition-colors ${task.completed
                                                    ? 'bg-[#48b9a7] text-white'
                                                    : 'bg-white hover:bg-[#F5F5F0]'
                                                    }`}
                                            >
                                                {task.completed && <Check size={12} strokeWidth={2.5} />}
                                            </button>
                                            <span className={`flex-1 text-sm font-semibold ${task.completed ? 'text-slate-500 line-through' : 'text-slate-800'
                                                }`}>
                                                {task.text}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => deleteTask(task.id)}
                                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 transition-opacity p-1"
                                                aria-label="Xóa công việc"
                                            >
                                                <Trash2 size={14} strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {tasks.length > 0 && (
                                <div className="mt-5 pt-5 border-t border-black">
                                    <div className="flex items-center gap-4">
                                        <div className="relative w-16 h-16 flex-shrink-0">
                                            <div
                                                className="w-full h-full rounded-full border border-black"
                                                style={{
                                                    background: `conic-gradient(#48b9a7 0deg ${taskCompletionRate * 3.6}deg, #fbbf24 ${taskCompletionRate * 3.6}deg 360deg)`
                                                }}
                                            />
                                            <div className="absolute inset-1.5 bg-white rounded-full flex items-center justify-center border border-black/10">
                                                <span className="text-sm font-black text-black">{taskCompletionRate}%</span>
                                            </div>
                                        </div>

                                        <div className="flex-1 grid grid-cols-3 gap-2">
                                            <div className="text-center p-2 rounded-xl border border-black bg-[#D1FAE5]">
                                                <div className="text-lg font-black text-[#047857]">{completedTasks}</div>
                                                <div className="text-[10px] font-bold text-[#047857]/80 uppercase tracking-wide">Hoàn thành</div>
                                            </div>
                                            <div className="text-center p-2 rounded-xl border border-black bg-[#FEF3C7]">
                                                <div className="text-lg font-black text-[#B45309]">{pendingTasks}</div>
                                                <div className="text-[10px] font-bold text-[#B45309]/80 uppercase tracking-wide">Chờ xử lý</div>
                                            </div>
                                            <div className="text-center p-2 rounded-xl border border-black bg-[#F5F5F0]">
                                                <div className="text-lg font-black text-black">{tasks.length}</div>
                                                <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Tổng cộng</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <div className="h-3 rounded-full border border-black bg-white overflow-hidden">
                                            <div
                                                className="h-full bg-[#48b9a7] transition-all duration-500"
                                                style={{ width: `${taskCompletionRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Thống kê tổng quan */}
                        <div className="group bg-white rounded-[20px] border border-black p-6 md:p-8 shadow-[3px_3px_0_0_#000] transition-[transform,box-shadow] duration-100 ease-out hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-black text-black flex items-center gap-2 text-base">
                                    <span
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black bg-[#EDE9FE] text-[#5B21B6] shadow-[1px_1px_0_0_#000]"
                                        aria-hidden
                                    >
                                        <PieChart size={20} strokeWidth={1.5} />
                                    </span>
                                    Thống kê tổng quan
                                </h3>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mb-4">
                                <div className="text-center">
                                    <div className="relative w-24 h-24 mx-auto mb-3">
                                        <div
                                            className="w-full h-full rounded-full border border-black"
                                            style={{
                                                background: tasks.length > 0
                                                    ? `conic-gradient(#48b9a7 0deg ${taskCompletionRate * 3.6}deg, #fbbf24 ${taskCompletionRate * 3.6}deg 360deg)`
                                                    : '#e2e8f0'
                                            }}
                                        />
                                        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center border border-black/10">
                                            <div className="text-lg font-black text-black">{taskCompletionRate}%</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-black text-black mb-2">To-Do Progress</div>
                                    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-700">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#48b9a7]" />
                                            <span>Xong ({completedTasks})</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                                            <span>Chờ ({pendingTasks})</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="relative w-24 h-24 mx-auto mb-3">
                                        <div
                                            className="w-full h-full rounded-full border border-black"
                                            style={{ background: generateDonutGradient() }}
                                        />
                                        <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center border border-black/10">
                                            <div className="text-lg font-black text-black">{totalItems}</div>
                                        </div>
                                    </div>
                                    <div className="text-xs font-black text-black mb-2">Dữ liệu đã lưu</div>
                                    <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 text-xs font-semibold text-slate-700">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-[#48b9a7]" />
                                            <span>Tools ({activeTools.length})</span>
                                        </div>
                                        <div className="flex items-center justify-center gap-1.5">
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-slate-300" />
                                            <span>Còn lại ({trackedTools.length - activeTools.length})</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-black">
                                <div className="text-xs font-black text-black mb-2">Công cụ đang dùng</div>
                                <div className="flex flex-wrap gap-2">
                                    {activeTools.length === 0 ? (
                                        <div className="text-xs font-semibold text-slate-500">Chưa có dữ liệu</div>
                                    ) : (
                                        activeTools.map(tool => (
                                            <button
                                                key={tool.id}
                                                type="button"
                                                onClick={() => setView(tool.viewId)}
                                                className="flex items-center gap-1.5 rounded-full border border-black bg-white px-2.5 py-1 text-xs font-bold text-black shadow-[1px_1px_0_0_#000] transition-[transform,box-shadow] duration-100 ease-out hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                                            >
                                                <span
                                                    className="h-2 w-2 shrink-0 rounded-full border border-black"
                                                    style={{ backgroundColor: tool.color }}
                                                />
                                                <span>{tool.name}</span>
                                                <span className="font-black">{progressData[tool.id]}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-black grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-xl font-black text-[#047857]">{completedTasks}</div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Task xong</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-[#B45309]">{pendingTasks}</div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Task chờ</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-[#5B21B6]">{activeTools.length}</div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Tools dùng</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-xl font-black text-black">{totalItems}</div>
                                    <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Mục lưu</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Feature Guides V2 — Neubrutalism: mảnh viền + hover nhấn xuống (shadow → 0, translate theo offset) */}
            <div className="px-4 py-8 md:px-8 border-b border-slate-200 bg-[#F5F5F0]">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-6">
                        <h2 className="text-2xl font-black text-black mb-2 flex items-center gap-2">
                            <BookOpen className="text-black" size={26} strokeWidth={1.5} /> Hướng dẫn tính năng V2
                        </h2>
                        <p className="text-slate-600 font-semibold text-sm">Nâng cấp AI — click thẻ để mở công cụ.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 md:gap-6">
                        {featureGuides.map(feature => (
                            <button
                                type="button"
                                key={feature.id}
                                className="group text-left bg-white rounded-[20px] border border-black p-6 md:p-8 shadow-[3px_3px_0_0_#000] cursor-pointer transition-[transform,box-shadow] duration-100 ease-out hover:translate-x-[3px] hover:translate-y-[3px] hover:shadow-none active:translate-x-[3px] active:translate-y-[3px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                                onClick={() => setView(feature.id as ViewState)}
                            >
                                <div className="flex items-start justify-between gap-2 mb-5">
                                    <div
                                        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-black shadow-[1px_1px_0_0_#000] transition-[transform,box-shadow] duration-100 ease-out group-hover:translate-x-[1px] group-hover:translate-y-[1px] group-hover:shadow-none"
                                        style={{ backgroundColor: feature.accentSoftBg, color: feature.accentIcon }}
                                        aria-hidden
                                    >
                                        <feature.icon size={28} strokeWidth={1.5} />
                                    </div>
                                    <span className="rounded-full border border-black bg-black px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-white">
                                        {feature.hashBadge}
                                    </span>
                                </div>

                                <h4 className="font-black text-black text-base leading-tight">{feature.name}</h4>
                                <p className="mt-1 text-sm font-semibold text-slate-500">{feature.stackTag}</p>

                                <ul className="mt-4 space-y-2.5 border-t border-black pt-4">
                                    {feature.tips.map((tip, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs font-medium leading-snug text-slate-700">
                                            <span className="mt-0.5 shrink-0 font-black" style={{ color: feature.accentBullet }}>›</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-6 flex items-center gap-1 text-sm font-black text-black">
                                    Khám phá <ArrowRight size={16} strokeWidth={1.5} className="shrink-0" />
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Khám phá công cụ — Editorial Minimalism (chỉ section này) */}
            <div className="border-b border-stone-200/70 bg-[#FAF9F7] px-5 py-14 md:px-10 md:py-20">
                <div className="mx-auto max-w-6xl">
                    <header className="mb-12 md:mb-16 max-w-2xl">
                        <div className="mb-4 flex items-center gap-3 text-stone-400">
                            <Layers size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                Marketing stack
                            </span>
                        </div>
                        <h2 className="font-serif text-3xl font-normal tracking-tight text-stone-900 md:text-4xl">
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
                                        <h3 className="font-serif text-xl font-medium tracking-tight text-stone-900">
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
