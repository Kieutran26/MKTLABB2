import React, { useState, useEffect } from 'react';
import { Link2, Copy, Trash2, QrCode, Save, RotateCcw, Search, ExternalLink, ArrowRight, Layers, Tag, Globe, Link, Scissors, Settings, X, Check, AlertCircle } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { UtmRecord, UtmPreset } from '../types';
import { Toast, ToastType } from './Toast';
import { shortenUrl } from '../services/shortenerService';

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
        <div className="max-w-7xl mx-auto pt-10 px-6 pb-20">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                        <Link2 className="text-indigo-600" strokeWidth={1.5} size={32} />
                        UTM Builder & Manager
                    </h2>
                    <p className="text-slate-500 mt-2">Tạo, quản lý và theo dõi link chiến dịch Marketing một cách chuyên nghiệp.</p>
                </div>
                <button 
                    onClick={() => setShowSettings(true)}
                    className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 hover:bg-white px-4 py-2 rounded-xl transition-all border border-transparent hover:border-slate-200 shadow-sm"
                >
                    <Settings size={20} strokeWidth={1.5} />
                    <span className="font-medium">Cấu hình Rút gọn</span>
                </button>
            </div>

            {/* BUILDER AREA */}
            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8 mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Inputs Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* URL Input */}
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Website URL (Link gốc)</label>
                            <div className="relative">
                                <Globe className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                <input 
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all font-medium"
                                    placeholder="https://example.com/landing-page"
                                    value={baseUrl}
                                    onChange={(e) => setBaseUrl(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Presets */}
                        <div className="flex items-center gap-4 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                            <Layers className="text-indigo-600" size={20} />
                            <div className="flex-1">
                                <label className="block text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1">Dùng mẫu có sẵn (Presets)</label>
                                <select 
                                    className="w-full bg-white border border-indigo-200 text-indigo-700 text-sm rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-200 cursor-pointer"
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
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Campaign Source <span className="text-red-500">*</span></label>
                                <input 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    placeholder="google, facebook, newsletter"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Campaign Medium <span className="text-red-500">*</span></label>
                                <input 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    placeholder="cpc, banner, email"
                                    value={medium}
                                    onChange={(e) => setMedium(e.target.value)}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Campaign Name <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <Tag className="absolute left-3 top-3 text-slate-300" size={16} />
                                    <input 
                                        className="w-full pl-10 pr-3 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-medium"
                                        placeholder="spring_sale_2025, product_launch"
                                        value={campaign}
                                        onChange={(e) => setCampaign(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Campaign Term (Optional)</label>
                                <input 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    placeholder="running_shoes, seo_keyword"
                                    value={term}
                                    onChange={(e) => setTerm(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Campaign Content (Optional)</label>
                                <input 
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                    placeholder="logolink, textlink, banner_top"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview & Actions Column */}
                    <div className="lg:col-span-1 flex flex-col gap-4">
                        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 h-full flex flex-col">
                            <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <ExternalLink size={16} /> URL Preview
                            </label>
                            
                            <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm text-slate-600 break-all font-mono leading-relaxed flex-1 overflow-y-auto max-h-[200px] mb-4 shadow-inner">
                                {finalUrl || <span className="text-slate-300 italic">Link kết quả sẽ hiện ở đây...</span>}
                            </div>

                            <div className="space-y-3 mt-auto">
                                <button 
                                    onClick={() => handleCopy(finalUrl)}
                                    disabled={!finalUrl}
                                    className="w-full py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Copy size={18} /> Sao chép Link Gốc
                                </button>
                                
                                <button 
                                    onClick={handleShorten}
                                    disabled={!finalUrl || isShortening}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 disabled:opacity-70"
                                >
                                    {isShortening ? <RotateCcw className="animate-spin" size={18} /> : <Scissors size={18} />}
                                    {shortUrl ? 'Rút gọn lại' : 'Rút gọn Link (Hybrid)'}
                                </button>

                                {shortUrl && (
                                    <div className="animate-in fade-in slide-in-from-top-2">
                                        <div className="bg-green-50 border border-green-200 p-3 rounded-xl flex items-center justify-between mb-3">
                                            <span className="text-green-800 font-bold text-sm truncate mr-2">{shortUrl}</span>
                                            <button onClick={() => handleCopy(shortUrl)} className="p-1.5 bg-white text-green-600 rounded-lg shadow-sm hover:scale-105 transition-transform"><Copy size={14}/></button>
                                        </div>
                                        <button 
                                            onClick={() => setShowQr(!showQr)}
                                            className="w-full py-2 bg-slate-800 text-white rounded-xl font-medium text-sm hover:bg-slate-900 transition-all flex items-center justify-center gap-2"
                                        >
                                            <QrCode size={16} /> {showQr ? 'Ẩn mã QR' : 'Tạo mã QR'}
                                        </button>
                                    </div>
                                )}

                                {showQr && shortUrl && (
                                    <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-in zoom-in">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shortUrl)}`} alt="QR Code" className="w-32 h-32" />
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <button 
                            onClick={() => saveToHistory()}
                            disabled={!finalUrl}
                            className="w-full py-3 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} /> Lưu vào lịch sử (Không rút gọn)
                        </button>
                    </div>
                </div>
            </div>

            {/* HISTORY AREA */}
            <div>
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Save className="text-slate-400" size={24} /> Lịch sử & Quản lý
                    </h3>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                            placeholder="Tìm kiếm campaign, url..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider w-1/3">Link & Campaign</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Params</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Short Link</th>
                                    <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredHistory.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-10 text-center text-slate-400">
                                            Chưa có lịch sử tạo link nào.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredHistory.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-4 align-top">
                                                <div className="font-bold text-indigo-900 mb-1 truncate max-w-xs" title={item.campaign}>{item.campaign}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-xs mb-1" title={item.baseUrl}>{item.baseUrl}</div>
                                                <div className="text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString('vi-VN')}</div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex flex-wrap gap-1">
                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">src: {item.source}</span>
                                                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-[10px] font-bold border border-purple-100">med: {item.medium}</span>
                                                    {item.term && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] border border-slate-200">t: {item.term}</span>}
                                                    {item.content && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] border border-slate-200">c: {item.content}</span>}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                {item.shortUrl ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-green-700 font-bold text-xs bg-green-50 px-2 py-1 rounded border border-green-100">{item.shortUrl}</span>
                                                        <button onClick={() => handleCopy(item.shortUrl!)} className="text-slate-400 hover:text-indigo-600"><Copy size={14}/></button>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-300 text-xs">---</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-top text-right">
                                                <div className="flex justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleCopy(item.finalUrl)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-indigo-600 hover:border-indigo-300 shadow-sm" title="Copy Full Link"><Copy size={16} /></button>
                                                    <button onClick={() => handleEdit(item)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-orange-600 hover:border-orange-300 shadow-sm" title="Edit / Reuse"><RotateCcw size={16} /></button>
                                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-400 hover:text-red-600 hover:border-red-300 shadow-sm" title="Delete"><Trash2 size={16} /></button>
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
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <Settings size={20} className="text-indigo-600"/> Cấu hình Rút gọn Link
                            </h3>
                            <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={24} strokeWidth={1.5} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3">
                                <AlertCircle className="text-indigo-600 shrink-0 mt-0.5" size={20} />
                                <div className="text-sm text-indigo-900 leading-relaxed">
                                    <p className="font-bold mb-1">Cơ chế Hybrid:</p>
                                    Hệ thống sẽ ưu tiên dùng <strong>Bit.ly</strong> nếu bạn cung cấp Token. Nếu không, hoặc nếu lỗi, sẽ tự động chuyển sang <strong>TinyURL</strong> (miễn phí).
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Bitly Access Token</label>
                                <input 
                                    type="password"
                                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                                    placeholder="Nhập Access Token của bạn..."
                                    value={bitlyToken}
                                    onChange={(e) => setBitlyToken(e.target.value)}
                                />
                                <p className="text-xs text-slate-400 mt-2">
                                    Để trống nếu bạn chỉ muốn dùng TinyURL. Token được lưu trên trình duyệt của bạn.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex gap-3 bg-slate-50 rounded-b-3xl">
                            <button 
                                onClick={() => setShowSettings(false)}
                                className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Đóng
                            </button>
                            <button 
                                onClick={handleSaveSettings}
                                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-soft flex justify-center gap-2"
                            >
                                <Check size={18} /> Lưu Cấu Hình
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};

export default UtmBuilder;