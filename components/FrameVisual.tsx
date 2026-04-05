import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Film, Play, Download, Maximize2, X, Clapperboard, RefreshCw, Save, History, Clock } from 'lucide-react';
import { generateStoryboardFrame } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { StoryFrame, StoryboardProject } from '../types';
import { Toast, ToastType } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

const STYLES = ['Cinematic', 'Anime', 'Line Art', 'Watercolor', 'Cyberpunk', 'Realistic', 'Sketch'];

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const FrameVisual: React.FC = () => {
    const [projectId, setProjectId] = useState<string>(Date.now().toString());
    const [projectName, setProjectName] = useState('New Storyboard');
    const [frames, setFrames] = useState<StoryFrame[]>([
        { id: '1', script: '', isLoading: false }
    ]);
    const [selectedStyle, setSelectedStyle] = useState('Cinematic');
    const [isGlobalGenerating, setIsGlobalGenerating] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    // Modal States
    const [showHistory, setShowHistory] = useState(false);
    const [savedProjects, setSavedProjects] = useState<StoryboardProject[]>([]);

    // Notification UI States
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        isDestructive?: boolean;
    }>({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    useEffect(() => {
        if (showHistory) {
            setSavedProjects(StorageService.getStoryboards());
        }
    }, [showHistory]);

    // Helpers for UI
    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const closeConfirmDialog = () => {
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
    };

    const handleCreateNew = () => {
        setConfirmDialog({
            isOpen: true,
            title: 'Tạo dự án mới?',
            message: 'Những thay đổi chưa lưu sẽ bị mất. Bạn có chắc chắn muốn tạo mới không?',
            onConfirm: () => {
                setProjectId(Date.now().toString());
                setProjectName('New Storyboard');
                setFrames([{ id: '1', script: '', isLoading: false }]);
                setSelectedStyle('Cinematic');
                closeConfirmDialog();
                showToast('Đã tạo dự án mới', 'success');
            }
        });
    };

    const handleSave = () => {
        const project: StoryboardProject = {
            id: projectId,
            name: projectName,
            createdAt: parseInt(projectId),
            updatedAt: Date.now(),
            style: selectedStyle,
            frames: frames
        };
        const success = StorageService.saveStoryboard(project);
        if (success) {
            showToast("Đã lưu dự án thành công!", "success");
        } else {
            showToast("Không thể lưu. Bộ nhớ đầy.", "error");
        }
    };

    const handleLoadProject = (project: StoryboardProject) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Mở dự án?',
            message: `Bạn có muốn mở dự án "${project.name}" không? Nội dung hiện tại sẽ bị thay thế.`,
            onConfirm: () => {
                setProjectId(project.id);
                setProjectName(project.name);
                setFrames(project.frames);
                setSelectedStyle(project.style);
                setShowHistory(false);
                closeConfirmDialog();
                showToast(`Đã tải dự án "${project.name}"`, 'success');
            }
        });
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setConfirmDialog({
            isOpen: true,
            title: 'Xóa dự án?',
            message: 'Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa không?',
            isDestructive: true,
            onConfirm: () => {
                StorageService.deleteStoryboard(id);
                setSavedProjects(prev => prev.filter(p => p.id !== id));
                closeConfirmDialog();
                showToast('Đã xóa dự án', 'success');
            }
        });
    };

    const addFrame = () => {
        setFrames([...frames, {
            id: Date.now().toString(),
            script: '',
            isLoading: false
        }]);
    };

    const removeFrame = (id: string) => {
        if (frames.length > 1) {
            setFrames(frames.filter(f => f.id !== id));
        } else {
            showToast("Phải có ít nhất 1 frame", "error");
        }
    };

    const updateScript = (id: string, text: string) => {
        setFrames(frames.map(f => f.id === id ? { ...f, script: text } : f));
    };

    const generateSingleFrame = async (frame: StoryFrame) => {
        if (!frame.script.trim()) {
            showToast("Vui lòng nhập kịch bản cho frame này", "error");
            return;
        }

        setFrames(prev => prev.map(f => f.id === frame.id ? { ...f, isLoading: true, error: undefined } : f));

        const imageUrl = await generateStoryboardFrame(frame.script, selectedStyle);

        setFrames(prev => prev.map(f => f.id === frame.id ? {
            ...f,
            isLoading: false,
            imageUrl: imageUrl || undefined,
            error: imageUrl ? undefined : "Lỗi tạo ảnh"
        } : f));
    };

    const generateAll = async () => {
        const hasScript = frames.some(f => f.script.trim().length > 0);
        if (!hasScript) {
            showToast("Vui lòng nhập kịch bản trước khi tạo ảnh", "error");
            return;
        }

        setIsGlobalGenerating(true);
        const promises = frames.map(async (frame) => {
            if (frame.script.trim()) {
                return generateSingleFrame(frame);
            }
        });
        await Promise.all(promises);
        setIsGlobalGenerating(false);
        showToast("Đã hoàn tất quá trình tạo ảnh", "success");
    };

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <Clapperboard size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Visual Production
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        Frame Visual Storyboard
                    </h1>
                    <div className="mt-2 flex items-center gap-2">
                        <input
                            className="border-b border-transparent bg-transparent py-0.5 text-sm font-normal text-stone-500 outline-none transition-colors hover:border-stone-300 focus:border-stone-400 focus:text-stone-700"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Tên dự án..."
                        />
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleCreateNew}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                    >
                        <Plus size={17} strokeWidth={1.25} /> Tạo mới
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowHistory(true)}
                        className="inline-flex size-10 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                        title="Lịch sử"
                        aria-label="Mở lịch sử khung hình"
                    >
                        <History size={17} strokeWidth={1.25} />
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                    >
                        <Save size={17} strokeWidth={1.25} /> Lưu
                    </button>

                    <div className="h-6 w-px bg-stone-200 hidden md:block" />

                    {/* Style Selector */}
                    <div className="inline-flex rounded-full border border-stone-200 bg-stone-50 p-1">
                        {STYLES.map(s => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setSelectedStyle(s)}
                                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                                    selectedStyle === s
                                        ? 'bg-white text-stone-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                                        : 'text-stone-500 hover:text-stone-700'
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={generateAll}
                        disabled={isGlobalGenerating}
                        className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isGlobalGenerating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Play size={17} fill="currentColor" />}
                        Generate All
                    </button>
                </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {frames.map((frame, index) => (
                        <div key={frame.id} className={`${cardClass} flex flex-col overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]`}>
                            {/* Header */}
                            <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-5 py-3">
                                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-stone-500">
                                    Frame {index + 1}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeFrame(frame.id)}
                                    className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                >
                                    <Trash2 size={15} strokeWidth={1.25} />
                                </button>
                            </div>

                            {/* Image Area */}
                            <div className="relative aspect-video bg-stone-100">
                                {frame.isLoading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-stone-100">
                                        <RefreshCw className="h-8 w-8 animate-spin text-stone-400" />
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-stone-500">Creating Visual...</span>
                                    </div>
                                ) : frame.imageUrl ? (
                                    <>
                                        <img
                                            src={frame.imageUrl}
                                            alt={`Frame ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover/img:bg-black/20 group-hover/img:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => setLightboxUrl(frame.imageUrl!)}
                                                className="rounded-xl bg-white p-2 shadow-lg transition-transform hover:scale-110"
                                                title="Xem lớn"
                                            >
                                                <Maximize2 size={18} strokeWidth={1.25} />
                                            </button>
                                            <a
                                                href={frame.imageUrl}
                                                download={`storyboard-frame-${index + 1}.png`}
                                                className="rounded-xl bg-stone-900 p-2 text-white shadow-lg transition-transform hover:scale-110"
                                                title="Tải xuống"
                                            >
                                                <Download size={18} strokeWidth={1.25} />
                                            </a>
                                            <button
                                                type="button"
                                                onClick={() => generateSingleFrame(frame)}
                                                className="rounded-xl bg-white p-2 shadow-lg transition-transform hover:scale-110"
                                                title="Tạo lại"
                                            >
                                                <RefreshCw size={18} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center text-stone-300">
                                        <Film size={40} strokeWidth={1} />
                                        <p className="mt-2 text-sm font-medium">Chưa có hình ảnh</p>
                                        {frame.error && <p className="mt-1 text-xs text-rose-500">{frame.error}</p>}
                                    </div>
                                )}
                            </div>

                            {/* Script Input */}
                            <div className="flex flex-1 flex-col p-4">
                                <textarea
                                    className="min-h-[100px] flex-1 resize-none rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-200/80 transition-all"
                                    placeholder="Mô tả chi tiết cảnh phim, hành động, góc máy..."
                                    value={frame.script}
                                    onChange={(e) => updateScript(frame.id, e.target.value)}
                                />
                                <div className="mt-3 flex justify-end">
                                    {!frame.isLoading && (
                                        <button
                                            type="button"
                                            onClick={() => generateSingleFrame(frame)}
                                            disabled={!frame.script.trim()}
                                            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {frame.imageUrl ? 'Regenerate' : 'Generate'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add New Frame Button */}
                    <button
                        type="button"
                        onClick={addFrame}
                        className="flex aspect-video flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/40 text-stone-400 transition-all hover:border-stone-300 hover:bg-stone-100/60 hover:text-stone-600"
                    >
                        <div className="mb-3 rounded-full bg-stone-100 p-4 shadow-sm transition-colors group-hover:bg-white">
                            <Plus size={28} strokeWidth={1.25} />
                        </div>
                        <span className="text-base font-medium">Thêm Frame Mới</span>
                    </button>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setLightboxUrl(null)}
                >
                    <button
                        onClick={() => setLightboxUrl(null)}
                        className="absolute top-6 right-6 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                    >
                        <X size={28} strokeWidth={1.25} />
                    </button>
                    <img
                        src={lightboxUrl}
                        className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
                        alt="Full View"
                    />
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm"
                    onClick={() => setShowHistory(false)}
                >
                    <div
                        className="flex w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-stone-200/90 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 p-5">
                            <h3 className="flex items-center gap-2 text-lg font-medium tracking-tight text-stone-900">
                                <History size={20} strokeWidth={1.25} className="text-stone-400" />
                                Lịch sử Storyboard
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowHistory(false)}
                                className="rounded-full p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                            >
                                <X size={20} strokeWidth={1.25} />
                            </button>
                        </div>

                        <div className="grid max-h-[60vh] grid-cols-1 gap-4 overflow-y-auto p-5 md:grid-cols-2">
                            {savedProjects.length === 0 ? (
                                <div className="col-span-2 py-12 text-center text-sm text-stone-400">
                                    Chưa có dự án nào được lưu.
                                </div>
                            ) : (
                                savedProjects.map(project => (
                                    <div
                                        key={project.id}
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => handleLoadProject(project)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleLoadProject(project)}
                                        className="group flex cursor-pointer gap-4 rounded-2xl border border-stone-200 bg-white p-4 transition-all hover:border-stone-300 hover:bg-stone-50/60"
                                    >
                                        <div className="aspect-video w-32 shrink-0 overflow-hidden rounded-xl border border-stone-100 bg-stone-100">
                                            {project.frames.find(f => f.imageUrl) ? (
                                                <img
                                                    src={project.frames.find(f => f.imageUrl)?.imageUrl}
                                                    className="h-full w-full object-cover"
                                                    alt="Thumb"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-stone-300">
                                                    <Film size={18} strokeWidth={1.25} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex min-w-0 flex-1 flex-col">
                                            <div className="mb-1 flex items-start justify-between gap-2">
                                                <h4 className="truncate text-sm font-medium text-stone-900">{project.name}</h4>
                                                <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                                    className="shrink-0 rounded-lg p-1 text-stone-400 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14} strokeWidth={1.25} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-1 text-[11px] text-stone-400">
                                                <Clock size={11} strokeWidth={1.25} />
                                                {new Date(project.updatedAt).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-600">
                                                    {project.style}
                                                </span>
                                                <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-600">
                                                    {project.frames.length} frames
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Global UI Components */}
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                isDestructive={confirmDialog.isDestructive}
                onConfirm={confirmDialog.onConfirm}
                onCancel={closeConfirmDialog}
            />
        </div>
    );
};

export default FrameVisual;
