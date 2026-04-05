import React, { useState, useEffect } from 'react';
import { Radar, Plus, Trash2, Globe, Image as ImageIcon, X, Save, ExternalLink, ArrowRight, ScanLine, LayoutGrid, FileText, ChevronLeft } from 'lucide-react';
import { Competitor, CompetitorAd } from '../types';
import { StorageService } from '../services/storageService';
import { scanWebsite } from '../services/crawlerService';
import { Toast, ToastType } from './Toast';
import FeatureHeader from './FeatureHeader';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const textareaClass = `${inputClass} resize-none`;

const RivalRadar: React.FC = () => {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
    const [selectedCompetitor, setSelectedCompetitor] = useState<Competitor | null>(null);
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

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

    // ========================
    // LIST VIEW
    // ========================
    if (viewMode === 'list') {
        return (
            <div className="min-h-full bg-[#FCFDFC] font-sans">
                <FeatureHeader
                    icon={Radar}
                    eyebrow="COMPETITIVE INTELLIGENCE & MARKET ANALYSIS"
                    title="Rival Radar"
                    subline="Theo dõi USP, SWOT và chiến dịch quảng cáo của đối thủ."
                >
                    <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-2 rounded-2xl bg-stone-950 px-6 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-95"
                    >
                        <Plus size={18} strokeWidth={2.5} /> Thêm Đối thủ
                    </button>
                </FeatureHeader>

                <div className="mx-auto max-w-7xl px-5 pt-8 md:px-8">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {competitors.length === 0 ? (
                            <div className={`${cardClass} col-span-full flex min-h-[200px] flex-col items-center justify-center p-12 text-center md:p-16`}>
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-stone-100 bg-stone-50/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
                                    <Radar size={28} strokeWidth={1.25} className="text-stone-300" />
                                </div>
                                <p className="text-base font-medium text-stone-700">Chưa có đối thủ nào được theo dõi.</p>
                                <p className="mt-1 max-w-sm text-sm font-normal text-stone-500">
                                    Thêm đối thủ để bắt đầu theo dõi USP, điểm mạnh/yếu và kho quảng cáo.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(true)}
                                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                                >
                                    Thêm đối thủ đầu tiên
                                    <span aria-hidden className="text-stone-400">→</span>
                                </button>
                            </div>
                        ) : (
                            competitors.map(comp => (
                                <div
                                    key={comp.id}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => { setSelectedCompetitor(comp); setViewMode('detail'); setActiveTab('profile'); }}
                                    onKeyDown={(e) => e.key === 'Enter' && (() => { setSelectedCompetitor(comp); setViewMode('detail'); setActiveTab('profile'); })()}
                                    className={`${cardClass} group relative flex cursor-pointer flex-col overflow-hidden p-6 transition-all hover:border-stone-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]`}
                                >
                                    <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                            type="button"
                                            onClick={(e) => handleDelete(e, comp.id)}
                                            className="rounded-lg p-2 text-stone-300 transition-colors hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <Trash2 size={18} strokeWidth={1.25} />
                                        </button>
                                    </div>

                                    <div className="mb-4 flex items-center gap-4">
                                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-stone-100 bg-stone-50/80">
                                            {comp.logoUrl ? (
                                                <img src={comp.logoUrl} alt={comp.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <Globe size={28} className="text-stone-300" strokeWidth={1.25} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="mb-0.5 truncate text-base font-medium tracking-tight text-stone-900">{comp.name}</h3>
                                            <a
                                                href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={e => e.stopPropagation()}
                                                className="flex items-center gap-1 truncate text-xs font-normal text-stone-500 hover:text-stone-800"
                                            >
                                                {(() => {
                                                    try { return new URL(comp.website.startsWith('http') ? comp.website : `https://${comp.website}`).hostname; }
                                                    catch { return comp.website; }
                                                })()}
                                                <ExternalLink size={10} strokeWidth={1.25} />
                                            </a>
                                        </div>
                                    </div>

                                    <div className="mb-4 flex-1 text-sm font-normal text-stone-500 line-clamp-2">
                                        {comp.usp || 'Chưa có mô tả USP.'}
                                    </div>

                                    <div className="mt-auto flex items-center gap-2 border-t border-stone-100 pt-4">
                                        <span className="rounded-md bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-600">
                                            {comp.adArchive.length} Ads
                                        </span>
                                        <div
                                            className="h-5 w-5 rounded-full border border-stone-200"
                                            style={{ backgroundColor: comp.brandColor }}
                                        />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* ADD MODAL */}
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-sm">
                        <div className={`${cardClass} w-full max-w-lg overflow-hidden`}>
                            <div className="border-b border-stone-100 bg-stone-50/60 px-6 py-5">
                                <h3 className="text-lg font-medium tracking-tight text-stone-900">Thêm Đối thủ Mới</h3>
                            </div>
                            <div className="p-6 space-y-6">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-stone-800">Website Đối thủ</label>
                                    <div className="flex gap-2">
                                        <input
                                            className={inputClass}
                                            placeholder="VD: shopee.vn"
                                            value={scanUrl}
                                            onChange={e => setScanUrl(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAutoScan}
                                            disabled={isScanning || !scanUrl}
                                            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {isScanning ? (
                                                <ScanLine size={16} strokeWidth={1.25} className="animate-pulse" />
                                            ) : (
                                                <ScanLine size={16} strokeWidth={1.25} />
                                            )}
                                            {isScanning ? 'Đang quét…' : 'Quét'}
                                        </button>
                                    </div>
                                    <p className="ml-1 mt-1.5 text-xs font-normal text-stone-400">
                                        *Hệ thống sẽ tự động quét Tên, Logo và Mô tả.
                                    </p>
                                </div>

                                <div className="space-y-4 border-t border-stone-100 pt-5">
                                    <div className="flex gap-4">
                                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50/80">
                                            {newCompetitorData.logoUrl ? (
                                                <img src={newCompetitorData.logoUrl} className="h-full w-full object-cover" alt="" />
                                            ) : (
                                                <ImageIcon size={24} className="text-stone-300" strokeWidth={1.25} />
                                            )}
                                        </div>
                                        <div className="flex-1 space-y-3">
                                            <input
                                                className={inputClass}
                                                placeholder="Tên thương hiệu"
                                                value={newCompetitorData.name}
                                                onChange={e => setNewCompetitorData({ ...newCompetitorData, name: e.target.value })}
                                            />
                                            <div className="flex items-center gap-2">
                                                <label className="text-xs font-medium text-stone-600">Màu chủ đạo:</label>
                                                <input
                                                    type="color"
                                                    className="h-8 w-8 cursor-pointer rounded border-none"
                                                    value={newCompetitorData.brandColor}
                                                    onChange={e => setNewCompetitorData({ ...newCompetitorData, brandColor: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-stone-800">Mô tả / USP</label>
                                        <textarea
                                            className={`${textareaClass} h-20`}
                                            placeholder="Điểm bán hàng độc nhất…"
                                            value={newCompetitorData.usp}
                                            onChange={e => setNewCompetitorData({ ...newCompetitorData, usp: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 border-t border-stone-100 bg-stone-50/60 px-6 py-5">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 rounded-full border border-stone-200 bg-white py-2.5 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveNew}
                                    className="flex-1 rounded-full bg-stone-900 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                                >
                                    Lưu Đối thủ
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ========================
    // DETAIL VIEW
    // ========================
    if (!selectedCompetitor) return null;

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            <div className="z-20 flex h-16 shrink-0 items-center justify-between border-b border-stone-200/70 bg-[#FCFDFC] px-4 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100/80 hover:text-stone-800"
                        aria-label="Quay lại"
                    >
                        <ChevronLeft size={22} strokeWidth={1.25} />
                    </button>
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                            {selectedCompetitor.logoUrl ? (
                                <img src={selectedCompetitor.logoUrl} className="h-full w-full object-cover" alt="" />
                            ) : (
                                <Globe size={16} className="text-stone-300" strokeWidth={1.25} />
                            )}
                        </div>
                        <h2 className="min-w-0 truncate text-lg font-medium tracking-tight text-stone-900">{selectedCompetitor.name}</h2>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'profile'
                                ? 'bg-stone-900 text-white shadow-sm'
                                : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
                        }`}
                    >
                        <LayoutGrid size={16} strokeWidth={1.25} /> Hồ sơ
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('ads')}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                            activeTab === 'ads'
                                ? 'bg-stone-900 text-white shadow-sm'
                                : 'border border-stone-200 bg-white text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:border-stone-300 hover:bg-stone-50/80'
                        }`}
                    >
                        <FileText size={16} strokeWidth={1.25} /> Ad Spy
                    </button>
                    <button
                        type="button"
                        onClick={handleSaveDetail}
                        className="inline-flex shrink-0 items-center gap-2 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-stone-800"
                    >
                        <Save size={17} strokeWidth={1.25} />
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
                <div className="mx-auto max-w-5xl">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div className={`${cardClass} flex gap-6 p-6 md:col-span-2 md:p-8`}>
                                <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-stone-100 bg-stone-50/80">
                                    {selectedCompetitor.logoUrl ? (
                                        <img src={selectedCompetitor.logoUrl} className="h-full w-full object-contain" alt="" />
                                    ) : (
                                        <ImageIcon size={32} className="text-stone-300" strokeWidth={1.25} />
                                    )}
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Website</label>
                                        <a
                                            href={selectedCompetitor.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex items-center gap-1 text-sm font-medium text-stone-700 hover:text-stone-900"
                                        >
                                            {selectedCompetitor.website} <ExternalLink size={14} strokeWidth={1.25} />
                                        </a>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-stone-500">Điểm bán hàng độc nhất (USP)</label>
                                        <textarea
                                            className={`${textareaClass} h-24`}
                                            value={selectedCompetitor.usp}
                                            onChange={(e) => setSelectedCompetitor({ ...selectedCompetitor, usp: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Strengths */}
                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-900">
                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-[10px] font-bold text-emerald-700">S</span>
                                    Điểm mạnh
                                </h3>
                                <div className="space-y-2">
                                    {selectedCompetitor.strengths.map((s, idx) => (
                                        <div key={idx} className="group flex gap-2">
                                            <input
                                                className={`${inputClass} bg-stone-50/80`}
                                                value={s}
                                                onChange={e => updateSwotItem('strengths', idx, e.target.value)}
                                                placeholder="Nhập điểm mạnh…"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSwotItem('strengths', idx)}
                                                className="rounded-lg p-2.5 text-stone-300 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                            >
                                                <X size={16} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addSwotItem('strengths')}
                                        className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
                                    >
                                        <Plus size={14} strokeWidth={1.25} /> Thêm
                                    </button>
                                </div>
                            </div>

                            {/* Weaknesses */}
                            <div className={`${cardClass} p-6 md:p-8`}>
                                <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-stone-900">
                                    <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-100 text-[10px] font-bold text-rose-700">W</span>
                                    Điểm yếu
                                </h3>
                                <div className="space-y-2">
                                    {selectedCompetitor.weaknesses.map((s, idx) => (
                                        <div key={idx} className="group flex gap-2">
                                            <input
                                                className={`${inputClass} bg-stone-50/80`}
                                                value={s}
                                                onChange={e => updateSwotItem('weaknesses', idx, e.target.value)}
                                                placeholder="Nhập điểm yếu…"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeSwotItem('weaknesses', idx)}
                                                className="rounded-lg p-2.5 text-stone-300 opacity-0 transition-opacity hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                                            >
                                                <X size={16} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => addSwotItem('weaknesses')}
                                        className="mt-1 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800"
                                    >
                                        <Plus size={14} strokeWidth={1.25} /> Thêm
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* AD SPY TAB */}
                    {activeTab === 'ads' && (
                        <div>
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-lg font-medium tracking-tight text-stone-900">Kho lưu trữ quảng cáo</h3>
                                <div className="relative">
                                    <input
                                        type="file"
                                        id="adUpload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAdUpload}
                                    />
                                    <label
                                        htmlFor="adUpload"
                                        className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:border-stone-300 hover:bg-stone-50/80"
                                    >
                                        <Plus size={16} strokeWidth={1.25} /> Upload Ảnh QC
                                    </label>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {selectedCompetitor.adArchive.map(ad => (
                                    <div key={ad.id} className={`${cardClass} group overflow-hidden`}>
                                        <div className="relative aspect-square bg-stone-100">
                                            <img src={ad.imageUrl} className="h-full w-full object-cover" alt="" />
                                            <button
                                                type="button"
                                                onClick={() => deleteAd(ad.id)}
                                                className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-stone-400 opacity-0 shadow-sm transition-opacity hover:text-rose-600 group-hover:opacity-100"
                                            >
                                                <Trash2 size={16} strokeWidth={1.25} />
                                            </button>
                                        </div>
                                        <div className="p-4">
                                            <div className="mb-2 flex justify-between text-xs font-normal text-stone-500">
                                                <span>{ad.platform}</span>
                                                <span>{new Date(ad.dateSaved).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                            <textarea
                                                className="w-full resize-none border-none bg-transparent p-0 text-sm text-stone-700 focus:outline-none focus:ring-0"
                                                placeholder="Nhập nội dung quảng cáo…"
                                                value={ad.copyText}
                                                onChange={(e) => updateAdText(ad.id, e.target.value)}
                                                rows={3}
                                            />
                                        </div>
                                    </div>
                                ))}
                                {selectedCompetitor.adArchive.length === 0 && (
                                    <div className={`${cardClass} col-span-full flex min-h-[200px] flex-col items-center justify-center p-8 text-center`}>
                                        <p className="text-sm font-normal text-stone-400">Chưa có quảng cáo nào được lưu.</p>
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
