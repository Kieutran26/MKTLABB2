import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Copy, Check, Save, Clock, Trash2, ArrowRight, History, X, AlertTriangle, Target, Users } from 'lucide-react';
import { generateScamperIdeas, ScamperInput } from '../services/geminiService';
import { ScamperService } from '../services/scamperService';
import { ScamperSession } from '../types';
import { Toast, ToastType } from './Toast';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const SCAMPER_METHODS = [
    { id: 'substitute', letter: 'S', name: 'Substitute', desc: 'Thay thế' },
    { id: 'combine', letter: 'C', name: 'Combine', desc: 'Kết hợp' },
    { id: 'adapt', letter: 'A', name: 'Adapt', desc: 'Thích nghi' },
    { id: 'modify', letter: 'M', name: 'Modify', desc: 'Điều chỉnh' },
    { id: 'putToAnotherUse', letter: 'P', name: 'Put to use', desc: 'Dùng khác' },
    { id: 'eliminate', letter: 'E', name: 'Eliminate', desc: 'Loại bỏ' },
    { id: 'reverse', letter: 'R', name: 'Reverse', desc: 'Đảo ngược' },
];

const ScamperTool: React.FC = () => {
    const [topic, setTopic] = useState('');
    const [problem, setProblem] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [constraints, setConstraints] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<any>({});
    const [savedIdeas, setSavedIdeas] = useState<string[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    const [visibleCards, setVisibleCards] = useState<string[]>([]);

    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<ScamperSession[]>([]);

    useEffect(() => {
        const loadData = async () => {
            const migrated = await ScamperService.migrateFromLocalStorage();
            if (migrated > 0) {
                showToast(`Đã migrate ${migrated} phiên lên cloud!`, 'success');
            }
            const sessions = await ScamperService.getSessions();
            setHistory(sessions);
        };
        loadData();
    }, []);

    useEffect(() => {
        if (Object.keys(results).length > 0) {
            setVisibleCards(SCAMPER_METHODS.map(m => m.id));
        }
    }, [results]);

    useEffect(() => {
        if (showHistory) {
            const loadHistory = async () => {
                const sessions = await ScamperService.getSessions();
                setHistory(sessions);
            };
            loadHistory();
        }
    }, [showHistory]);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const handleGenerate = async () => {
        if (!topic.trim()) {
            showToast('Vui lòng nhập chủ đề cần tư duy', 'error');
            return;
        }

        setIsGenerating(true);
        setResults({});
        setVisibleCards([]);

        try {
            const inputData: ScamperInput = {
                topic,
                problem,
                targetAudience,
                constraints
            };

            const data = await generateScamperIdeas(inputData);
            setResults(data);

            SCAMPER_METHODS.forEach((method, index) => {
                setTimeout(() => {
                    setVisibleCards(prev => [...prev, method.id]);
                }, index * 300);
            });

        } catch (error) {
            showToast('Lỗi khi tạo ý tưởng.', 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateSingle = async (methodId: string) => {
        const oldVal = results[methodId];
        setResults((prev: any) => ({ ...prev, [methodId]: [] }));

        try {
            const inputData: ScamperInput = { topic, problem, targetAudience, constraints };
            const data = await generateScamperIdeas(inputData, undefined, methodId);
            setResults((prev: any) => ({ ...prev, [methodId]: (data as any)[methodId] || [] }));
        } catch (e) {
            setResults((prev: any) => ({ ...prev, [methodId]: oldVal }));
        }
    };

    const getIdeaText = (idea: any): string => {
        if (typeof idea === 'string') return idea;
        if (idea?.idea_name) return `${idea.idea_name}: ${idea.how_to}`;
        return JSON.stringify(idea);
    };

    const handleSaveIdea = (idea: any) => {
        const text = getIdeaText(idea);
        if (!savedIdeas.includes(text)) {
            setSavedIdeas([...savedIdeas, text]);
            showToast('Đã lưu ý tưởng', 'success');
        }
    };

    const handleSaveSession = async () => {
        if (Object.keys(results).length === 0) return;

        const session: ScamperSession = {
            id: Date.now().toString(),
            topic,
            context: problem,
            results: results as any,
            savedIdeas,
            createdAt: Date.now()
        };

        const success = await ScamperService.saveSession(session);
        if (success) {
            const sessions = await ScamperService.getSessions();
            setHistory(sessions);
            showToast('Đã lưu phiên lên cloud!', 'success');
        } else {
            showToast('Lỗi khi lưu!', 'error');
        }
    };

    const handleLoadSession = (session: ScamperSession) => {
        setTopic(session.topic);
        setProblem(session.context || '');
        setResults(session.results);
        setSavedIdeas(session.savedIdeas || []);
        setShowHistory(false);
        showToast('Đã tải lại phiên làm việc', 'success');
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Xóa phiên này?')) {
            const success = await ScamperService.deleteSession(id);
            if (success) {
                setHistory(prev => prev.filter(s => s.id !== id));
                showToast('Đã xóa!', 'success');
            } else {
                showToast('Lỗi khi xóa!', 'error');
            }
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast('Đã copy', 'success');
    };

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <Lightbulb size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">Creative Thinking</span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        SCAMPER Ideation
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Kỹ thuật tư duy đa chiều để đột phá ý tưởng sản phẩm.
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setShowHistory(!showHistory)}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                            showHistory
                                ? 'bg-stone-900 text-white shadow-sm hover:bg-stone-800'
                                : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
                        }`}
                    >
                        <History size={17} strokeWidth={1.25} /> Lịch sử ({history.length})
                    </button>
                    {Object.keys(results).length > 0 && (
                        <button
                            type="button"
                            onClick={handleSaveSession}
                            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                        >
                            <Save size={17} strokeWidth={1.25} /> Lưu phiên
                        </button>
                    )}
                </div>
            </header>

            <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-4 md:p-6 md:pt-5">
                {/* Input Form */}
                <div className={`${cardClass} min-h-0 w-full overflow-y-auto p-6 md:p-8 lg:w-auto lg:min-w-[480px]`}>
                    <h2 className="mb-6 text-lg font-medium tracking-tight text-stone-900">Thông tin tư duy</h2>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                Chủ đề / Sản phẩm *
                            </label>
                            <input
                                className={inputClass}
                                placeholder="VD: Quán cà phê sách, App học tiếng Anh..."
                                value={topic}
                                onChange={e => setTopic(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                Vấn đề cần giải quyết (Pain Point)
                            </label>
                            <input
                                className={inputClass}
                                placeholder="VD: Khách đến chỉ ngồi im, tương tác cộng đồng giảm mạnh..."
                                value={problem}
                                onChange={e => setProblem(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                Đối tượng khách hàng (Tùy chọn)
                            </label>
                            <input
                                className={inputClass}
                                placeholder="VD: Freelancer, Sinh viên..."
                                value={targetAudience}
                                onChange={e => setTargetAudience(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                Ràng buộc (Tùy chọn)
                            </label>
                            <input
                                className={inputClass}
                                placeholder="VD: Ngân sách thấp, không được đập quán..."
                                value={constraints}
                                onChange={e => setConstraints(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="h-5 w-5 animate-spin" strokeWidth={1.25} />
                                Đang tư duy...
                            </>
                        ) : (
                            <>
                                <Lightbulb className="h-5 w-5" strokeWidth={1.25} />
                                Tư duy ngay
                            </>
                        )}
                    </button>

                    {/* Saved Ideas */}
                    {savedIdeas.length > 0 && (
                        <div className="mt-6 rounded-2xl border border-stone-200 overflow-hidden">
                            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-5 py-3.5">
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-stone-900">
                                    <Check size={15} strokeWidth={1.25} className="text-stone-500" />
                                    Ý tưởng đã chọn
                                </h3>
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(savedIdeas.join('\n'))}
                                    className="text-xs font-semibold uppercase tracking-wide text-stone-500 transition-colors hover:text-stone-700"
                                >
                                    Copy All
                                </button>
                            </div>
                            <div className="max-h-[250px] overflow-y-auto p-4 space-y-2">
                                {savedIdeas.map((idea, i) => (
                                    <div key={i} className="group flex items-start justify-between gap-3 border-b border-stone-100 pb-2 last:border-0 last:pb-0">
                                        <p className="flex-1 text-sm text-stone-700">{idea}</p>
                                        <button
                                            type="button"
                                            onClick={() => setSavedIdeas(prev => prev.filter((_, idx) => idx !== i))}
                                            className="shrink-0 rounded-lg p-1 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                        >
                                            <Trash2 size={13} strokeWidth={1.25} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Results Grid */}
                <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                        {SCAMPER_METHODS.map(method => (
                            <div
                                key={method.id}
                                className={`${cardClass} flex flex-col transition-all duration-500 ${
                                    visibleCards.includes(method.id)
                                        ? 'opacity-100 translate-y-0'
                                        : 'opacity-0 translate-y-4'
                                }`}
                            >
                                <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-base font-bold text-stone-900 shadow-sm">
                                            {method.letter}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-stone-900">{method.name}</div>
                                            <div className="text-xs text-stone-400">{method.desc}</div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRegenerateSingle(method.id)}
                                        className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                                        title="Tạo lại phần này"
                                    >
                                        <RefreshCw size={14} strokeWidth={1.25} />
                                    </button>
                                </div>

                                <div className="flex-1 p-4 min-h-[160px]">
                                    {results[method.id] && results[method.id].length > 0 ? (
                                        <ul className="space-y-3">
                                            {results[method.id].map((idea: any, idx: number) => (
                                                <li key={idx} className="group border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                                                    {typeof idea === 'string' ? (
                                                        <div className="flex items-start gap-2">
                                                            <ArrowRight size={13} className="mt-0.5 shrink-0 text-stone-300" strokeWidth={1.25} />
                                                            <p className="flex-1 text-sm text-stone-700">{idea}</p>
                                                            <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleCopy(idea)}
                                                                    className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                                                                >
                                                                    <Copy size={12} strokeWidth={1.25} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSaveIdea(idea)}
                                                                    className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                                                                >
                                                                    <Check size={12} strokeWidth={1.25} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <p className="text-sm font-semibold text-stone-900">{idea.idea_name}</p>
                                                                <div className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleCopy(getIdeaText(idea))}
                                                                        className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                                                                    >
                                                                        <Copy size={12} strokeWidth={1.25} />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleSaveIdea(idea)}
                                                                        className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                                                                    >
                                                                        <Check size={12} strokeWidth={1.25} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-stone-500 leading-relaxed">{idea.how_to}</p>
                                                            {idea.example && (
                                                                <div className="rounded-lg border border-stone-200 bg-stone-50/80 px-2.5 py-1.5 text-xs text-stone-600 leading-relaxed">
                                                                    {idea.example}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-stone-300 text-sm italic">
                                            {isGenerating ? 'Đang suy nghĩ...' : 'Chưa có ý tưởng'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
                    <div className="flex w-full max-w-2xl flex-col rounded-2xl border border-stone-200/90 bg-white shadow-2xl max-h-[80vh]">
                        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/50 px-6 py-4">
                            <h3 className="flex items-center gap-2 text-base font-semibold text-stone-900">
                                <History size={18} strokeWidth={1.25} className="text-stone-400" />
                                Lịch sử Tư duy
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowHistory(false)}
                                className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
                            >
                                <X size={18} strokeWidth={1.25} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-3">
                            {history.length === 0 ? (
                                <div className="py-10 text-center text-sm font-normal text-stone-400">Chưa có lịch sử nào.</div>
                            ) : (
                                history.map(session => (
                                    <div
                                        key={session.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleLoadSession(session)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoadSession(session)}
                                        className="group cursor-pointer rounded-2xl border border-stone-200/90 p-4 transition-all hover:border-stone-300 hover:bg-stone-50/50"
                                    >
                                        <div className="mb-2 flex items-start justify-between gap-3">
                                            <p className="text-base font-semibold text-stone-900">{session.topic}</p>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteSession(e, session.id)}
                                                className="shrink-0 rounded-lg p-2 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                aria-label="Xóa"
                                            >
                                                <Trash2 size={15} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                        {session.context && (
                                            <p className="mb-3 text-sm italic text-stone-500 line-clamp-1">&ldquo;{session.context}&rdquo;</p>
                                        )}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1 text-xs text-stone-400">
                                                <Clock size={12} strokeWidth={1.25} />
                                                {new Date(session.createdAt).toLocaleDateString('vi-VN')}
                                            </div>
                                            <span className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-600">
                                                {session.savedIdeas?.length || 0} ý tưởng đã lưu
                                            </span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default ScamperTool;
