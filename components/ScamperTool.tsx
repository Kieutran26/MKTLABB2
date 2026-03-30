import React, { useState, useEffect } from 'react';
import { Lightbulb, RefreshCw, Copy, Check, Save, Clock, Trash2, ArrowRight, History, X, AlertTriangle, Target, Users, Cloud } from 'lucide-react';
import { generateScamperIdeas, ScamperInput } from '../services/geminiService';
import { ScamperService } from '../services/scamperService';
import { ScamperSession } from '../types';
import { Toast, ToastType } from './Toast';

const SCAMPER_METHODS = [
    { id: 'substitute', letter: 'S', name: 'Substitute', desc: 'Thay thế', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { id: 'combine', letter: 'C', name: 'Combine', desc: 'Kết hợp', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'adapt', letter: 'A', name: 'Adapt', desc: 'Thích nghi', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    { id: 'modify', letter: 'M', name: 'Modify', desc: 'Điều chỉnh', color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { id: 'putToAnotherUse', letter: 'P', name: 'Put to use', desc: 'Dùng khác', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'eliminate', letter: 'E', name: 'Eliminate', desc: 'Loại bỏ', color: 'bg-red-100 text-red-700 border-red-200' },
    { id: 'reverse', letter: 'R', name: 'Reverse', desc: 'Đảo ngược', color: 'bg-pink-100 text-pink-700 border-pink-200' },
];

const ScamperTool: React.FC = () => {
    // V2 Input fields
    const [topic, setTopic] = useState('');
    const [problem, setProblem] = useState('');
    const [targetAudience, setTargetAudience] = useState('');
    const [constraints, setConstraints] = useState('');

    const [isGenerating, setIsGenerating] = useState(false);
    const [results, setResults] = useState<any>({});
    const [savedIdeas, setSavedIdeas] = useState<string[]>([]);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Animation Stagger
    const [visibleCards, setVisibleCards] = useState<string[]>([]);

    // History Modal
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<ScamperSession[]>([]);

    // Load from Supabase on mount and migrate from localStorage
    useEffect(() => {
        const loadData = async () => {
            // Try to migrate from localStorage first (one-time)
            const migrated = await ScamperService.migrateFromLocalStorage();
            if (migrated > 0) {
                showToast(`☁️ Đã migrate ${migrated} phiên lên cloud!`, 'success');
            }

            // Load from Supabase
            const sessions = await ScamperService.getSessions();
            setHistory(sessions);
        };
        loadData();
    }, []);

    useEffect(() => {
        // Initialize with all visible if loading from history, or empty
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
            showToast("Vui lòng nhập chủ đề cần tư duy", "error");
            return;
        }

        setIsGenerating(true);
        setResults({});
        setVisibleCards([]);

        try {
            // V2: Use ScamperInput object
            const inputData: ScamperInput = {
                topic,
                problem,
                targetAudience,
                constraints
            };

            const data = await generateScamperIdeas(inputData);
            setResults(data);

            // Staggered animation effect
            SCAMPER_METHODS.forEach((method, index) => {
                setTimeout(() => {
                    setVisibleCards(prev => [...prev, method.id]);
                }, index * 300); // 300ms delay per card
            });

        } catch (error) {
            showToast("Lỗi khi tạo ý tưởng.", "error");
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

    // Helper to extract idea text (support both old string[] and new object format)
    const getIdeaText = (idea: any): string => {
        if (typeof idea === 'string') return idea;
        if (idea?.idea_name) return `${idea.idea_name}: ${idea.how_to}`;
        return JSON.stringify(idea);
    };

    const handleSaveIdea = (idea: any) => {
        const text = getIdeaText(idea);
        if (!savedIdeas.includes(text)) {
            setSavedIdeas([...savedIdeas, text]);
            showToast("Đã lưu ý tưởng", "success");
        }
    };

    const handleSaveSession = async () => {
        if (Object.keys(results).length === 0) return;

        const session: ScamperSession = {
            id: Date.now().toString(),
            topic,
            context: problem, // V2: Use problem as context for backward compatibility
            results: results as any,
            savedIdeas,
            createdAt: Date.now()
        };

        const success = await ScamperService.saveSession(session);
        if (success) {
            const sessions = await ScamperService.getSessions();
            setHistory(sessions);
            showToast("☁️ Đã lưu phiên lên cloud!", "success");
        } else {
            showToast("Lỗi khi lưu!", "error");
        }
    };

    const handleLoadSession = (session: ScamperSession) => {
        setTopic(session.topic);
        setProblem(session.context || '');
        setResults(session.results);
        setSavedIdeas(session.savedIdeas || []);
        setShowHistory(false);
        showToast("Đã tải lại phiên làm việc", "success");
    };

    const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Xóa phiên này?")) {
            const success = await ScamperService.deleteSession(id);
            if (success) {
                setHistory(prev => prev.filter(s => s.id !== id));
                showToast("Đã xóa!", "success");
            } else {
                showToast("Lỗi khi xóa!", "error");
            }
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("Đã copy", "success");
    };

    return (
        <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Lightbulb className="text-yellow-500" strokeWidth={1.5} />
                        SCAMPER Ideation
                    </h2>
                    <p className="text-slate-500 mt-1">Kỹ thuật tư duy đa chiều để đột phá ý tưởng sản phẩm.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowHistory(true)}
                        className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                    >
                        <History size={18} /> Lịch sử
                    </button>
                    <button
                        onClick={handleSaveSession}
                        disabled={Object.keys(results).length === 0}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
                    >
                        <Save size={18} /> Lưu phiên
                    </button>
                </div>
            </div>

            {/* INPUT AREA - V2 with Problem-Centric fields */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">
                            📦 Chủ đề / Sản phẩm
                        </label>
                        <input
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                            placeholder="VD: Quán cà phê sách, App học tiếng Anh..."
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <AlertTriangle size={14} className="text-amber-500" />
                            Vấn đề cần giải quyết (Pain Point)
                        </label>
                        <input
                            className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl focus:outline-none focus:border-amber-500 text-slate-700"
                            placeholder="VD: Khách đến chỉ ngồi im, tương tác cộng đồng giảm mạnh..."
                            value={problem}
                            onChange={e => setProblem(e.target.value)}
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Users size={14} className="text-blue-500" />
                            Đối tượng khách hàng (Tùy chọn)
                        </label>
                        <input
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-600"
                            placeholder="VD: Freelancer, Sinh viên..."
                            value={targetAudience}
                            onChange={e => setTargetAudience(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                            <Target size={14} className="text-red-500" />
                            Ràng buộc (Tùy chọn)
                        </label>
                        <input
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-600"
                            placeholder="VD: Ngân sách thấp, không được đập quán..."
                            value={constraints}
                            onChange={e => setConstraints(e.target.value)}
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full bg-indigo-600 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 disabled:opacity-70 transition-all"
                        >
                            {isGenerating ? <RefreshCw className="animate-spin" /> : <Lightbulb />}
                            {isGenerating ? 'Đang tư duy...' : 'Tư duy ngay'}
                        </button>
                    </div>
                </div>
            </div>

            {/* RESULTS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {SCAMPER_METHODS.map(method => (
                    <div
                        key={method.id}
                        className={`bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col transition-all duration-500 transform ${visibleCards.includes(method.id) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                    >
                        {/* Header */}
                        <div className={`p-4 border-b border-slate-100 flex justify-between items-center rounded-t-3xl ${method.color.replace('text-', 'bg-').replace('border-', 'border-b-').split(' ')[0]} bg-opacity-20`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl ${method.color} bg-white border shadow-sm`}>
                                    {method.letter}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-800 text-sm">{method.name}</div>
                                    <div className="text-xs text-slate-500">{method.desc}</div>
                                </div>
                            </div>
                            <button
                                onClick={() => handleRegenerateSingle(method.id)}
                                className="p-1.5 bg-white rounded-lg text-slate-400 hover:text-indigo-600 shadow-sm hover:shadow transition-all"
                                title="Tạo lại phần này"
                            >
                                <RefreshCw size={14} />
                            </button>
                        </div>

                        {/* Content - V2 Idea Cards */}
                        <div className="p-4 flex-1 min-h-[200px]">
                            {results[method.id] && results[method.id].length > 0 ? (
                                <ul className="space-y-4">
                                    {results[method.id].map((idea: any, idx: number) => (
                                        <li key={idx} className="group border-b border-slate-100 pb-3 last:border-0">
                                            {typeof idea === 'string' ? (
                                                <div className="flex gap-2 items-start">
                                                    <ArrowRight size={14} className="mt-1 flex-shrink-0 text-slate-300" />
                                                    <span className="flex-1 text-sm text-slate-600">{idea}</span>
                                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                        <button onClick={() => handleCopy(idea)} className="text-slate-400 hover:text-indigo-600"><Copy size={12} /></button>
                                                        <button onClick={() => handleSaveIdea(idea)} className="text-slate-400 hover:text-green-600"><Check size={12} /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-1">
                                                    <div className="flex justify-between items-start">
                                                        <div className="font-bold text-slate-800 text-sm">{idea.idea_name}</div>
                                                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                                                            <button onClick={() => handleCopy(getIdeaText(idea))} className="text-slate-400 hover:text-indigo-600"><Copy size={12} /></button>
                                                            <button onClick={() => handleSaveIdea(idea)} className="text-slate-400 hover:text-green-600"><Check size={12} /></button>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-slate-500">{idea.how_to}</div>
                                                    {idea.example && (
                                                        <div className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg mt-1">
                                                            💡 {idea.example}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="h-full flex items-center justify-center text-slate-300 italic text-sm">
                                    {isGenerating ? 'Đang suy nghĩ...' : 'Chưa có ý tưởng'}
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Saved Ideas Panel (Last Card Slot or Separate) */}
                <div className="bg-slate-800 text-white rounded-3xl shadow-lg flex flex-col md:col-span-2 lg:col-span-1">
                    <div className="p-5 border-b border-slate-700 flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2"><Check className="text-green-400" /> Ý tưởng đã chọn</h3>
                        <span className="text-xs bg-slate-700 px-2 py-1 rounded-lg">{savedIdeas.length}</span>
                    </div>
                    <div className="p-5 flex-1 overflow-y-auto custom-scrollbar max-h-[400px]">
                        {savedIdeas.length === 0 ? (
                            <div className="text-slate-500 text-center text-sm italic mt-10">
                                Bấm vào dấu tích ở các thẻ để lưu ý tưởng hay vào đây.
                            </div>
                        ) : (
                            <ul className="space-y-3">
                                {savedIdeas.map((idea, i) => (
                                    <li key={i} className="text-sm text-slate-300 flex justify-between gap-3 border-b border-slate-700/50 pb-2 last:border-0">
                                        <span>{idea}</span>
                                        <button onClick={() => setSavedIdeas(prev => prev.filter((_, idx) => idx !== i))} className="text-slate-500 hover:text-red-400"><Trash2 size={14} /></button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="p-4 border-t border-slate-700 text-center">
                        <button onClick={() => navigator.clipboard.writeText(savedIdeas.join('\n'))} className="text-xs font-bold text-indigo-300 hover:text-white uppercase tracking-wider">Copy All</button>
                    </div>
                </div>
            </div>

            {/* HISTORY MODAL */}
            {showHistory && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><History size={20} /> Lịch sử Tư duy</h3>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700 bg-white p-1 rounded-full shadow-sm"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">Chưa có lịch sử nào.</div>
                            ) : (
                                history.map(session => (
                                    <div key={session.id} onClick={() => handleLoadSession(session)} className="p-4 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-slate-50 cursor-pointer transition-all group">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-slate-800 text-lg">{session.topic}</div>
                                            <button onClick={(e) => handleDeleteSession(e, session.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        {session.context && <p className="text-sm text-slate-500 mb-3 line-clamp-1 italic">"{session.context}"</p>}
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <div className="flex items-center gap-1"><Clock size={12} /> {new Date(session.createdAt).toLocaleDateString('vi-VN')}</div>
                                            <div className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-bold border border-green-100">
                                                {session.savedIdeas?.length || 0} ý tưởng đã lưu
                                            </div>
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