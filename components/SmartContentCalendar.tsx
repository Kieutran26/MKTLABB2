import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarDays, Sparkles, Plus, Settings2, Check, X, FileText, Video, Image as ImageIcon, LayoutGrid, Users, Target, Loader2, ArrowRight, PenTool, Shuffle, RotateCcw, Lightbulb, Save, FolderOpen, Trash2, History, Clock } from 'lucide-react';
import { generateContentCalendar, suggestPillarsFromStrategy } from '../services/geminiService';
import { useBrand } from './BrandContext';
import { MastermindStrategy, ContentPillar, ContentPlanItem, Persona, CalendarProject } from '../types';
import { StorageService } from '../services/storageService';
import { Toast, ToastType } from './Toast';
import BrandSelector from './BrandSelector';
import FeatureHeader from './FeatureHeader';

const DEFAULT_PILLARS: ContentPillar[] = [
    { name: 'Giáo dục (Educate)', weight: 40, color: '#3b82f6' }, // Blue
    { name: 'Bán hàng (Sell)', weight: 20, color: '#ef4444' }, // Red
    { name: 'Giải trí (Entertain)', weight: 20, color: '#eab308' }, // Yellow
    { name: 'Uy tín (Trust)', weight: 20, color: '#22c55e' } // Green
];

const DEFAULT_ANGLES = ['Storytelling', 'How-to / Tutorial', 'Controversial / Debate', 'Behind the Scenes', 'Comparison', 'Social Proof / Case Study', 'Trend Jacking'];

interface SmartContentCalendarProps {
    onNavigateToContent?: (topic: string, context: string) => void;
    initialStrategy?: MastermindStrategy | null; // NEW: Receive strategy
}

const SmartContentCalendar: React.FC<SmartContentCalendarProps> = ({ onNavigateToContent, initialStrategy }) => {
    const { currentBrand } = useBrand();

    // Main State
    const [events, setEvents] = useState<any[]>([]);
    const [previousEvents, setPreviousEvents] = useState<any[]>([]);

    // Project Management
    const [projectId, setProjectId] = useState<string | null>(null);
    const [projectName, setProjectName] = useState('');
    const [savedProjects, setSavedProjects] = useState<CalendarProject[]>([]);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [showSaveModal, setShowSaveModal] = useState(false);

    // Wizard State
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [step, setStep] = useState(0); // Start at 0 for Strategy
    const [isLoading, setIsLoading] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: ToastType; actionLabel?: string; onAction?: () => void } | null>(null);

    // Configuration Data
    const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
    const [overallStrategy, setOverallStrategy] = useState(''); // Level 1: Strategy
    const [pillars, setPillars] = useState<ContentPillar[]>(DEFAULT_PILLARS); // Level 2: Pillars
    const [selectedAngles, setSelectedAngles] = useState<string[]>(DEFAULT_ANGLES.slice(0, 4)); // Level 3: Angles
    const [customAngle, setCustomAngle] = useState(''); // Input for custom angle
    const [availableAngles, setAvailableAngles] = useState<string[]>(DEFAULT_ANGLES);

    // Pillar Validation State
    const [totalWeight, setTotalWeight] = useState(100);
    const [isPillarValid, setIsPillarValid] = useState(true);

    // Selection Data
    const [availablePersonas, setAvailablePersonas] = useState<Persona[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<ContentPlanItem | null>(null);

    useEffect(() => {
        const allPersonas = StorageService.getPersonas();
        if (currentBrand) {
            const brandPersonas = allPersonas.filter(p => p.brandId === currentBrand.id);
            const manualPersonas = allPersonas.filter(p => p.brandId === 'manual');
            // Remove duplicates just in case
            const combined = [...brandPersonas, ...manualPersonas];
            const uniquePersonas = combined.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
            setAvailablePersonas(uniquePersonas);
        } else {
            setAvailablePersonas(allPersonas);
        }
        // Load projects list
        setSavedProjects(StorageService.getCalendarProjects());
    }, [currentBrand, showConfigModal]);

    // NEW: Handle Initial Strategy Import
    useEffect(() => {
        if (initialStrategy) {
            // Construct a comprehensive strategy context from Mastermind data
            const importedContext = `
            [MASTERMIND STRATEGY IMPROT]
            Core Message: "${initialStrategy.result.coreMessage}"
            Insight: "${initialStrategy.result.insight}"
            Objective: "${initialStrategy.objective}"
            Key Messages: ${initialStrategy.result.keyMessages.join('; ')}
            Tone: "${initialStrategy.tone}"
            `.trim();

            setOverallStrategy(importedContext);
            setStep(0); // Start at Strategy Step
            setShowConfigModal(true); // Open Wizard
            showToast("Đã nhập dữ liệu từ Mastermind Strategy!", "success");
        }
    }, [initialStrategy]);

    // Recalculate total weight whenever pillars change
    useEffect(() => {
        const total = pillars.reduce((sum, p) => sum + (p.weight || 0), 0);
        setTotalWeight(total);
        setIsPillarValid(total === 100);
    }, [pillars]);

    const showToast = (message: string, type: ToastType = 'info', actionLabel?: string, onAction?: () => void) => {
        setToast({ message, type, actionLabel, onAction });
    };

    // --- EVENT HANDLERS ---

    // 1. Strategy & Pillar AI Suggestion
    const handleSuggestPillars = async () => {
        if (!overallStrategy.trim()) {
            showToast("Vui lòng nhập chiến lược tổng thể", "error");
            return;
        }
        setIsLoading(true);
        try {
            const brandCtx = currentBrand ? `Brand: ${currentBrand.identity.name}` : "";
            const suggestedPillars = await suggestPillarsFromStrategy(overallStrategy, brandCtx);
            if (suggestedPillars.length > 0) {
                setPillars(suggestedPillars);
                setStep(2); // Move to Pillar step
            } else {
                showToast("Không thể gợi ý Pillars. Hãy thử lại.", "error");
            }
        } catch (e) {
            showToast("Lỗi kết nối AI", "error");
        } finally {
            setIsLoading(false);
        }
    };

    // Dynamic Pillar Management
    const handlePillarChange = (index: number, field: keyof ContentPillar, value: any) => {
        const newPillars = [...pillars];
        newPillars[index] = { ...newPillars[index], [field]: value };
        setPillars(newPillars);
    };

    const addPillar = () => {
        setPillars([...pillars, { name: '', weight: 0, color: '#94a3b8' }]);
    };

    const removePillar = (index: number) => {
        const newPillars = pillars.filter((_, i) => i !== index);
        setPillars(newPillars);
    };

    // Custom Angle Management
    const toggleAngle = (angle: string) => {
        if (selectedAngles.includes(angle)) {
            setSelectedAngles(prev => prev.filter(a => a !== angle));
        } else {
            setSelectedAngles(prev => [...prev, angle]);
        }
    };

    const handleAddCustomAngle = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && customAngle.trim()) {
            const newAngle = customAngle.trim();
            if (!availableAngles.includes(newAngle)) {
                setAvailableAngles([...availableAngles, newAngle]);
            }
            if (!selectedAngles.includes(newAngle)) {
                setSelectedAngles([...selectedAngles, newAngle]);
            }
            setCustomAngle('');
        }
    };

    // 2. Calendar Generation
    const fetchCalendar = async (isShuffle: boolean) => {

        if (!isShuffle && !isPillarValid) {
            showToast("Tổng tỷ trọng phải bằng 100%", "error");
            return;
        }

        if (isShuffle) setIsShuffling(true);
        else setIsLoading(true);

        if (events.length > 0 && isShuffle) {
            setPreviousEvents(events);
        }

        const today = new Date();
        const month = (today.getMonth() + 1).toString();
        const year = today.getFullYear();

        const brandContext = currentBrand
            ? `Brand: ${currentBrand.identity.name}. Vision: ${currentBrand.strategy.vision}`
            : "General Content (No specific brand)";
        const personaContext = selectedPersona
            ? `Target Audience: ${selectedPersona.fullname}, ${selectedPersona.jobTitle}. Pain points: ${selectedPersona.frustrations.join(', ')}`
            : "General Audience";

        const generatedItems = await generateContentCalendar(
            brandContext,
            personaContext,
            pillars,
            selectedAngles,
            month,
            year,
            isShuffle,
            overallStrategy // Pass Strategy Context
        );

        if (generatedItems.length > 0) {
            const calendarEvents = generatedItems.map(item => ({
                id: item.id,
                title: item.title,
                start: item.date,
                backgroundColor: pillars.find(p => p.name.includes(item.pillar))?.color || '#6366f1',
                borderColor: 'transparent',
                extendedProps: { ...item }
            }));

            setEvents(calendarEvents);
            setShowConfigModal(false);
            // Reset Project ID if new generation to force new save
            if (!isShuffle) setProjectId(null);

            if (isShuffle) {
                showToast("Đã xào lại kế hoạch!", "success", "Hoàn tác", handleUndo);
            } else {
                showToast("Đã lập kế hoạch thành công!", "success");
            }
        } else {
            showToast("Lỗi khi tạo lịch.", "error");
        }

        setIsLoading(false);
        setIsShuffling(false);
    };

    const handleGenerate = () => fetchCalendar(false);

    const handleShuffle = () => {
        if (events.length === 0) {
            showToast("Chưa có kế hoạch nào để xào lại.", "error");
            return;
        }
        fetchCalendar(true);
    };

    const handleUndo = () => {
        if (previousEvents.length > 0) {
            setEvents(previousEvents);
            setPreviousEvents([]);
            showToast("Đã hoàn tác", "info");
        }
    };

    // 3. Drag & Drop Handler
    const handleEventDrop = (info: any) => {
        // FullCalendar handles the visual drop, we need to update our state
        const updatedEvents = events.map(evt => {
            if (evt.id === info.event.id) {
                return {
                    ...evt,
                    start: info.event.startStr // Update date string
                };
            }
            return evt;
        });
        setEvents(updatedEvents);

        // Also update the internal extendedProps if needed for consistency
        const droppedEvent = updatedEvents.find(e => e.id === info.event.id);
        if (droppedEvent) {
            droppedEvent.extendedProps.date = info.event.startStr;
        }
    };

    // 4. Save & Load Project
    const handleSaveProject = () => {
        if (!projectName.trim()) {
            showToast("Vui lòng nhập tên kế hoạch", "error");
            return;
        }

        const newProject: CalendarProject = {
            id: projectId || Date.now().toString(),
            name: projectName,
            brandId: currentBrand?.id || 'unknown',
            overallStrategy,
            pillars,
            events: events.map(e => ({
                ...e.extendedProps,
                id: e.id,
                date: e.start,
                title: e.title
            })),
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        StorageService.saveCalendarProject(newProject);
        setProjectId(newProject.id);
        setSavedProjects(StorageService.getCalendarProjects());
        setShowSaveModal(false);
        showToast("Đã lưu kế hoạch!", "success");
    };

    const handleLoadProject = (project: CalendarProject) => {
        setProjectId(project.id);
        setProjectName(project.name);
        setOverallStrategy(project.overallStrategy);
        setPillars(project.pillars);

        const loadedEvents = project.events.map(item => ({
            id: item.id,
            title: item.title,
            start: item.date,
            backgroundColor: project.pillars.find(p => p.name.includes(item.pillar))?.color || '#6366f1',
            borderColor: 'transparent',
            extendedProps: { ...item }
        }));

        setEvents(loadedEvents);
        setShowLoadModal(false);
        showToast(`Đã tải "${project.name}"`, "success");
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Xóa kế hoạch này?")) {
            StorageService.deleteCalendarProject(id);
            setSavedProjects(prev => prev.filter(p => p.id !== id));
        }
    };

    const handleWriteContent = () => {
        if (selectedEvent && onNavigateToContent) {
            const context = `
            Strategy: ${overallStrategy}
            Pillar: ${selectedEvent.pillar}
            Angle: ${selectedEvent.angle}
            Brief: ${selectedEvent.content_brief}
            Format: ${selectedEvent.format}
            `;
            onNavigateToContent(selectedEvent.title, context);
        }
    };

    const renderEventContent = (eventInfo: any) => {
        const props = eventInfo.event.extendedProps;
        let Icon = FileText;
        if (props.format === 'Video') Icon = Video;
        if (props.format === 'Image') Icon = ImageIcon;
        if (props.format === 'Carousel') Icon = LayoutGrid;

        return (
            <div className="flex items-center gap-1 overflow-hidden p-0.5">
                <Icon size={12} className="shrink-0 opacity-80" />
                <div className="truncate text-xs font-medium">{eventInfo.event.title}</div>
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col bg-[#FCFDFC] overflow-hidden font-sans">
            <FeatureHeader
                icon={CalendarDays}
                eyebrow="AI CONTENT STRATEGY & SCHEDULING"
                title="Smart Content Calendar"
                subline="Đối thoại cùng AI → Tự động hóa lịch nội dung đa kênh chuyên nghiệp."
            >
                {events.length > 0 && (
                    <>
                        <button
                            onClick={handleShuffle}
                            disabled={isShuffling}
                            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50/80 disabled:opacity-70"
                            title="Xào lại ý tưởng"
                        >
                            {isShuffling ? <Loader2 size={18} className="animate-spin text-stone-400" /> : <Shuffle size={18} strokeWidth={1.5} className="text-stone-500" />}
                            <span className="hidden xl:inline">Xào lại</span>
                        </button>
                        <button
                            onClick={() => setShowSaveModal(true)}
                            className="inline-flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                            title="Lưu kế hoạch"
                        >
                            <Save size={18} strokeWidth={1.5} className="text-stone-500" />
                            <span className="hidden xl:inline">Lưu</span>
                        </button>
                    </>
                )}

                <button
                    onClick={() => setShowLoadModal(true)}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-stone-200 bg-white text-stone-700 shadow-sm transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                    title={`Lịch sử (${savedProjects.length})`}
                    aria-label={`Mở lịch sử lịch nội dung, ${savedProjects.length} dự án đã lưu`}
                >
                    <History size={18} strokeWidth={1.5} className="text-stone-500" />
                </button>

                <button
                    onClick={() => { setStep(0); setShowConfigModal(true); }}
                    className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-95"
                >
                    <Plus size={18} strokeWidth={2.5} /> <span className="hidden md:inline">Lập kế hoạch</span>
                </button>
            </FeatureHeader>

            <div className="flex-1 p-6 overflow-y-auto relative">
                {isShuffling && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center flex-col gap-4">
                        <Loader2 size={48} className="text-stone-700 animate-spin" />
                        <p className="font-medium text-stone-700 animate-pulse">AI đang tái cấu trúc ý tưởng...</p>
                    </div>
                )}

                <div className="bg-white p-6 rounded-2xl border border-stone-200/90 shadow-[0_1px_2px_rgba(15,23,42,0.04)] h-full">
                    <FullCalendar
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek'
                        }}
                        events={events}
                        editable={true}
                        droppable={true}
                        selectable={true}
                        eventContent={renderEventContent}
                        eventClick={(info) => setSelectedEvent(info.event.extendedProps as ContentPlanItem)}
                        eventDrop={handleEventDrop} // Drag & Drop handler
                        height="100%"
                    />
                </div>
            </div>

            {/* CONFIGURATION WIZARD MODAL */}
            {showConfigModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in border border-stone-200/90 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 rounded-t-2xl">
                            <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2">
                                <Settings2 size={18} className="text-stone-400" /> Thiết lập Kế hoạch (Bước {step + 1}/4)
                            </h3>
                            <button onClick={() => setShowConfigModal(false)} className="text-stone-400 hover:text-stone-700 bg-white p-1 rounded-full shadow-sm"><X size={18} /></button>
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {/* STEP 0: STRATEGY (Top-Down Layer) */}
                            {step === 0 && (
                                <div className="space-y-6 animate-in slide-in-from-right">
                                    <h4 className="text-lg font-medium text-stone-900 mb-2">Chiến lược Tổng thể</h4>
                                    <p className="text-sm text-stone-500 mb-4">
                                        Hãy mô tả mục tiêu chiến dịch tháng này. AI sẽ tự động đề xuất các chủ đề (Pillars) phù hợp.
                                    </p>

                                    <textarea
                                        className="w-full p-4 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-200/80 h-32 resize-none"
                                        placeholder="VD: Tăng nhận diện thương hiệu cho GenZ với thông điệp sống xanh..."
                                        value={overallStrategy}
                                        onChange={e => setOverallStrategy(e.target.value)}
                                    />

                                    <div className="bg-stone-50/70 p-4 rounded-xl border border-stone-200">
                                        <label className="block text-sm font-semibold text-stone-700 mb-2">Ngữ cảnh Thương hiệu & Persona</label>
                                        <div className="mb-4"><BrandSelector /></div>

                                        <div className="grid grid-cols-2 gap-3">
                                            {availablePersonas.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => setSelectedPersona(p)}
                                                    className={`p-3 rounded-xl border cursor-pointer flex items-center gap-3 transition-all ${selectedPersona?.id === p.id ? 'border-stone-400 bg-white ring-2 ring-stone-200' : 'border-stone-200 bg-white/70 hover:border-stone-300'}`}
                                                >
                                                    <img src={p.avatarUrl} className="w-8 h-8 rounded-full bg-stone-100" />
                                                    <div>
                                                        <div className="font-semibold text-sm text-stone-800">{p.fullname}</div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: PILLARS (Dynamic List & Validation) */}
                            {step === 2 && (
                                <div className="space-y-6 animate-in slide-in-from-right">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-lg font-medium text-stone-900 flex items-center gap-2">
                                            <Lightbulb size={18} className="text-stone-400" /> Phân bổ Chủ đề
                                        </h4>
                                        <button onClick={addPillar} className="text-xs font-semibold text-stone-600 hover:bg-stone-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-stone-200">
                                            <Plus size={14} /> Thêm Pillar
                                        </button>
                                    </div>
                                    <p className="text-sm text-stone-500 mb-4">Điều chỉnh tên chủ đề và tỷ trọng. Tổng phải bằng 100%.</p>

                                    <div className="space-y-3">
                                        {pillars.map((p, idx) => (
                                            <div key={idx} className="flex gap-3 items-center group">
                                                <input
                                                    className="flex-1 p-3 border border-stone-200 rounded-xl text-sm focus:border-stone-300 focus:ring-2 focus:ring-stone-200/80 outline-none font-medium"
                                                    value={p.name}
                                                    onChange={(e) => handlePillarChange(idx, 'name', e.target.value)}
                                                    placeholder="Tên chủ đề..."
                                                />
                                                <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 w-32">
                                                    <input
                                                        type="number"
                                                        className="w-12 bg-transparent text-right font-semibold text-stone-700 focus:outline-none"
                                                        value={p.weight}
                                                        onChange={(e) => handlePillarChange(idx, 'weight', Number(e.target.value))}
                                                    />
                                                    <span className="text-stone-400 text-sm">%</span>
                                                </div>
                                                <div className="w-8 h-8 rounded-full border border-stone-200 shrink-0" style={{ backgroundColor: p.color }}></div>
                                                <button onClick={() => removePillar(idx)} className="text-stone-300 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className={`text-right text-sm font-semibold mt-2 ${isPillarValid ? 'text-stone-700' : 'text-rose-600'}`}>
                                            Tổng cộng: {totalWeight}%
                                            {!isPillarValid && <span className="ml-2 text-xs font-normal">(Phải bằng 100%)</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: ANGLES (Custom Input) */}
                            {step === 3 && (
                                <div className="space-y-6 animate-in slide-in-from-right">
                                    <h4 className="text-lg font-medium text-stone-900 mb-4 flex items-center gap-2"><span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center text-xs">3</span> Góc tiếp cận (Angles)</h4>

                                    <div className="mb-4">
                                        <input
                                            className="w-full p-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-200/80 transition-all"
                                            placeholder="Thêm góc nhìn khác (Nhấn Enter)..."
                                            value={customAngle}
                                            onChange={e => setCustomAngle(e.target.value)}
                                            onKeyDown={handleAddCustomAngle}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {availableAngles.map(angle => (
                                            <button
                                                key={angle}
                                                onClick={() => toggleAngle(angle)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${selectedAngles.includes(angle) ? 'bg-stone-900 text-white border-stone-900 shadow-sm' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'}`}
                                            >
                                                {angle}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="bg-stone-50 p-4 rounded-xl text-stone-700 border border-stone-200 text-sm mt-4">
                                        💡 Hệ thống sẽ tự động phối hợp các <b>Góc tiếp cận</b> này với <b>Chủ đề</b> đã chọn để tạo ra lịch nội dung đa dạng.
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-6 border-t border-stone-100 flex justify-between bg-stone-50/50 rounded-b-2xl">
                            {step > 0 ? (
                                <button onClick={() => setStep(step === 2 ? 0 : step - 1)} className="text-stone-500 font-medium hover:text-stone-800 px-4 py-2">Quay lại</button>
                            ) : <div></div>}

                            {step === 0 ? (
                                <button
                                    onClick={handleSuggestPillars}
                                    disabled={isLoading}
                                    className="bg-stone-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                    Tiếp theo: Gợi ý Pillars
                                </button>
                            ) : step < 3 ? (
                                <button
                                    onClick={() => setStep(step + 1)}
                                    disabled={step === 2 && !isPillarValid}
                                    className={`bg-stone-900 text-white px-6 py-2.5 rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center gap-2 ${step === 2 && !isPillarValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    Tiếp theo <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleGenerate}
                                    disabled={isLoading}
                                    className="bg-stone-900 text-white px-8 py-2.5 rounded-full font-medium hover:bg-stone-800 transition-colors disabled:opacity-70 flex items-center gap-2"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                                    Tạo Kế Hoạch Tháng
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* SAVE MODAL */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-stone-200/90 animate-in fade-in zoom-in">
                        <h3 className="text-base font-semibold text-stone-900 mb-4">Lưu Kế Hoạch</h3>
                        <input className="w-full p-3 bg-white border border-stone-200 rounded-xl text-sm mb-4 focus:outline-none focus:border-stone-300 focus:ring-2 focus:ring-stone-200/80" placeholder="Tên kế hoạch (VD: Tháng 12 - GenZ)..." value={projectName} onChange={(e) => setProjectName(e.target.value)} autoFocus />
                        <div className="flex gap-3">
                            <button onClick={() => setShowSaveModal(false)} className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-500 font-medium hover:bg-stone-50 transition-colors">Hủy</button>
                            <button onClick={handleSaveProject} className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LOAD MODAL (HISTORY) */}
            {showLoadModal && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-stone-200/90 animate-in fade-in zoom-in flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50 rounded-t-2xl">
                            <h3 className="text-base font-semibold text-stone-900 flex items-center gap-2"><History size={18} strokeWidth={1.25} className="text-stone-400" /> Lịch sử Kế hoạch</h3>
                            <button onClick={() => setShowLoadModal(false)} className="text-stone-400 hover:text-stone-700 bg-white p-1 rounded-full shadow-sm"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto space-y-3 custom-scrollbar">
                            {savedProjects.length === 0 ? <div className="text-center py-10 text-stone-400">Chưa có kế hoạch nào được lưu.</div> : savedProjects.map(p => (
                                <div key={p.id} className="p-4 rounded-2xl border border-stone-200/90 hover:border-stone-300 hover:bg-stone-50/60 transition-all bg-white cursor-pointer group" onClick={() => handleLoadProject(p)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-semibold text-stone-900 text-lg">{p.name}</div>
                                        <button onClick={(e) => handleDeleteProject(e, p.id)} className="p-1.5 text-stone-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="text-xs text-stone-500 mb-2 line-clamp-1 italic">"{p.overallStrategy}"</div>
                                    <div className="flex items-center gap-2 text-xs text-stone-400">
                                        <Clock size={12} /> {new Date(p.updatedAt).toLocaleDateString('vi-VN')} • {p.events.length} bài
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* DETAIL EVENT MODAL */}
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in border border-stone-200/90">
                        <div className="p-6 border-b border-stone-100 flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 uppercase mb-1">
                                    <span>{new Date(selectedEvent.date).toLocaleDateString('vi-VN')}</span>
                                    <span>•</span>
                                    <span className="text-stone-700">{selectedEvent.pillar}</span>
                                </div>
                                <h3 className="text-xl font-semibold text-stone-900 leading-tight">{selectedEvent.title}</h3>
                            </div>
                            <button onClick={() => setSelectedEvent(null)} className="text-stone-400 hover:text-stone-700 bg-stone-50 p-1.5 rounded-full"><X size={18} /></button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <span className="px-3 py-1 bg-stone-100 rounded-lg text-xs font-semibold text-stone-600 border border-stone-200">Angle: {selectedEvent.angle}</span>
                                <span className="px-3 py-1 bg-stone-100 rounded-lg text-xs font-semibold text-stone-600 border border-stone-200">Format: {selectedEvent.format}</span>
                            </div>

                            <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 text-sm text-stone-700 leading-relaxed">
                                {selectedEvent.content_brief}
                            </div>

                            <button
                                onClick={handleWriteContent}
                                className="w-full py-3 bg-stone-900 text-white font-medium rounded-xl hover:bg-stone-800 shadow-sm flex items-center justify-center gap-2 transition-all"
                            >
                                <PenTool size={18} /> Viết bài này ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} actionLabel={toast.actionLabel} onAction={toast.onAction} onClose={() => setToast(null)} />}
        </div>
    );
};

export default SmartContentCalendar;