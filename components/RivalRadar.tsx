import React, { useState, useEffect } from 'react';
import { Radar, Plus, Search, Trash2, Globe, Image as ImageIcon, X, Save, ExternalLink, Clock, Target, ArrowRight, ScanLine, LayoutGrid, FileText, Zap } from 'lucide-react';
import { Competitor, CompetitorAd } from '../types';
import { StorageService } from '../services/storageService';
import { scanWebsite } from '../services/crawlerService';
import { Toast, ToastType } from './Toast';

const RivalRadar: React.FC = () => {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    // Add Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [scanUrl, setScanUrl] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [newCompetitorData, setNewCompetitorData] = useState<Partial<Competitor>>({
        name: '',
        website: '',
        logoUrl: '',
        usp: '',
        brandColor: '#000000'
    });

    // Detail Tab State
    const [activeTab, setActiveTab] = useState<'profile' | 'ads'>('profile');

    useEffect(() => {
        refreshCompetitors();
    }, []);

    const refreshCompetitors = () => {
        setCompetitors(StorageService.getCompetitors());
    };

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    // --- SCANNING LOGIC ---
    const handleAutoScan = async () => {
        if (!scanUrl) return;
        setIsScanning(true);
        
        const result = await scanWebsite(scanUrl);
        
        setNewCompetitorData({
            ...newCompetitorData,
            name: result.name,
            website: scanUrl,
            usp: result.description,
            logoUrl: result.logoUrl,
            brandColor: result.brandColor
        });
        
        setIsScanning(false);
        showToast("Đã quét xong! Vui lòng kiểm tra lại thông tin.", "success");
    };

    const handleSaveNew = () => {
        if (!newCompetitorData.name) {
            showToast("Vui lòng nhập tên đối thủ", "error");
            return;
        }

        const competitor: Competitor = {
            id: Date.now().toString(),
            name: newCompetitorData.name!,
            website: newCompetitorData.website || scanUrl,
            logoUrl: newCompetitorData.logoUrl || '',
            usp: newCompetitorData.usp || '',
            brandColor: newCompetitorData.brandColor || '#000000',
            strengths: [],
            weaknesses: [],
            adArchive: [],
            createdAt: Date.now()
        };

        StorageService.saveCompetitor(competitor);
        refreshCompetitors();
        setShowAddModal(false);
        setScanUrl('');
        setNewCompetitorData({ name: '', website: '', logoUrl: '', usp: '', brandColor: '#000000' });
        showToast("Đã thêm đối thủ mới", "success");
    };

    const handleSaveDetail = () => {
        if (selectedCompetitor) {
            StorageService.saveCompetitor(selectedCompetitor);
            refreshCompetitors();
            showToast("Đã lưu thay đổi", "success");
        }
    };

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm("Xóa đối thủ này?")) {
            StorageService.deleteCompetitor(id);
            refreshCompetitors();
            if (selectedCompetitor?.id === id) {
                setViewMode('list');
                setSelectedCompetitor(null);
            }
        }
    };

    // --- SWOT LOGIC ---
    const addSwotItem = (type: 'strengths' | 'weaknesses') => {
        if (!selectedCompetitor) return;
        setSelectedCompetitor({
            ...selectedCompetitor,
            [type]: [...selectedCompetitor[type], '']
        });
    };

    const updateSwotItem = (type: 'strengths' | 'weaknesses', index: number, value: string) => {
        if (!selectedCompetitor) return;
        const newList = [...selectedCompetitor[type]];
        newList[index] = value;
        setSelectedCompetitor({
            ...selectedCompetitor,
            [type]: newList
        });
    };

    const removeSwotItem = (type: 'strengths' | 'weaknesses', index: number) => {
        if (!selectedCompetitor) return;
        const newList = [...selectedCompetitor[type]];
        newList.splice(index, 1);
        setSelectedCompetitor({
            ...selectedCompetitor,
            [type]: newList
        });
    };

    // --- AD ARCHIVE LOGIC ---
    const handleAdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedCompetitor) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const newAd: CompetitorAd = {
                id: Date.now().toString(),
                imageUrl: base64,
                copyText: '',
                platform: 'Facebook',
                dateSaved: Date.now()
            };
            setSelectedCompetitor({
                ...selectedCompetitor,
                adArchive: [newAd, ...selectedCompetitor.adArchive]
            });
        };
        reader.readAsDataURL(file);
    };

    const updateAdText = (adId: string, text: string) => {
        if (!selectedCompetitor) return;
        const newAds = selectedCompetitor.adArchive.map(ad => 
            ad.id === adId ? { ...ad, copyText: text } : ad
        );
        setSelectedCompetitor({ ...selectedCompetitor, adArchive: newAds });
    };

    const deleteAd = (adId: string) => {
        if (!selectedCompetitor) return;
        if (confirm("Xóa quảng cáo này?")) {
            const newAds = selectedCompetitor.adArchive.filter(ad => ad.id !== adId);
            setSelectedCompetitor({ ...selectedCompetitor, adArchive: newAds });
        }
    };

    // --- RENDERERS ---

    if (viewMode === 'list') {
        return (
            <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                            <Radar className="text-red-600" strokeWidth={1.5} />
                            Rival Radar
                        </h2>
                        <p className="text-slate-500 mt-1">Theo dõi và phân tích đối thủ cạnh tranh.</p>
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="bg-red-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                    >
                        <Plus size={20} strokeWidth={1.5} /> Thêm Đối thủ
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {competitors.map(comp => (
                        <div 
                            key={comp.id} 
                            onClick={() => { setSelectedCompetitor(comp); setViewMode('detail'); setActiveTab('profile'); }}
                            className="group bg-white rounded-3xl border border-slate-200 shadow-soft hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col p-6 relative"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => handleDelete(e, comp.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden flex items-center justify-center">
                                    {comp.logoUrl ? (
                                        <img src={comp.logoUrl} alt={comp.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Globe size={32} className="text-slate-300" />
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800">{comp.name}</h3>
                                    <a href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                        {new URL(comp.website.startsWith('http') ? comp.website : `https://${comp.website}`).hostname} <ExternalLink size={10}/>
                                    </a>
                                </div>
                            </div>
                            
                            <div className="text-sm text-slate-500 line-clamp-2 mb-4 flex-1">
                                {comp.usp || 'Chưa có mô tả USP.'}
                            </div>

                            <div className="flex gap-2 mt-auto border-t border-slate-50 pt-4">
                                <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">
                                    {comp.adArchive.length} Ads
                                </span>
                                <div className="w-4 h-4 rounded-full border border-slate-200" style={{backgroundColor: comp.brandColor}}></div>
                            </div>
                        </div>
                    ))}

                    {competitors.length === 0 && (
                         <div className="col-span-full p-16 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
                            <Radar size={48} className="mx-auto text-slate-300 mb-4" strokeWidth={1}/>
                            <p className="text-slate-500">Chưa có đối thủ nào được theo dõi.</p>
                         </div>
                    )}
                </div>

                {/* ADD MODAL */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in fade-in zoom-in border border-slate-100 overflow-hidden">
                            <div className="p-6 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-xl font-bold text-slate-800">Thêm Đối thủ Mới</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                {/* SCAN INPUT */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">Website Đối thủ</label>
                                    <div className="flex gap-2">
                                        <input 
                                            className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-red-500 transition-all"
                                            placeholder="VD: shopee.vn"
                                            value={scanUrl}
                                            onChange={e => setScanUrl(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleAutoScan}
                                            disabled={isScanning || !scanUrl}
                                            className="bg-red-600 text-white px-4 rounded-xl font-bold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 transition-all"
                                        >
                                            {isScanning ? <Zap className="animate-pulse" size={18}/> : <ScanLine size={18}/>}
                                            {isScanning ? 'Scanning...' : 'Scan'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 ml-1">*Hệ thống sẽ tự động quét Tên, Logo và Mô tả.</p>
                                </div>

                                {/* FORM FIELDS */}
                                <div className="space-y-4 pt-4 border-t border-slate-100">
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 rounded-xl bg-slate-50 border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center relative">
                                            {newCompetitorData.logoUrl ? (
                                                <img src={newCompetitorData.logoUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon className="text-slate-300" />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <input 
                                                className="w-full p-2.5 border border-slate-200 rounded-xl text-sm font-bold"
                                                placeholder="Tên thương hiệu"
                                                value={newCompetitorData.name}
                                                onChange={e => setNewCompetitorData({...newCompetitorData, name: e.target.value})}
                                            />
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-bold text-slate-500">Màu chủ đạo:</label>
                                                <input 
                                                    type="color" 
                                                    className="w-8 h-8 rounded cursor-pointer border-none"
                                                    value={newCompetitorData.brandColor}
                                                    onChange={e => setNewCompetitorData({...newCompetitorData, brandColor: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả / USP</label>
                                        <textarea 
                                            className="w-full p-3 border border-slate-200 rounded-xl text-sm h-20 resize-none focus:outline-none focus:border-red-500"
                                            placeholder="Điểm bán hàng độc nhất..."
                                            value={newCompetitorData.usp}
                                            onChange={e => setNewCompetitorData({...newCompetitorData, usp: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Hủy</button>
                                <button onClick={handleSaveNew} className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200">Lưu Đối thủ</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // DETAIL VIEW
    if (!selectedCompetitor) return null;

    return (
        <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
            {/* Header */}
            <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                        <ArrowRight size={24} strokeWidth={1.5} className="rotate-180" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                            {selectedCompetitor.logoUrl ? <img src={selectedCompetitor.logoUrl} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100"></div>}
                        </div>
                        <h2 className="text-lg font-bold text-slate-800">{selectedCompetitor.name}</h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setActiveTab('profile')} 
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'profile' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <LayoutGrid size={16} className="inline mr-2 mb-0.5"/> Hồ sơ
                    </button>
                    <button 
                        onClick={() => setActiveTab('ads')} 
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === 'ads' ? 'bg-red-50 text-red-600' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <FileText size={16} className="inline mr-2 mb-0.5"/> Ad Spy
                    </button>
                    <button onClick={handleSaveDetail} className="ml-4 bg-red-600 text-white px-4 py-2 rounded-xl font-bold shadow-sm hover:bg-red-700 transition-colors">
                        <Save size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-5xl mx-auto">
                    
                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
                            {/* General Info */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 md:col-span-2 flex gap-6">
                                <div className="w-32 h-32 rounded-2xl bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center">
                                     {selectedCompetitor.logoUrl ? <img src={selectedCompetitor.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="text-slate-300"/>}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Website</label>
                                        <a href={selectedCompetitor.website} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-medium flex items-center gap-1">
                                            {selectedCompetitor.website} <ExternalLink size={14}/>
                                        </a>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Điểm bán hàng độc nhất (USP)</label>
                                        <textarea 
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 resize-none h-24"
                                            value={selectedCompetitor.usp}
                                            onChange={(e) => setSelectedCompetitor({...selectedCompetitor, usp: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Strengths */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2"><Target className="text-green-500"/> Điểm mạnh</h3>
                                <div className="space-y-2">
                                    {selectedCompetitor.strengths.map((s, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input 
                                                className="flex-1 p-2 bg-green-50/50 border border-green-100 rounded-lg text-sm focus:outline-none focus:border-green-400"
                                                value={s}
                                                onChange={e => updateSwotItem('strengths', idx, e.target.value)}
                                                placeholder="Nhập điểm mạnh..."
                                            />
                                            <button onClick={() => removeSwotItem('strengths', idx)} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
                                        </div>
                                    ))}
                                    <button onClick={() => addSwotItem('strengths')} className="text-xs font-bold text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                        <Plus size={14}/> Thêm
                                    </button>
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                                <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2"><Target className="text-red-500"/> Điểm yếu</h3>
                                <div className="space-y-2">
                                    {selectedCompetitor.weaknesses.map((s, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input 
                                                className="flex-1 p-2 bg-red-50/50 border border-red-100 rounded-lg text-sm focus:outline-none focus:border-red-400"
                                                value={s}
                                                onChange={e => updateSwotItem('weaknesses', idx, e.target.value)}
                                                placeholder="Nhập điểm yếu..."
                                            />
                                            <button onClick={() => removeSwotItem('weaknesses', idx)} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
                                        </div>
                                    ))}
                                    <button onClick={() => addSwotItem('weaknesses')} className="text-xs font-bold text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                        <Plus size={14}/> Thêm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AD SPY TAB */}
                    {activeTab === 'ads' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                             <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Kho lưu trữ quảng cáo</h3>
                                <div className="relative">
                                    <input type="file" id="adUpload" className="hidden" accept="image/*" onChange={handleAdUpload} />
                                    <label htmlFor="adUpload" className="bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-sm cursor-pointer hover:bg-slate-900 transition-colors flex items-center gap-2 shadow-lg">
                                        <Plus size={16} /> Upload Ảnh QC
                                    </label>
                                </div>
                             </div>

                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                 {selectedCompetitor.adArchive.map(ad => (
                                     <div key={ad.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden group">
                                         <div className="relative aspect-square bg-slate-100">
                                             <img src={ad.imageUrl} className="w-full h-full object-cover" />
                                             <button 
                                                onClick={() => deleteAd(ad.id)}
                                                className="absolute top-2 right-2 bg-white p-1.5 rounded-full text-slate-400 hover:text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                             >
                                                 <Trash2 size={16} />
                                             </button>
                                         </div>
                                         <div className="p-4">
                                             <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                                                 <span>{ad.platform}</span>
                                                 <span>{new Date(ad.dateSaved).toLocaleDateString('vi-VN')}</span>
                                             </div>
                                             <textarea 
                                                className="w-full text-sm text-slate-700 border-none resize-none focus:ring-0 bg-transparent p-0"
                                                placeholder="Nhập nội dung quảng cáo..."
                                                value={ad.copyText}
                                                onChange={(e) => updateAdText(ad.id, e.target.value)}
                                                rows={3}
                                             />
                                         </div>
                                     </div>
                                 ))}
                                 {selectedCompetitor.adArchive.length === 0 && (
                                     <div className="col-span-full py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
                                         Chưa có quảng cáo nào được lưu.
                                     </div>
                                 )}
                             </div>
                        </div>
                    )}

                </div>
            </div>

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default RivalRadar;