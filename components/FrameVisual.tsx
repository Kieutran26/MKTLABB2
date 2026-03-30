import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Film, Play, Image as ImageIcon, Download, Maximize2, X, Clapperboard, RefreshCw, Save, History, Clock } from 'lucide-react';
import { generateStoryboardFrame } from '../services/geminiService';
import { StorageService } from '../services/storageService';
import { StoryFrame, StoryboardProject } from '../types';
import { Toast, ToastType } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

const STYLES = ['Cinematic', 'Anime', 'Line Art', 'Watercolor', 'Cyberpunk', 'Realistic', 'Sketch'];

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
            createdAt: parseInt(projectId), // rough approximation if new
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
        // Validate if there's any script
        const hasScript = frames.some(f => f.script.trim().length > 0);
        if (!hasScript) {
            showToast("Vui lòng nhập kịch bản trước khi tạo ảnh", "error");
            return;
        }

        setIsGlobalGenerating(true);
        // Process sequentially using Promise.all to trigger all requests
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
        <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Clapperboard className="text-slate-700" strokeWidth={1.5} />
                        Frame Visual Storyboard
                    </h2>
                    <div className="flex items-center gap-2 mt-2">
                         <input 
                            className="text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none transition-colors"
                            value={projectName}
                            onChange={(e) => setProjectName(e.target.value)}
                            placeholder="Tên dự án..."
                         />
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                     <button 
                        onClick={handleCreateNew}
                        className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                     >
                        <Plus size={18} strokeWidth={1.5} /> <span className="hidden lg:inline">Tạo mới</span>
                     </button>
                     
                     <button 
                        onClick={() => setShowHistory(true)}
                        className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                     >
                        <History size={18} strokeWidth={1.5} /> <span className="hidden lg:inline">Lịch sử</span>
                     </button>

                     <button 
                        onClick={handleSave}
                        className="bg-white border border-slate-200 text-slate-600 px-3 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 hover:text-indigo-600 shadow-sm transition-all"
                     >
                        <Save size={18} strokeWidth={1.5} /> <span className="hidden lg:inline">Lưu</span>
                     </button>

                     <div className="w-px h-8 bg-slate-300 mx-1 hidden md:block"></div>

                     <select 
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-100 shadow-sm"
                        value={selectedStyle}
                        onChange={(e) => setSelectedStyle(e.target.value)}
                     >
                         {STYLES.map(s => <option key={s} value={s}>{s} Style</option>)}
                     </select>
                     
                     <button 
                        onClick={generateAll}
                        disabled={isGlobalGenerating}
                        className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5"
                     >
                        {isGlobalGenerating ? <RefreshCw className="animate-spin" size={20}/> : <Play size={20} fill="currentColor"/>}
                        Generate All
                     </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {frames.map((frame, index) => (
                    <div key={frame.id} className="group bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden flex flex-col hover:shadow-xl transition-all duration-300">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                            <span className="font-bold text-slate-500 uppercase text-xs tracking-wider">Frame {index + 1}</span>
                            <button 
                                onClick={() => removeFrame(frame.id)}
                                className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                            >
                                <Trash2 size={16} strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* Image Area */}
                        <div className="aspect-video bg-slate-100 relative group/img">
                            {frame.isLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
                                    <div className="flex flex-col items-center gap-2 text-indigo-500">
                                        <RefreshCw className="animate-spin" size={32} />
                                        <span className="text-xs font-bold uppercase tracking-wide">Creating Visual...</span>
                                    </div>
                                </div>
                            ) : frame.imageUrl ? (
                                <>
                                    <img 
                                        src={frame.imageUrl} 
                                        alt={`Frame ${index + 1}`} 
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover/img:opacity-100 gap-2">
                                         <button 
                                            onClick={() => setLightboxUrl(frame.imageUrl!)}
                                            className="bg-white text-slate-800 p-2 rounded-xl hover:scale-110 transition-transform shadow-lg"
                                            title="Xem lớn"
                                         >
                                            <Maximize2 size={20} strokeWidth={1.5} />
                                         </button>
                                         <a 
                                            href={frame.imageUrl}
                                            download={`storyboard-frame-${index+1}.png`}
                                            className="bg-indigo-600 text-white p-2 rounded-xl hover:scale-110 transition-transform shadow-lg"
                                            title="Tải xuống"
                                         >
                                            <Download size={20} strokeWidth={1.5} />
                                         </a>
                                         <button 
                                            onClick={() => generateSingleFrame(frame)}
                                            className="bg-white text-indigo-600 p-2 rounded-xl hover:scale-110 transition-transform shadow-lg"
                                            title="Tạo lại"
                                         >
                                            <RefreshCw size={20} strokeWidth={1.5} />
                                         </button>
                                    </div>
                                </>
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                                    <Film size={48} strokeWidth={1} />
                                    <p className="text-sm font-medium mt-2">Chưa có hình ảnh</p>
                                    {frame.error && <p className="text-xs text-red-400 mt-1">{frame.error}</p>}
                                </div>
                            )}
                        </div>

                        {/* Script Input */}
                        <div className="p-4 flex-1 flex flex-col">
                            <textarea 
                                className="w-full flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none min-h-[100px]"
                                placeholder="Mô tả chi tiết cảnh phim, hành động, góc máy..."
                                value={frame.script}
                                onChange={(e) => updateScript(frame.id, e.target.value)}
                            />
                            <div className="mt-3 flex justify-end">
                                {!frame.isLoading && (
                                    <button 
                                        onClick={() => generateSingleFrame(frame)}
                                        disabled={!frame.script.trim()}
                                        className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
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
                    onClick={addFrame}
                    className="aspect-video rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group"
                >
                    <div className="bg-slate-100 group-hover:bg-white p-4 rounded-full mb-3 transition-colors shadow-sm">
                        <Plus size={32} strokeWidth={1.5} />
                    </div>
                    <span className="font-bold text-lg">Thêm Frame Mới</span>
                </button>
            </div>

            {/* Lightbox */}
            {lightboxUrl && (
                <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <button 
                        onClick={() => setLightboxUrl(null)}
                        className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <X size={32} strokeWidth={1.5} />
                    </button>
                    <img 
                        src={lightboxUrl} 
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" 
                        alt="Full View" 
                    />
                </div>
            )}

            {/* History Modal */}
            {showHistory && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in border border-slate-100">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800">Lịch sử Storyboard</h3>
                            <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={24} strokeWidth={1.5} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                            {savedProjects.length === 0 ? (
                                <div className="col-span-2 text-center py-10 text-slate-400">
                                    Chưa có dự án nào được lưu.
                                </div>
                            ) : (
                                savedProjects.map(project => (
                                    <div 
                                        key={project.id}
                                        onClick={() => handleLoadProject(project)}
                                        className="group p-4 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-indigo-300 hover:shadow-md transition-all flex gap-4"
                                    >
                                        <div className="w-32 aspect-video bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                                            {project.frames.find(f => f.imageUrl) ? (
                                                <img 
                                                    src={project.frames.find(f => f.imageUrl)?.imageUrl} 
                                                    className="w-full h-full object-cover" 
                                                    alt="Thumb"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                                    <Film size={20} />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-slate-800 truncate">{project.name}</h4>
                                                <button 
                                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                                    className="text-slate-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock size={12} /> {new Date(project.updatedAt).toLocaleDateString('vi-VN')}
                                            </div>
                                            <div className="mt-3 flex gap-2">
                                                <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md border border-indigo-100">
                                                    {project.style}
                                                </span>
                                                <span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md border border-slate-200">
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