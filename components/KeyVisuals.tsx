
import React, { useState, useEffect } from 'react';
import { Plus, Image as ImageIcon, LayoutTemplate, Type, Settings2, Download, RefreshCw, ChevronLeft, ChevronRight, X, Maximize2, Sparkles, FolderPlus, Trash2, Palette, Lightbulb, BoxSelect, Upload, Wand2, Layers } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { KeyVisualProject, KeyVisualImage } from '../types';
import { generateKeyVisual } from '../services/geminiService';

interface KeyVisualsProps {
  initialView: 'list' | 'create';
}

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
      if(confirm("Xóa dự án này?")) {
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
              style: currentProject.mood || 'Professional', // Use mood as style if available
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

  // --- RENDERERS ---

  if (viewMode === 'list') {
      return (
          <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
              <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <ImageIcon className="text-slate-700" strokeWidth={1.5}/> 
                        Dự án Key Visual
                    </h2>
                    <p className="text-slate-500 mt-1">Quản lý và thiết kế hình ảnh quảng cáo chuyên nghiệp</p>
                </div>
                <button 
                    onClick={startNewProject}
                    className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)]"
                >
                    <FolderPlus size={20} strokeWidth={1.5} /> Tạo dự án mới
                </button>
              </div>

              {projects.length === 0 ? (
                  <div className="p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-400">
                          <ImageIcon size={40} strokeWidth={1.5} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-700 mb-2">Chưa có dự án nào</h3>
                      <p className="text-slate-500 mb-6">Bắt đầu thiết kế Key Visual đầu tiên của bạn ngay hôm nay.</p>
                      <button onClick={startNewProject} className="text-indigo-600 font-bold hover:underline">Tạo ngay &rarr;</button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projects.map(project => (
                          <div 
                            key={project.id} 
                            onClick={() => openProject(project)}
                            className="group bg-white rounded-3xl border border-slate-200 shadow-soft hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col"
                          >
                              <div className="aspect-video bg-slate-100 relative overflow-hidden">
                                  {project.images.length > 0 ? (
                                      <img src={project.images[0].url} alt={project.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                  ) : (
                                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                                          <ImageIcon size={48} strokeWidth={1} />
                                      </div>
                                  )}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                              </div>
                              <div className="p-5">
                                  <div className="flex justify-between items-start mb-2">
                                      <h3 className="font-bold text-lg text-slate-800 line-clamp-1">{project.name}</h3>
                                      <button 
                                        onClick={(e) => handleDeleteProject(e, project.id)}
                                        className="text-slate-300 hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors"
                                      >
                                          <Trash2 size={18} strokeWidth={1.5} />
                                      </button>
                                  </div>
                                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 h-10">
                                      {project.description || "Chưa có mô tả..."}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-50">
                                      <span>{project.images.length} hình ảnh</span>
                                      <span>{new Date(project.updatedAt).toLocaleDateString('vi-VN')}</span>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      );
  }

  // STUDIO VIEW
  if (!currentProject) return null;

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
        {/* Top Bar */}
        <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
            <div className="flex items-center gap-4">
                <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                    <ChevronLeft size={24} strokeWidth={1.5} />
                </button>
                <input 
                    className="font-bold text-lg text-slate-800 bg-transparent border-none focus:ring-0 placeholder:text-slate-300 w-64"
                    value={currentProject.name}
                    onChange={(e) => setCurrentProject({ ...currentProject, name: e.target.value })}
                    placeholder="Tên dự án..."
                    onBlur={saveCurrentProject}
                />
            </div>
            <div className="flex items-center gap-3">
                 <span className="text-xs text-slate-400 font-medium px-3 py-1 bg-slate-100 rounded-full">
                     {currentProject.images.length} visual generated
                 </span>
                 <button 
                    onClick={saveCurrentProject} 
                    className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
                 >
                     Lưu dự án
                 </button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar: Inputs */}
            <div className="w-[400px] bg-white border-r border-slate-200 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
                {/* Tabs */}
                <div className="flex border-b border-slate-100 p-2 gap-1 bg-slate-50/50">
                    {[
                        { id: 'setup', label: 'Ý tưởng', icon: Lightbulb },
                        { id: 'assets', label: 'Hình ảnh', icon: ImageIcon },
                        { id: 'text', label: 'Nội dung', icon: Type },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all
                                ${activeTab === tab.id 
                                    ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-slate-200' 
                                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
                        >
                            <tab.icon size={16} strokeWidth={1.5} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                    
                    {/* TAB: SETUP */}
                    {activeTab === 'setup' && (
                        <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Số lượng ảnh cần tạo</label>
                                <div className="flex gap-2">
                                    {[1, 2, 3, 4].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setImageCount(num)}
                                            className={`flex-1 py-2.5 rounded-xl border font-bold text-sm transition-all ${
                                                imageCount === num 
                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' 
                                                : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tỉ lệ khung hình</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['1:1', '16:9', '9:16', '4:3', '4:5'].map(ratio => (
                                        <button
                                            key={ratio}
                                            onClick={() => setCurrentProject({...currentProject, aspectRatio: ratio})}
                                            className={`py-2 px-3 rounded-2xl border text-sm font-medium transition-all ${
                                                currentProject.aspectRatio === ratio
                                                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-1 ring-indigo-200'
                                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                            }`}
                                        >
                                            {ratio}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Concept chủ đạo</label>
                                <input 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    placeholder="VD: Mùa hè sôi động, Sang trọng tối giản..."
                                    value={currentProject.concept || ''}
                                    onChange={e => setCurrentProject({...currentProject, concept: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Mood & Tone</label>
                                <input 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    placeholder="VD: Bright, Warm, Professional, Futuristic..."
                                    value={currentProject.mood || ''}
                                    onChange={e => setCurrentProject({...currentProject, mood: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả chi tiết <span className="text-red-500">*</span></label>
                                <textarea 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all min-h-[120px]"
                                    placeholder="Mô tả cảnh quan, ánh sáng, cách bố trí sản phẩm..."
                                    value={currentProject.description}
                                    onChange={e => setCurrentProject({...currentProject, description: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Hướng dẫn bố cục (Placement)</label>
                                <textarea 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    placeholder="VD: Sản phẩm ở chính giữa, text nằm bên trái, background mờ..."
                                    value={currentProject.placementInstructions || ''}
                                    onChange={e => setCurrentProject({...currentProject, placementInstructions: e.target.value})}
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB: ASSETS */}
                    {activeTab === 'assets' && (
                         <div className="space-y-6 animate-fade-in">
                            {/* Main Product */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex justify-between">
                                    Ảnh sản phẩm chính (Hero) <span className="text-red-500">*</span>
                                </label>
                                <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-4 text-center hover:bg-indigo-50 transition-colors relative group">
                                    {currentProject.productImage ? (
                                        <div className="relative aspect-square w-full max-w-[200px] mx-auto rounded-xl overflow-hidden shadow-sm border border-slate-200">
                                            <img src={currentProject.productImage} className="w-full h-full object-contain bg-white" alt="Main Product"/>
                                            <button 
                                                onClick={() => setCurrentProject({...currentProject, productImage: undefined})}
                                                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-slate-500 hover:text-red-500 shadow-sm"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input type="file" className="hidden" id="mainProductUpload" accept="image/*" onChange={(e) => handleFileUpload(e, 'productImage')} />
                                            <label htmlFor="mainProductUpload" className="cursor-pointer flex flex-col items-center py-6">
                                                <div className="bg-white p-3 rounded-full shadow-sm text-indigo-500 mb-2">
                                                    <BoxSelect size={24} strokeWidth={1.5} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-600">Upload sản phẩm chính</span>
                                                <span className="text-xs text-slate-400 mt-1">Nên dùng ảnh tách nền (PNG)</span>
                                            </label>
                                        </>
                                    )}
                                </div>
                                <input 
                                    className="mt-3 w-full p-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 transition-all"
                                    placeholder="Ghi chú về sản phẩm (VD: Giữ nguyên màu đỏ, làm bóng hơn...)"
                                    value={currentProject.productNote || ''}
                                    onChange={e => setCurrentProject({...currentProject, productNote: e.target.value})}
                                />
                            </div>

                            {/* Reference Image */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Ảnh tham khảo phong cách (Style Ref)
                                </label>
                                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors">
                                    {currentProject.referenceImage ? (
                                        <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-sm border border-slate-200">
                                            <img src={currentProject.referenceImage} className="w-full h-full object-cover" alt="Ref"/>
                                            <button 
                                                onClick={() => setCurrentProject({...currentProject, referenceImage: undefined})}
                                                className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-slate-500 hover:text-red-500 shadow-sm"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input type="file" className="hidden" id="refImageUpload" accept="image/*" onChange={(e) => handleFileUpload(e, 'referenceImage')} />
                                            <label htmlFor="refImageUpload" className="cursor-pointer flex flex-col items-center py-4">
                                                <div className="bg-white p-2.5 rounded-full shadow-sm text-slate-400 mb-2">
                                                    <Palette size={20} strokeWidth={1.5} />
                                                </div>
                                                <span className="text-sm font-medium text-slate-600">Upload ảnh style</span>
                                            </label>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Visual Assets */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Tài nguyên bổ sung (Assets)
                                </label>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    {currentProject.productAssets?.map((asset, idx) => (
                                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                                            <img src={asset} className="w-full h-full object-cover" alt={`Asset ${idx}`}/>
                                            <button 
                                                onClick={() => removeAsset(idx)}
                                                className="absolute top-1 right-1 bg-white/90 p-1 rounded-full text-slate-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="aspect-square border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center hover:bg-slate-50 cursor-pointer relative">
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" id="assetUpload" accept="image/*" onChange={(e) => handleFileUpload(e, 'productAssets')} />
                                        <Plus size={20} className="text-slate-400" />
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400">Thêm icon, logo, hoặc vật trang trí.</p>
                            </div>
                         </div>
                    )}

                    {/* TAB: TEXT / OVERLAY */}
                    {activeTab === 'text' && (
                         <div className="space-y-6 animate-fade-in">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề chính (Main Headline)</label>
                                <input 
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm mb-2 focus:outline-none focus:border-indigo-500"
                                    placeholder="Nội dung tiêu đề..."
                                    value={currentProject.mainHeading || ''}
                                    onChange={e => setCurrentProject({...currentProject, mainHeading: e.target.value})}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        className="p-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-500"
                                        placeholder="Font Style (Modern, Serif...)"
                                        value={currentProject.mainHeadingStyle || ''}
                                        onChange={e => setCurrentProject({...currentProject, mainHeadingStyle: e.target.value})}
                                    />
                                    <input 
                                        className="p-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-500"
                                        placeholder="Hiệu ứng (Neon, Gold...)"
                                        value={currentProject.mainHeadingEffect || ''}
                                        onChange={e => setCurrentProject({...currentProject, mainHeadingEffect: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề phụ (Sub Headline)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <input 
                                        className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500"
                                        placeholder="Nội dung phụ..."
                                        value={currentProject.subHeading || ''}
                                        onChange={e => setCurrentProject({...currentProject, subHeading: e.target.value})}
                                    />
                                    <input 
                                        className="col-span-1 p-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-500"
                                        placeholder="Hiệu ứng..."
                                        value={currentProject.subHeadingEffect || ''}
                                        onChange={e => setCurrentProject({...currentProject, subHeadingEffect: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung (Body Text)</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <textarea 
                                        className="col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 resize-none h-20"
                                        placeholder="Nội dung chi tiết..."
                                        value={currentProject.contentText || ''}
                                        onChange={e => setCurrentProject({...currentProject, contentText: e.target.value})}
                                    />
                                    <input 
                                        className="col-span-1 p-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-500 self-start"
                                        placeholder="Style..."
                                        value={currentProject.contentTextEffect || ''}
                                        onChange={e => setCurrentProject({...currentProject, contentTextEffect: e.target.value})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Nút kêu gọi (CTA)</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <input 
                                        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:border-indigo-500"
                                        placeholder="Mua ngay, Tìm hiểu thêm..."
                                        value={currentProject.cta || ''}
                                        onChange={e => setCurrentProject({...currentProject, cta: e.target.value})}
                                    />
                                    <input 
                                        className="p-3 bg-white border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-indigo-500"
                                        placeholder="Kiểu nút (Tròn, Bóng...)"
                                        value={currentProject.ctaEffect || ''}
                                        onChange={e => setCurrentProject({...currentProject, ctaEffect: e.target.value})}
                                    />
                                </div>
                            </div>
                         </div>
                    )}

                </div>

                <div className="p-6 border-t border-slate-200 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-20">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 hover:shadow-xl hover:shadow-indigo-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 disabled:shadow-none"
                    >
                        {isGenerating ? (
                            <>
                                <RefreshCw className="animate-spin" size={24} strokeWidth={1.5} /> Đang tạo {imageCount > 1 ? `${imageCount} ảnh` : ''}...
                            </>
                        ) : (
                            <>
                                <Wand2 size={24} strokeWidth={1.5} /> Generate Visual ({imageCount})
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Right Area: Results */}
            <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
                <div className="max-w-5xl mx-auto">
                    {currentProject.images.length === 0 ? (
                        <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                            <ImageIcon size={64} strokeWidth={0.5} className="mb-4 text-slate-300" />
                            <p className="font-medium text-lg">Chưa có hình ảnh nào được tạo</p>
                            <p className="text-sm mt-2 max-w-md text-center">
                                Điền thông tin bên trái và bấm "Generate Visual" để AI thiết kế cho bạn.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Latest Image (Large) */}
                            <div className="md:col-span-2">
                                <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
                                    <Sparkles className="text-yellow-500" size={18} /> Kết quả mới nhất
                                </h3>
                                <div className="group relative bg-white rounded-3xl shadow-soft p-2 border border-slate-100">
                                    <div className="rounded-2xl overflow-hidden bg-slate-100 aspect-video relative">
                                        <img 
                                            src={currentProject.images[0].url} 
                                            alt="Latest" 
                                            className="w-full h-full object-contain cursor-zoom-in"
                                            onClick={() => setLightboxImage(currentProject.images[0])}
                                        />
                                    </div>
                                    <div className="absolute bottom-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                        <button 
                                            onClick={() => setLightboxImage(currentProject.images[0])}
                                            className="bg-white p-3 rounded-xl shadow-lg hover:text-indigo-600 transition-colors"
                                        >
                                            <Maximize2 size={20} strokeWidth={1.5} />
                                        </button>
                                        <a 
                                            href={currentProject.images[0].url} 
                                            download={`keyvisual-${currentProject.images[0].id}.png`}
                                            className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg hover:bg-indigo-700 transition-colors"
                                        >
                                            <Download size={20} strokeWidth={1.5} />
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* History Grid */}
                            {currentProject.images.slice(1).map(img => (
                                <div key={img.id} className="bg-white p-2 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all group relative">
                                    <div className="aspect-video bg-slate-100 rounded-2xl overflow-hidden cursor-pointer" onClick={() => setLightboxImage(img)}>
                                        <img src={img.url} alt="History" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="bg-white/90 p-2 rounded-lg shadow-sm hover:text-indigo-600" onClick={() => setLightboxImage(img)}>
                                            <Maximize2 size={16} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                    <div className="p-3">
                                        <p className="text-xs text-slate-400 font-medium">
                                            {new Date(img.createdAt).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Lightbox */}
        {lightboxImage && (
            <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <button 
                    onClick={() => setLightboxImage(null)}
                    className="absolute top-6 right-6 text-white/70 hover:text-white bg-white/10 p-2 rounded-full transition-colors"
                >
                    <X size={32} strokeWidth={1.5} />
                </button>
                <img 
                    src={lightboxImage.url} 
                    className="max-w-full max-h-full rounded-lg shadow-2xl" 
                    alt="Full View" 
                />
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                    <a 
                        href={lightboxImage.url} 
                        download={`keyvisual-${lightboxImage.id}.png`}
                        className="bg-white text-slate-900 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-slate-100 transition-colors flex items-center gap-2"
                    >
                        <Download size={20} strokeWidth={1.5} /> Tải xuống
                    </a>
                </div>
            </div>
        )}
    </div>
  );
};

export default KeyVisuals;
