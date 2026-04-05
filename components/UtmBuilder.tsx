import React, { useState, useEffect } from 'react';
import { Link2, Copy, Trash2, QrCode, Save, RotateCcw, Search, ExternalLink, ArrowRight, Layers, Tag, Globe, Link, Scissors, Settings, X, Check, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { UtmRecord, UtmPreset } from '../types';
import { Toast, ToastType } from './Toast';
import { shortenUrl } from '../services/shortenerService';

const cardClass =
    'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';

const inputClass =
    'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const UtmBuilder: React.FC = () => {
    // Input States
    const [baseUrl, setBaseUrl] = useState('');
    const [source, setSource] = useState('');
    const [medium, setMedium] = useState('');
    const [campaign, setCampaign] = useState('');
    const [term, setTerm] = useState('');
    const [content, setContent] = useState('');
    
    // Output States
    const [finalUrl, setFinalUrl] = useState('');
    const [shortUrl, setShortUrl] = useState('');
    const [isShortening, setIsShortening] = useState(false);
    const [showQr, setShowQr] = useState(false);

    // Data States
    const [presets, setPresets] = useState<UtmPreset[]>([]);
    const [history, setHistory] = useState<UtmRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Settings States
    const [showSettings, setShowSettings] = useState(false);
    const [bitlyToken, setBitlyToken] = useState('');

    // Notification
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

    useEffect(() => {
        setPresets(StorageService.getUtmPresets());
        setHistory(StorageService.getUtmHistory());
        
        // Load Bitly Token from LocalStorage
        const savedToken = localStorage.getItem('user_bitly_token');
        if (savedToken) setBitlyToken(savedToken);
    }, []);

    // Live URL Generation
    useEffect(() => {
        if (!baseUrl) {
            setFinalUrl('');
            return;
        }

        let url = baseUrl.trim();
        // Auto add protocol if missing
        if (!url.match(/^https?:\/\//)) {
            url = 'https://' + url;
        }

        const params = new URLSearchParams();
        if (source) params.set('utm_source', formatParam(source));
        if (medium) params.set('utm_medium', formatParam(medium));
        if (campaign) params.set('utm_campaign', formatParam(campaign));
        if (term) params.set('utm_term', formatParam(term));
        if (content) params.set('utm_content', formatParam(content));

        const queryString = params.toString();
        if (queryString) {
            // Check if URL already has query params
            const separator = url.includes('?') ? '&' : '?';
            setFinalUrl(`${url}${separator}${queryString}`);
        } else {
            setFinalUrl(url);
        }
        
        // Reset short URL when inputs change
        setShortUrl(''); 
        setShowQr(false);

    }, [baseUrl, source, medium, campaign, term, content]);

    const formatParam = (text: string) => {
        // Standardize: lowercase, spaces to underscore
        return text.trim().toLowerCase().replace(/\s+/g, '_');
    };

    const handleApplyPreset = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetId = e.target.value;
        if (!presetId) return;
        
        const preset = presets.find(p => p.id === presetId);
        if (preset) {
            setSource(preset.source);
            setMedium(preset.medium);
        }
    };

    const handleSaveSettings = () => {
        localStorage.setItem('user_bitly_token', bitlyToken);
        setShowSettings(false);
        setToast({ message: "Đã lưu cấu hình rút gọn link!", type: "success" });
    };

    const handleShorten = async () => {
        if (!finalUrl) return;
        setIsShortening(true);
        setShortUrl('');

        // Call the Hybrid Service
        const result = await shortenUrl(finalUrl, bitlyToken);

        setIsShortening(false);

        if (result.shortUrl) {
            setShortUrl(result.shortUrl);
            const providerName = result.provider === 'bitly' ? 'Bit.ly' : 'TinyURL';
            setToast({ message: `Đã rút gọn thành công bằng ${providerName}`, type: "success" });
            
            // Auto save to history
            saveToHistory(result.shortUrl);
        } else {
            setToast({ message: "Không thể rút gọn link. Vui lòng kiểm tra lại kết nối.", type: "error" });
        }
    };

    const saveToHistory = (generatedShortUrl?: string) => {
        if (!baseUrl || !source || !medium || !campaign) {
            setToast({ message: "Vui lòng nhập ít nhất URL, Source, Medium và Campaign Name", type: "error" });
            return;
        }

        const newRecord: UtmRecord = {
            id: Date.now().toString(),
            baseUrl, source, medium, campaign, term, content,
            finalUrl,
            shortUrl: generatedShortUrl || shortUrl,
            createdAt: Date.now()
        };

        StorageService.addUtmRecord(newRecord);
        setHistory([newRecord, ...history]);
        
        if (!generatedShortUrl) {
            setToast({ message: "Đã lưu vào lịch sử", type: "success" });
        }
    };

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setToast({ message: "Đã sao chép vào clipboard", type: "success" });
    };

    const handleEdit = (record: UtmRecord) => {
        setBaseUrl(record.baseUrl);
        setSource(record.source);
        setMedium(record.medium);
        setCampaign(record.campaign);
        setTerm(record.term || '');
        setContent(record.content || '');
        setShortUrl(record.shortUrl || '');
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = (id: string) => {
        if (confirm("Bạn có chắc muốn xóa link này khỏi lịch sử?")) {
            StorageService.deleteUtmRecord(id);
            setHistory(prev => prev.filter(h => h.id !== id));
            setToast({ message: "Đã xóa link", type: "success" });
        }
    };

    const filteredHistory = history.filter(h => 
        h.campaign.toLowerCase().includes(searchQuery.toLowerCase()) || 
        h.baseUrl.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#FCFDFC] font-sans">
            {/* ── Standardized Header ────────────────────────────────────────── */}
            <header className="flex shrink-0 flex-col gap-4 border-b border-stone-200/70 bg-[#FCFDFC] px-5 py-5 lg:flex-row lg:items-start lg:justify-between md:px-8">
                <div className="max-w-2xl">
                    <div className="mb-2 flex items-center gap-2 text-stone-400">
                        <Link2 size={20} strokeWidth={1.25} className="shrink-0" aria-hidden />
                        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-stone-400">
                            Công cụ UTM
                        </span>
                    </div>
                    <h1 className="font-sans text-2xl font-normal tracking-tight text-stone-900 md:text-3xl">
                        UTM Builder & Manager
                    </h1>
                    <p className="mt-1 text-sm font-normal leading-relaxed text-stone-500 md:text-[15px]">
                        Tạo, quản lý và theo dõi link chiến dịch Marketing một cách chuyên nghiệp.
                    </p>
                </div>

                <div className="flex shrink-0 items-center justify-end pt-2">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors hover:bg-stone-50 hover:text-stone-900"
                    >
                        <Settings size={18} strokeWidth={1.25} />
                        <span>Cấu hình Rút gọn</span>
                    </button>
                </div>
            </header>

            {/* ── Scrollable Content Area ───────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-5 py-8 md:px-8">
                <div className="mx-auto max-w-7xl">

            {/* BUILDER AREA */}
            <div className={`${cardClass} mx-auto mb-8 max-w-7xl p-8`}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Inputs Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* URL Input */}
                        <div>
                            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Website URL (Link gốc)</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-3.5 text-stone-400" size={18} />
                                <input 
                                    className={`${inputClass} pl-12 pr-4`}
                                    placeholder="https://example.com/landing-page"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
                            <Layers className="text-stone-500" size={18} />
                            <div className="flex-1">
                                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">Dùng mẫu có sẵn (Presets)</label>
                                <select 
                                    className="w-full cursor-pointer rounded-lg border border-stone-200 bg-white p-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-200/80"
                                    onChange={handleApplyPreset}
                                    defaultValue=""
                                >
                                    <option value="" disabled>-- Chọn mẫu Source/Medium --</option>
                                    {presets.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} ({p.source} / {p.medium})</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* UTM Params Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Campaign Source <span className="text-rose-500">*</span></label>
                                <input 
                                    className={inputClass}
                                    placeholder="google, facebook, newsletter"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Campaign Medium <span className="text-rose-500">*</span></label>
                                <input 
                                    className={inputClass}
                                    placeholder="cpc, banner, email"
                                    value={medium}
                                    onChange={(e) => setMedium(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Campaign Name <span className="text-rose-500">*</span></label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-3 text-stone-300" size={16} />
                                    <input 
                                        className={`${inputClass} pl-10 pr-3`}
                                        placeholder="spring_sale_2025, product_launch"
                                        value={campaign}
                                        onChange={(e) => setCampaign(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Campaign Term (Optional)</label>
                                <input 
                                    className={inputClass}
                                    placeholder="running_shoes, seo_keyword"
                                    value={term}
                                    onChange={(e) => setTerm(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500">Campaign Content (Optional)</label>
                                <input 
                                    className={inputClass}
                                    placeholder="logolink, textlink, banner_top"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview & Actions Column */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="flex h-full flex-col rounded-2xl border border-stone-200 bg-stone-50 p-5">
                            <label className="mb-3 flex items-center gap-2 text-sm font-medium text-stone-800">
                                <ExternalLink size={16} /> URL Preview
                            </label>
                            
                            <div className="mb-4 max-h-[200px] flex-1 overflow-y-auto break-all rounded-xl border border-stone-200 bg-white p-4 font-mono text-sm leading-relaxed text-stone-600 shadow-inner">
                                {finalUrl || <span className="italic text-stone-300">Link kết quả sẽ hiện ở đây...</span>}
                            </div>

                            <div className="space-y-3 mt-auto">
                                <button 
                                    onClick={() => handleCopy(finalUrl)}
                                    disabled={!finalUrl}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50 hover:border-stone-300 disabled:opacity-50"
                                >
                                    <Copy size={18} /> Sao chép Link Gốc
                                </button>
                                
                                <button 
                                    onClick={handleShorten}
                                    disabled={!finalUrl || isShortening}
                                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800 disabled:opacity-70"
                                >
                                    {isShortening ? <RotateCcw className="animate-spin" size={18} /> : <Scissors size={18} />}
                                    {shortUrl ? 'Rút gọn lại' : 'Rút gọn Link (Hybrid)'}
                                </button>

                                {shortUrl && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <div className="mb-3 flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3">
                                            <span className="mr-2 truncate text-sm font-medium text-stone-800">{shortUrl}</span>
                                            <button onClick={() => handleCopy(shortUrl)} className="rounded-lg bg-stone-100 p-1.5 text-stone-600 shadow-sm transition-transform hover:scale-105"><Copy size={14}/></button>
                                        </div>
                                        <button 
                                            onClick={() => setShowQr(!showQr)}
                                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-2 text-sm font-medium text-stone-700 transition-all hover:bg-stone-50"
                                        >
                                            <QrCode size={16} /> {showQr ? 'Ẩn mã QR' : 'Tạo mã QR'}
                                        </button>
                                    </div>
                                )}

                                {showQr && shortUrl && (
                                    <div className="animate-in zoom-in flex justify-center rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`} alt="QR Code" className="w-32 h-32" />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => saveToHistory()}
                            disabled={!finalUrl}
                            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 disabled:opacity-50"
                        >
                            <Save size={18} /> Lưu vào lịch sử (Không rút gọn)
                        </button>
                    </div>
                </div>
            </div>

            {/* HISTORY AREA */}
            <div className="mx-auto max-w-7xl">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
                    <h3 className="flex items-center gap-2 text-xl font-medium text-stone-900">
                        <Save className="text-stone-400" size={22} /> Lịch sử & Quản lý
                    </h3>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 text-stone-400" size={18} />
                        <input 
                            className="w-full rounded-xl border border-stone-200 bg-white py-2 pl-10 pr-4 text-sm text-stone-700 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none"
                            placeholder="Tìm kiếm campaign, url..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className={`${cardClass} overflow-hidden`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="border-b border-stone-100 bg-stone-50/70">
                                <tr>
                                    <th className="w-1/3 p-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Link & Campaign</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Params</th>
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wide text-stone-500">Short Link</th>
                                    <th className="p-4 text-right text-xs font-semibold uppercase tracking-wide text-stone-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100/70">
                                {filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-slate-400">
                                            Chưa có lịch sử tạo link nào.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistory.map(item => (
                                        <tr key={item.id} className="group transition-colors hover:bg-stone-50/50">
                                            <td className="p-4 align-top">
                                                <div className="mb-1 max-w-xs truncate text-sm font-semibold text-stone-900" title={item.campaign}>{item.campaign}</div>
                                                <div className="mb-1 max-w-xs truncate text-xs text-stone-500" title={item.baseUrl}>{item.baseUrl}</div>
                                                <div className="text-[10px] text-stone-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-700">src: {item.source}</span>
                                                    <span className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-700">med: {item.medium}</span>
                                                    {item.term && <span className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-600">t: {item.term}</span>}
                                                    {item.content && <span className="rounded border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] text-stone-600">c: {item.content}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                {item.shortUrl ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="rounded border border-stone-200 bg-stone-50 px-2 py-1 text-xs font-medium text-stone-700">{item.shortUrl}</span>
                                                        <button onClick={() => handleCopy(item.shortUrl!)} className="text-stone-400 hover:text-stone-700"><Copy size={14}/></button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-stone-300">---</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleCopy(item.finalUrl)} className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-400 shadow-sm hover:border-stone-300 hover:text-stone-700" title="Copy Full Link"><Copy size={16} /></button>
                                                    <button onClick={() => handleEdit(item)} className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-400 shadow-sm hover:border-stone-300 hover:text-stone-700" title="Edit / Reuse"><RotateCcw size={16} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="rounded-lg border border-stone-200 bg-white p-1.5 text-stone-400 shadow-sm hover:border-red-300 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* SETTINGS MODAL */}
            {showSettings && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4 backdrop-blur-sm">
                    <div className="animate-in fade-in zoom-in w-full max-w-md rounded-2xl border border-stone-200/90 bg-white shadow-2xl">
                        <div className="flex items-center justify-between rounded-t-2xl border-b border-stone-100 bg-stone-50/70 p-6">
                            <h3 className="flex items-center gap-2 text-lg font-medium tracking-tight text-stone-900">
                                <Settings size={19} className="text-stone-400"/> Cấu hình Rút gọn Link
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
                                <X size={22} strokeWidth={1.25} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="flex gap-3 rounded-xl border border-stone-200 bg-stone-50 p-4">
                                <AlertCircle className="mt-0.5 shrink-0 text-stone-500" size={20} />
                                <div className="text-sm text-indigo-900 leading-relaxed">
                                    <p className="mb-1 font-semibold text-stone-800">Cơ chế Hybrid:</p>
                                    Hệ thống sẽ ưu tiên dùng <strong>Bit.ly</strong> nếu bạn cung cấp Token. Nếu không, hoặc nếu lỗi, sẽ tự động chuyển sang <strong>TinyURL</strong> (miễn phí).
                                </div>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-stone-500">Bitly Access Token</label>
                                <input 
                                    type="password"
                                    className={inputClass}
                                    placeholder="Nhập Access Token của bạn..."
                                    value={bitlyToken}
                                    onChange={(e) => setBitlyToken(e.target.value)}
                                />
                                <p className="mt-2 text-xs text-stone-400">
                                    Để trống nếu bạn chỉ muốn dùng TinyURL. Token được lưu trên trình duyệt của bạn.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 rounded-b-2xl border-t border-stone-100 bg-stone-50/70 p-6">
                            <button 
                                onClick={() => setShowSettings(false)}
                                className="flex-1 rounded-xl py-3 text-sm font-medium text-stone-500 hover:bg-stone-200 transition-colors"
                            >
                                Đóng
                            </button>
                            <button 
                                onClick={handleSaveSettings}
                                className="flex flex-1 justify-center gap-2 rounded-xl bg-stone-900 py-3 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                            >
                                <Check size={18} /> Lưu Cấu Hình
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
                </div>
            </div>
        </div>
    );
};

export default UtmBuilder;