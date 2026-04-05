import React, { useState, useMemo } from 'react';
import { Type, Copy, Trash2, AlignLeft, Search } from 'lucide-react';

const WordCounter: React.FC = () => {
    const [text, setText] = useState('');
    const [keywordTab, setKeywordTab] = useState<1 | 2 | 3>(1);

    // Calculate statistics
    const stats = useMemo(() => {
        const trimmedText = text.trim();

        // Words
        const words = trimmedText ? trimmedText.split(/\s+/).filter(w => w.length > 0).length : 0;

        // Characters
        const characters = text.length;
        const charactersNoSpaces = text.replace(/\s/g, '').length;

        // Sentences (split by . ! ?)
        const sentences = trimmedText ? trimmedText.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;

        // Paragraphs (split by double newlines or single newlines)
        const paragraphs = trimmedText ? trimmedText.split(/\n\s*\n|\n/).filter(p => p.trim().length > 0).length : 0;

        // Reading time (average 200 words per minute)
        const readingTimeSeconds = Math.ceil((words / 200) * 60);

        // Speaking time (average 150 words per minute)
        const speakingTimeSeconds = Math.ceil((words / 150) * 60);

        return {
            words,
            characters,
            charactersNoSpaces,
            sentences,
            paragraphs,
            readingTimeSeconds,
            speakingTimeSeconds
        };
    }, [text]);

    // Calculate keyword density
    const keywords = useMemo(() => {
        if (!text.trim()) return [];

        const words = text.toLowerCase().match(/[\p{L}]+/gu) || [];
        if (words.length === 0) return [];

        const ngramCounts: Record<string, number> = {};

        for (let i = 0; i <= words.length - keywordTab; i++) {
            const ngram = words.slice(i, i + keywordTab).join(' ');
            ngramCounts[ngram] = (ngramCounts[ngram] || 0) + 1;
        }

        return Object.entries(ngramCounts)
            .filter(([_, count]) => count > 1)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([word, count]) => ({
                word,
                count,
                density: ((count / words.length) * 100).toFixed(1)
            }));
    }, [text, keywordTab]);

    // Text transformations
    const transformText = (type: 'upper' | 'lower' | 'title' | 'sentence') => {
        switch (type) {
            case 'upper':
                setText(text.toUpperCase());
                break;
            case 'lower':
                setText(text.toLowerCase());
                break;
            case 'title':
                setText(text.replace(/\b\w/g, c => c.toUpperCase()));
                break;
            case 'sentence':
                setText(text.replace(/(^\s*\w|[.!?]\s*\w)/g, c => c.toUpperCase()));
                break;
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(text);
        alert('Đã sao chép!');
    };

    const removeExtraSpaces = () => {
        setText(text.replace(/\s+/g, ' ').trim());
    };

    const clearText = () => {
        setText('');
    };

    const formatTime = (seconds: number) => {
        if (seconds < 60) return `${seconds} sec`;
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
    };

    return (
        <div className="min-h-full bg-[#F9FAFB] p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Đếm Từ</h1>
                    <p className="text-gray-500">
                        Đếm từ, ký tự, câu và đoạn văn. Phân tích thời gian đọc, thời gian nói, mức độ đọc và mật độ từ khóa.
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="text-blue-700 text-sm">
                        💡 Tất cả phân tích văn bản được thực hiện hoàn toàn trong trình duyệt. Văn bản của bạn không bao giờ được gửi đến máy chủ.
                    </p>
                </div>

                {/* Transformation Buttons */}
                <div className="flex flex-wrap items-center gap-2 mb-6">
                    <span className="text-sm text-gray-500 mr-2">Chữ Hoa/Thường:</span>
                    <button onClick={() => transformText('upper')} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        <Type size={14} className="inline mr-1" /> CHỮ HOA
                    </button>
                    <button onClick={() => transformText('lower')} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        <Type size={14} className="inline mr-1" /> chữ thường
                    </button>
                    <button onClick={() => transformText('title')} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        <Type size={14} className="inline mr-1" /> Chữ Hoa Đầu Từ
                    </button>
                    <button onClick={() => transformText('sentence')} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                        <Type size={14} className="inline mr-1" /> Chữ hoa đầu câu
                    </button>

                    <div className="flex-1"></div>

                    <button onClick={copyToClipboard} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
                        <Copy size={14} /> Sao Chép
                    </button>
                    <button onClick={removeExtraSpaces} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center gap-1">
                        <AlignLeft size={14} /> Xóa Khoảng Trắng Thừa
                    </button>
                    <button onClick={clearText} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors flex items-center gap-1">
                        <Trash2 size={14} /> Xóa
                    </button>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Text Input */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <AlignLeft size={18} className="text-gray-400" />
                                    <span className="font-medium text-gray-900">Đếm Từ</span>
                                </div>
                                <div className="text-blue-600 font-bold">
                                    {stats.words} Từ • {stats.characters} Ký Tự
                                </div>
                            </div>
                            <textarea
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                placeholder="Bắt đầu gõ hoặc dán văn bản của bạn vào đây..."
                                className="w-full h-96 p-5 text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Stats Panel */}
                    <div className="space-y-6">
                        {/* Statistics */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="text-lg">📊</span> Thống Kê
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Từ</span>
                                    <span className="font-semibold text-gray-900">{stats.words}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Ký Tự</span>
                                    <span className="font-semibold text-gray-900">{stats.characters}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Ký Tự (không khoảng trắng)</span>
                                    <span className="font-semibold text-gray-900">{stats.charactersNoSpaces}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Câu</span>
                                    <span className="font-semibold text-gray-900">{stats.sentences}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Đoạn Văn</span>
                                    <span className="font-semibold text-gray-900">{stats.paragraphs}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-50">
                                    <span className="text-gray-600">Thời Gian Đọc</span>
                                    <span className="font-semibold text-gray-900">{formatTime(stats.readingTimeSeconds)}</span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-gray-600">Thời Gian Nói</span>
                                    <span className="font-semibold text-gray-900">{formatTime(stats.speakingTimeSeconds)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Keyword Density */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <span className="text-lg">📈</span> Mật Độ Từ Khóa
                            </h3>

                            {/* Tabs */}
                            <div className="flex gap-2 mb-4">
                                {[1, 2, 3].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => setKeywordTab(n as 1 | 2 | 3)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                                            ${keywordTab === n
                                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-transparent'
                                            }`}
                                    >
                                        x{n} ({n === 1 ? 'Từ Đơn' : n === 2 ? 'Hai Từ' : 'Ba Từ'})
                                    </button>
                                ))}
                            </div>

                            {/* Keywords List */}
                            {keywords.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <Search size={32} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Không tìm thấy từ khóa</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {keywords.map((kw, i) => (
                                        <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                            <span className="text-gray-800 font-medium">{kw.word}</span>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-500">{kw.count}x</span>
                                                <span className="text-xs font-semibold text-blue-600">{kw.density}%</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WordCounter;
