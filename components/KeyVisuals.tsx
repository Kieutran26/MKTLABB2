import React, { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, Type, Download, RefreshCw, ChevronLeft, X, Sparkles, FolderPlus, Trash2, Palette, Lightbulb, BoxSelect, Wand2 } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { KeyVisualProject, KeyVisualImage } from '../types';
import { generateKeyVisual } from '../services/geminiService';

interface KeyVisualsProps {
    initialView: 'list' | 'create';
}

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const KeyVisuals: React.FC<KeyVisualsProps> = ({ initialView }) => {
    const [viewMode, setViewMode] = useState<'list' | 'studio'>('list');
    const [projects, setProjects] = useState<KeyVisualProject[]>([]);
    const [currentProject, setCurrentProject] = useState<KeyVisualProject | null>(null);

    // Studio States
    const [activeTab, setActiveTab] = useState<'setup' | 'assets' | 'text'>('setup');
    const [isGenerating, setIsGenerating] = useState(false);
    const [lightboxImage, setLightboxImage] = useState<KeyVisualImage | null>(null);

    // Generation Settings
    const [imageCount, setImageCount] = useState<number>(1);

    useEffect(() => {
        refreshProjects();
        if (initialView === 'create') {
            startNewProject();
        } else {
            setViewMode('list');
        }
    }, [initialView]);

    const refreshProjects = () => {
        setProjects(StorageService.getKVProjects());
    };

    const startNewProject = () => {
        const newProject: KeyVisualProject = {
            id: Date.now().toString(),
            name: `Project ${new Date().toLocaleDateString('vi-VN')}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            aspectRatio: '1:1',
            description: '',
            images: []
        };
        setCurrentProject(newProject);
        setViewMode('studio');
        setActiveTab('setup');
        setImageCount(1);
    };

    const openProject = (project: KeyVisualProject) => {
        setCurrentProject(project);
        setViewMode('studio');
        setImageCount(1);
    };

    const saveCurrentProject = () => {
        if (currentProject) {
            StorageService.saveKVProject({
                ...currentProject,
                updatedAt: Date.now()
            });
            refreshProjects();
        }
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Xóa dự án này?")) {
            StorageService.deleteKVProject(id);
            refreshProjects();
        }
    };

    const handleFileUpload = (
        e: React.ChangeEvent<HTMLInputElement>,
        field: 'referenceImage' | 'productImage' | 'productAssets'
    ) => {
        const file = e.target.files?.[0];
        if (!file || !currentProject) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (field === 'productAssets') {
                const currentAssets = currentProject.productAssets || [];
                setCurrentProject({
                    ...currentProject,
                    productAssets: [...currentAssets, base64]
                });
            } else {
                setCurrentProject({
                    ...currentProject,
                    [field]: base64
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const removeAsset = (index: number) => {
        if (!currentProject?.productAssets) return;
        const newAssets = [...currentProject.productAssets];
        newAssets.splice(index, 1);
        setCurrentProject({ ...currentProject, productAssets: newAssets });
    };

    const handleGenerate = async () => {
        if (!currentProject) return;
        if (!currentProject.productImage) {
            alert("Vui lòng tải lên ảnh sản phẩm chính (Main Product)!");
            setActiveTab('assets');
            return;
        }
        if (!currentProject.description) {
            alert("Vui lòng nhập mô tả dự án!");
            setActiveTab('setup');
            return;
        }

        setIsGenerating(true);
        try {
            const results = await generateKeyVisual({
                description: currentProject.description,
                style: currentProject.mood || 'Professional',
                aspectRatio: currentProject.aspectRatio,
                numberOfImages: imageCount,
                concept: currentProject.concept,
                mood: currentProject.mood,
                referenceImage: currentProject.referenceImage,
                productAssets: currentProject.productAssets,
                placementInstructions: currentProject.placementInstructions,
                mainHeading: currentProject.mainHeading,
                mainHeadingStyle: currentProject.mainHeadingStyle,
                mainHeadingEffect: currentProject.mainHeadingEffect,
                subHeading: currentProject.subHeading,
                subHeadingEffect: currentProject.subHeadingEffect,
                contentText: currentProject.contentText,
                contentTextEffect: currentProject.contentTextEffect,
                cta: currentProject.cta,
                ctaEffect: currentProject.ctaEffect,
                productImage: currentProject.productImage,
                productNote: currentProject.productNote
            });

            if (results && results.length > 0) {
                const newImages: KeyVisualImage[] = results.map(res => ({
                    id: Date.now().toString() + Math.random().toString().slice(2, 6),
                    url: res.imageUrl,
                    prompt: res.promptUsed,
                    style: currentProject.mood || 'Standard',
                    createdAt: Date.now()
                }));

                const updatedProject = {
                    ...currentProject,
                    images: [...newImages, ...currentProject.images]
                };
                setCurrentProject(updatedProject);
                StorageService.saveKVProject(updatedProject);
            } else {
                alert("Không thể tạo ảnh. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error(error);
            alert("Lỗi kết nối AI.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- LIST VIEW ---
    if (viewMode === 'list') {
        return (
            <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
                <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-6 py-5 md:flex-row md:items-start md:justify-between md:px-8">
                    <div className="max-w-2xl">
                        <div className="mb-2 flex items-center gap-2 text-stone-400">
                            <ImageIcon size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                            <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                                Visual Production
                            </span>
                        </div>
                        <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                            Dự án Key Visual
                        </h1>
                        <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                            Quản lý và thiết kế hình ảnh quảng cáo chuyên nghiệp
                        </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={startNewProject}
                            className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                        >
                            <FolderPlus size={17} strokeWidth={1.25} />
                            Tạo dự án mới
                        </button>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                    {projects.length === 0 ? (
                        <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-white/60 text-center">
                            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-100 text-stone-300">
                                <ImageIcon size={36} strokeWidth={1} />
                            </div>
                            <h3 className="mb-2 text-xl font-medium text-stone-700">Chưa có dự án nào</h3>
                            <p className="mb-6 text-sm text-stone-500">Bắt đầu thiết kế Key Visual đầu tiên của bạn ngay hôm nay.</p>
                            <button
                                type="button"
                                onClick={startNewProject}
                                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                            >
                                Tạo ngay
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => openProject(project)}
                                    onKeyDown={(e) => e.key === 'Enter' && openProject(project)}
                                    className={`${cardClass} group flex cursor-pointer flex-col overflow-hidden transition-all hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]`}
                                >
                                    <div className="relative aspect-video overflow-hidden bg-stone-100">
                                        {project.images.length > 0 ? (
                                            <img
                                                src={project.images[0].url}
                                                alt={project.name}
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-stone-300">
                                                <ImageIcon size={40} strokeWidth={1} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                                    </div>
                                    <div className="p-5">
                                        <div className="mb-2 flex items-start justify-between gap-2">
                                            <h3 className="line-clamp-1 text-lg font-medium text-stone-800">{project.name}</h3>
                                            <button
                                                type="button"
                                                onClick={(e) => handleDeleteProject(e, project.id)}
                                                className="rounded-lg p-1 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                            >
                                                <Trash2 size={16} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                        <p className="mb-4 line-clamp-2 h-10 text-sm text-stone-500">
                                            {project.description || "Chưa có mô tả..."}
                                        </p>
                                        <div className="flex items-center justify-between border-t border-stone-100 pt-3 text-xs text-stone-400">
                                            <span>{project.images.length} hình ảnh</span>
                                            <span>{new Date(project.updatedAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // --- STUDIO VIEW ---
    if (!currentProject) return null;

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            {/* Top Bar */}
            <div className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-stone-200/80 bg-[#FCFDFC] px-6 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
                    >
                        <ChevronLeft size={22} strokeWidth={1.25} />
                    </button>
                    <input
                        className="w-64 border-none bg-transparent text-lg font-medium text-stone-800 outline-none placeholder:text-stone-300 focus:text-stone-900"
                        value={currentProject.name}
                        onChange={(e) => setCurrentProject({ ...currentProject, name: e.target.value })}
                        placeholder="Tên dự án..."
                        onBlur={saveCurrentProject}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-500">
                        {currentProject.images.length} visual generated
                    </span>
                    <button
                        type="button"
                        onClick={saveCurrentProject}
                        className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-stone-50"
                    >
                        Lưu dự án
                    </button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 overflow-hidden">
                {/* Left Sidebar */}
                <div className="z-10 flex w-[400px] flex-col border-r border-stone-200/80 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                    {/* Tabs */}
                    <div className="flex gap-1 border-b border-stone-100 bg-stone-50/40 p-2">
                        {[
                            { id: 'setup' as const, label: 'Ý tưởng', icon: Lightbulb },
                            { id: 'assets' as const, label: 'Hình ảnh', icon: ImageIcon },
                            { id: 'text' as const, label: 'Nội dung', icon: Type },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-white text-stone-900 shadow-[0_1px_2px_rgba(15,23,42,0.06)]'
                                        : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/60'
                                }`}
                            >
                                <tab.icon size={16} strokeWidth={1.25} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 custom-scrollbar">

                        {/* TAB: SETUP */}
                        {activeTab === 'setup' && (
                            <div className="space-y-5 animate-fade-in">
                                {/* Image Count */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Số lượng ảnh cần tạo</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4].map(num => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setImageCount(num)}
                                                className={`flex-1 rounded-xl border py-2.5 text-sm font-medium transition-all ${
                                                    imageCount === num
                                                        ? 'border-stone-900 bg-stone-900 text-white'
                                                        : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Aspect Ratio */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Tỉ lệ khung hình</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['1:1', '16:9', '9:16', '4:3', '4:5'].map(ratio => (
                                            <button
                                                key={ratio}
                                                type="button"
                                                onClick={() => setCurrentProject({ ...currentProject, aspectRatio: ratio })}
                                                className={`rounded-xl border py-2 px-3 text-sm font-medium transition-all ${
                                                    currentProject.aspectRatio === ratio
                                                        ? 'border-stone-900 bg-stone-900 text-white'
                                                        : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                                                }`}
                                            >
                                                {ratio}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Concept */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Concept chủ đạo</label>
                                    <input
                                        className={inputClass}
                                        placeholder="VD: Mùa hè sôi động, Sang trọng tối giản..."
                                        value={currentProject.concept || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, concept: e.target.value })}
                                    />
                                </div>

                                {/* Mood */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Mood & Tone</label>
                                    <input
                                        className={inputClass}
                                        placeholder="VD: Bright, Warm, Professional, Futuristic..."
                                        value={currentProject.mood || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, mood: e.target.value })}
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                                        Mô tả chi tiết <span className="normal-font font-normal text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        className={`${inputClass} min-h-[120px] resize-none`}
                                        placeholder="Mô tả cảnh quan, ánh sáng, cách bố trí sản phẩm..."
                                        value={currentProject.description}
                                        onChange={e => setCurrentProject({ ...currentProject, description: e.target.value })}
                                    />
                                </div>

                                {/* Placement */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Hướng dẫn bố cục (Placement)</label>
                                    <textarea
                                        className={inputClass}
                                        placeholder="VD: Sản phẩm ở chính giữa, text nằm bên trái, background mờ..."
                                        value={currentProject.placementInstructions || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, placementInstructions: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}

                        {/* TAB: ASSETS */}
                        {activeTab === 'assets' && (
                            <div className="space-y-5 animate-fade-in">
                                {/* Main Product */}
                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                                            Ảnh sản phẩm chính (Hero) <span className="normal-font font-normal text-rose-500">*</span>
                                        </label>
                                    </div>
                                    <div className="group relative rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/40 p-4 text-center transition-colors hover:bg-stone-50">
                                        {currentProject.productImage ? (
                                            <div className="mx-auto max-w-[200px] overflow-hidden rounded-xl border border-stone-100 shadow-sm">
                                                <div className="aspect-square w-full bg-white">
                                                    <img src={currentProject.productImage} className="h-full w-full object-contain" alt="Main Product" />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentProject({ ...currentProject, productImage: undefined })}
                                                    className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-stone-500 shadow-sm hover:text-rose-500"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <input type="file" className="hidden" id="mainProductUpload" accept="image/*" onChange={(e) => handleFileUpload(e, 'productImage')} />
                                                <label htmlFor="mainProductUpload" className="flex cursor-pointer flex-col items-center py-6">
                                                    <div className="mb-2 rounded-full bg-white p-3 shadow-sm">
                                                        <BoxSelect size={22} strokeWidth={1.25} className="text-stone-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-stone-600">Upload sản phẩm chính</span>
                                                    <span className="mt-1 text-xs text-stone-400">Nên dùng ảnh tách nền (PNG)</span>
                                                </label>
                                            </>
                                        )}
                                    </div>
                                    <input
                                        className={`${inputClass} mt-3`}
                                        placeholder="Ghi chú về sản phẩm (VD: Giữ nguyên màu đỏ, làm bóng hơn...)"
                                        value={currentProject.productNote || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, productNote: e.target.value })}
                                    />
                                </div>

                                {/* Reference Image */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Ảnh tham khảo phong cách (Style Ref)</label>
                                    <div className="group relative rounded-2xl border-2 border-dashed border-stone-200 bg-stone-50/40 p-4 text-center transition-colors hover:bg-stone-50">
                                        {currentProject.referenceImage ? (
                                            <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-stone-100 shadow-sm">
                                                <img src={currentProject.referenceImage} className="h-full w-full object-cover" alt="Ref" />
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentProject({ ...currentProject, referenceImage: undefined })}
                                                    className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-stone-500 shadow-sm hover:text-rose-500"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <input type="file" className="hidden" id="refImageUpload" accept="image/*" onChange={(e) => handleFileUpload(e, 'referenceImage')} />
                                                <label htmlFor="refImageUpload" className="flex cursor-pointer flex-col items-center py-4">
                                                    <div className="mb-2 rounded-full bg-white p-2.5 shadow-sm">
                                                        <Palette size={18} strokeWidth={1.25} className="text-stone-400" />
                                                    </div>
                                                    <span className="text-sm font-medium text-stone-600">Upload ảnh style</span>
                                                </label>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Visual Assets */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Tài nguyên bổ sung (Assets)</label>
                                    <div className="mb-2 grid grid-cols-3 gap-2">
                                        {currentProject.productAssets?.map((asset, idx) => (
                                            <div key={idx} className="group relative aspect-square overflow-hidden rounded-xl border border-stone-100">
                                                <img src={asset} className="h-full w-full object-cover" alt={`Asset ${idx}`} />
                                                <button
                                                    type="button"
                                                    onClick={() => removeAsset(idx)}
                                                    className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-stone-500 opacity-0 shadow-sm transition-opacity group-hover:opacity-100 hover:text-rose-500"
                                                >
                                                    <X size={11} />
                                                </button>
                                            </div>
                                        ))}
                                        <div className="relative flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-stone-200 hover:bg-stone-50">
                                            <input type="file" className="absolute inset-0 cursor-pointer opacity-0" id="assetUpload" accept="image/*" onChange={(e) => handleFileUpload(e, 'productAssets')} />
                                            <Plus size={18} className="text-stone-400" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-stone-400">Thêm icon, logo, hoặc vật trang trí.</p>
                                </div>
                            </div>
                        )}

                        {/* TAB: TEXT */}
                        {activeTab === 'text' && (
                            <div className="space-y-5 animate-fade-in">
                                {/* Main Headline */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Tiêu đề chính (Main Headline)</label>
                                    <input
                                        className={inputClass}
                                        placeholder="Nội dung tiêu đề..."
                                        value={currentProject.mainHeading || ''}
                                        onChange={e => setCurrentProject({ ...currentProject, mainHeading: e.target.value })}
                                    />
                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                        <input
                                            className={inputClass}
                                            placeholder="Font Style (Modern, Serif...)"
                                            value={currentProject.mainHeadingStyle || ''}
                                            onChange={e => setCurrentProject({ ...currentProject, mainHeadingStyle: e.target.value })}
                                        />
                                        <input
                                            className={inputClass}
                                            placeholder="Hiệu ứng (Neon, Gold...)"
                                            value={currentProject.mainHeadingEffect || ''}
                                            onChange={e => setCurrentProject({ ...currentProject, mainHeadingEffect: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Sub Headline */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Tiêu đề phụ (Sub Headline)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <textarea
                                            className={`${inputClass} resize-none`}
                                            placeholder="Nội dung phụ..."
                                            value={currentProject.subHeading || ''}
                                            onChange={e => setCurrentProject({ ...currentProject, subHeading: e.target.value })}
                                        />
                                        <input
                                            className={inputClass}
                                            placeholder="Hiệu ứng..."
                                            value={currentProject.subHeadingEffect || ''}
                                            onChange={e => setCurrentProject({ ...currentProject, subHeadingEffect: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Body Text */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Nội dung (Body Text)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <textarea
                                            className={`${inputClass} resize-none`}
                                            placeholder="Nội dung chi tiết..."
                                            value={currentProject.contentText || ''}
                                            onChange={e => setCurrentProject({ ...currentProject, contentText: e.target.value })}
                                        />
                                        <input
                                            className={inputClass}
                                            placeholder="Style..."
                                            value={currentProject.contentTextEffect || ''}
                                            onChange={e => setCurrentProject({ ...currentProject, contentTextEffect: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* CTA */}
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Nút kêu gọi (CTA)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            className={inputClass}
                                            placeholder="Mua ngay, Tìm hiểu thêm..."
                                            value={currentProject.cta || ''}
                                            onChange={e => setCurrentProject({ ...currentProject, cta: e.target.value })}
                                        />
                                        <input
                                            className={inputClass}
                                            placeholder="Kiểu nút (Tròn, Bóng...)"
                                            value={currentProject.ctaEffect || ''}
                                            onChange={e => setCurrentProject({ ...currentProject, ctaEffect: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Generate CTA */}
                    <div className="border-t border-stone-200/80 bg-white p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                        <button
                            type="button"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="flex w-full items-center justify-center gap-2 rounded-full bg-stone-900 py-3.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isGenerating ? (
                                <>
                                    <RefreshCw className="h-5 w-5 animate-spin" />
                                    Đang tạo {imageCount > 1 ? `${imageCount} ảnh` : ''}...
                                </>
                            ) : (
                                <>
                                    <Wand2 size={18} strokeWidth={1.25} />
                                    Generate Visual ({imageCount})
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Right Area: Results */}
                <div className="min-h-0 flex-1 overflow-y-auto bg-stone-100/60 p-6 md:p-8 custom-scrollbar">
                    <div className="mx-auto max-w-5xl">
                        {currentProject.images.length === 0 ? (
                            <div className="flex min-h-[500px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-200 bg-white/60 text-center">
                                <div className="mb-4 text-stone-300">
                                    <ImageIcon size={56} strokeWidth={0.5} />
                                </div>
                                <p className="text-lg font-medium text-stone-600">Chưa có hình ảnh nào được tạo</p>
                                <p className="mt-2 max-w-md text-sm text-stone-400">
                                    Điền thông tin bên trái và bấm "Generate Visual" để AI thiết kế cho bạn.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Latest Image (Large) */}
                                <div>
                                    <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
                                        <Sparkles size={16} strokeWidth={1.25} className="text-stone-400" />
                                        Kết quả mới nhất
                                    </h3>
                                    <div className={`${cardClass} group overflow-hidden transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]`}>
                                        <div className="relative overflow-hidden rounded-2xl bg-stone-100" style={{ aspectRatio: currentProject.aspectRatio.replace(':', '/') }}>
                                            <img
                                                src={currentProject.images[0].url}
                                                alt="Latest"
                                                className="h-full w-full cursor-zoom-in object-contain"
                                                onClick={() => setLightboxImage(currentProject.images[0])}
                                            />
                                        </div>
                                        <div className="absolute bottom-6 right-6 flex translate-y-2 gap-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                                            <button
                                                type="button"
                                                onClick={() => setLightboxImage(currentProject.images[0])}
                                                className="rounded-xl bg-white p-3 shadow-lg transition-colors hover:bg-stone-50"
                                            >
                                                <Maximize2 size={18} strokeWidth={1.25} />
                                            </button>
                                            <a
                                                href={currentProject.images[0].url}
                                                download={`keyvisual-${currentProject.images[0].id}.png`}
                                                className="rounded-xl bg-stone-900 p-3 text-white shadow-lg transition-colors hover:bg-stone-800"
                                            >
                                                <Download size={18} strokeWidth={1.25} />
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                {/* History Grid */}
                                {currentProject.images.slice(1).length > 0 && (
                                    <div>
                                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-stone-400">Lịch sử</h3>
                                        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                                            {currentProject.images.slice(1).map(img => (
                                                <div key={img.id} className={`${cardClass} group overflow-hidden transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]`}>
                                                    <div
                                                        className="relative aspect-video cursor-pointer overflow-hidden rounded-2xl bg-stone-100"
                                                        onClick={() => setLightboxImage(img)}
                                                    >
                                                        <img src={img.url} alt="History" className="h-full w-full object-cover" />
                                                        <div className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100">
                                                            <button
                                                                type="button"
                                                                className="rounded-lg bg-white/90 p-2 shadow-sm"
                                                                onClick={() => setLightboxImage(img)}
                                                            >
                                                                <Maximize2 size={14} strokeWidth={1.25} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="p-3">
                                                        <p className="text-[11px] font-medium text-stone-400">
                                                            {new Date(img.createdAt).toLocaleString('vi-VN')}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightboxImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxImage(null)}
                        className="absolute top-6 right-6 rounded-full bg-white/10 p-2 text-white/70 transition-colors hover:bg-white/20 hover:text-white"
                    >
                        <X size={28} strokeWidth={1.25} />
                    </button>
                    <img
                        src={lightboxImage.url}
                        className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
                        alt="Full View"
                    />
                    <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-4">
                        <a
                            href={lightboxImage.url}
                            download={`keyvisual-${lightboxImage.id}.png`}
                            className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-stone-800 shadow-lg transition-colors hover:bg-stone-100"
                        >
                            <Download size={18} strokeWidth={1.25} />
                            Tải xuống
                        </a>
                    </div>
                </div>
            )}
        </div>
    );
};

export default KeyVisuals;
