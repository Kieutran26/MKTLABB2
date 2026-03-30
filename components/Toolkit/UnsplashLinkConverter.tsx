import React, { useState, useEffect } from 'react';
import { Link, Copy, Check, Trash2, Image, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface HistoryItem {
    id: string;
    original_link: string;
    cleaned_link: string;
    created_at: string;
}

const UnsplashLinkConverter: React.FC = () => {
    const [inputLink, setInputLink] = useState('');
    const [cleanedLink, setCleanedLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Load history from Supabase
    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('unsplash_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            if (data) setHistory(data);
        } catch (e) {
            console.error('Failed to load history:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    // Save to Supabase
    const saveToHistory = async (original: string, cleaned: string) => {
        try {
            const { data, error } = await supabase
                .from('unsplash_history')
                .insert({ original_link: original, cleaned_link: cleaned })
                .select()
                .single();

            if (error) throw error;
            if (data) {
                setHistory(prev => [data, ...prev].slice(0, 20));
            }
        } catch (e) {
            console.error('Failed to save history:', e);
        }
    };

    // Clean the Unsplash link
    const cleanLink = (url: string): string => {
        if (!url.trim()) return '';

        try {
            const baseUrl = url.split('?')[0];
            return `${baseUrl}?auto=format&fit=crop&w=1170&q=80`;
        } catch (e) {
            return url;
        }
    };

    // Handle input change - auto clean when paste
    const handleInputChange = (value: string) => {
        setInputLink(value);
        setCopied(false);

        if (value.trim() && (value.includes('unsplash.com') || value.includes('images.unsplash.com'))) {
            const cleaned = cleanLink(value);
            setCleanedLink(cleaned);

            // Add to history if it's a new unique link
            if (cleaned && !history.some(h => h.original_link === value)) {
                saveToHistory(value, cleaned);
            }
        } else {
            setCleanedLink('');
        }
    };

    // Copy to clipboard
    const handleCopy = async () => {
        if (!cleanedLink) return;
        try {
            await navigator.clipboard.writeText(cleanedLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error('Failed to copy:', e);
        }
    };

    // Clear all history
    const clearHistory = async () => {
        try {
            const { error } = await supabase
                .from('unsplash_history')
                .delete()
                .neq('id', '00000000-0000-0000-0000-000000000000');

            if (error) throw error;
            setHistory([]);
        } catch (e) {
            console.error('Failed to clear history:', e);
        }
    };

    // Delete single history item
    const deleteHistoryItem = async (id: string) => {
        try {
            const { error } = await supabase
                .from('unsplash_history')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setHistory(prev => prev.filter(h => h.id !== id));
        } catch (e) {
            console.error('Failed to delete item:', e);
        }
    };

    // Load from history
    const loadFromHistory = (item: HistoryItem) => {
        setInputLink(item.original_link);
        setCleanedLink(item.cleaned_link);
        setCopied(false);
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl mb-4">
                        <Link size={28} className="text-purple-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Chuyển Đổi Link Unsplash</h1>
                    <p className="text-gray-500">Tự động làm sạch và tối ưu link ảnh Unsplash</p>
                </div>

                {/* Top Row - Input & Output */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Left - Input */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Dán link Unsplash vào đây
                        </label>
                        <textarea
                            value={inputLink}
                            onChange={(e) => handleInputChange(e.target.value)}
                            placeholder="https://unsplash.com/photos/xxx hoặc https://images.unsplash.com/photo-xxx?..."
                            className="w-full h-32 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-300 resize-none text-sm"
                        />
                    </div>

                    {/* Right - Output & Preview */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        {cleanedLink ? (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Link đã làm sạch
                                        </label>
                                        <button
                                            onClick={handleCopy}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${copied
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                                                }`}
                                        >
                                            {copied ? <Check size={14} /> : <Copy size={14} />}
                                            {copied ? 'Đã copy!' : 'Copy'}
                                        </button>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-700 break-all font-mono">
                                        {cleanedLink}
                                    </div>
                                </div>

                                {/* Image Preview */}
                                <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
                                    <img
                                        src={cleanedLink}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400">
                                <div className="text-center py-8">
                                    <Image size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Dán link để xem kết quả</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom - History */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-gray-500" />
                            <span className="font-medium text-gray-900">Lịch sử chuyển đổi</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full text-gray-500">
                                {history.length}
                            </span>
                        </div>
                        {history.length > 0 && (
                            <button
                                onClick={clearHistory}
                                className="text-xs text-red-500 hover:text-red-600 transition-colors"
                            >
                                Xóa tất cả
                            </button>
                        )}
                    </div>

                    {history.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <Clock size={32} className="mx-auto mb-2 opacity-50" />
                            <p className="text-sm">Chưa có lịch sử</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                            {history.map((item) => (
                                <div
                                    key={item.id}
                                    className="group relative bg-gray-50 hover:bg-gray-100 rounded-xl overflow-hidden transition-colors cursor-pointer"
                                    onClick={() => loadFromHistory(item)}
                                >
                                    {/* Thumbnail */}
                                    <div className="aspect-video bg-gray-200">
                                        <img
                                            src={item.cleaned_link.replace('w=1170', 'w=200')}
                                            alt=""
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                    <div className="p-2">
                                        <p className="text-[10px] text-gray-400 truncate">
                                            {new Date(item.created_at).toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                    {/* Delete button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteHistoryItem(item.id);
                                        }}
                                        className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded opacity-0 group-hover:opacity-100 transition-all"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-purple-50 rounded-xl border border-purple-100">
                    <p className="text-sm text-purple-700">
                        <strong>Cách hoạt động:</strong> Công cụ sẽ tự động thay thế tất cả tham số sau dấu <code className="px-1.5 py-0.5 bg-purple-100 rounded">?</code> bằng <code className="px-1.5 py-0.5 bg-purple-100 rounded">auto=format&fit=crop&w=1170&q=80</code> để tối ưu kích thước và chất lượng ảnh.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UnsplashLinkConverter;
