import React, { useState, useMemo, useEffect } from 'react';
import { GitCompare, Merge, Trash2, Copy, Check, X } from 'lucide-react';

type CompareMode = 'char' | 'word' | 'line';

interface DiffSegment {
    text: string;
    type: 'added' | 'removed' | 'unchanged';
}

const TextCompare: React.FC = () => {
    const [oldText, setOldText] = useState('');
    const [newText, setNewText] = useState('');
    const [compareMode, setCompareMode] = useState<CompareMode>('line');
    const [showDiff, setShowDiff] = useState(false);
    const [mergedText, setMergedText] = useState('');
    const [showMergeSuccess, setShowMergeSuccess] = useState(false);

    // Simple diff algorithm
    const computeDiff = (oldStr: string, newStr: string, mode: CompareMode): DiffSegment[] => {
        let oldParts: string[];
        let newParts: string[];
        let separator = '';

        switch (mode) {
            case 'char':
                oldParts = oldStr.split('');
                newParts = newStr.split('');
                separator = '';
                break;
            case 'word':
                oldParts = oldStr.split(/(\s+)/);
                newParts = newStr.split(/(\s+)/);
                separator = '';
                break;
            case 'line':
            default:
                oldParts = oldStr.split('\n');
                newParts = newStr.split('\n');
                separator = '\n';
                break;
        }

        // LCS-based diff (simplified)
        const result: DiffSegment[] = [];
        let i = 0, j = 0;

        while (i < oldParts.length || j < newParts.length) {
            if (i >= oldParts.length) {
                // Rest of new is added
                result.push({ text: newParts[j], type: 'added' });
                j++;
            } else if (j >= newParts.length) {
                // Rest of old is removed
                result.push({ text: oldParts[i], type: 'removed' });
                i++;
            } else if (oldParts[i] === newParts[j]) {
                // Same
                result.push({ text: oldParts[i], type: 'unchanged' });
                i++;
                j++;
            } else {
                // Check if oldParts[i] exists later in newParts
                const oldInNew = newParts.indexOf(oldParts[i], j);
                const newInOld = oldParts.indexOf(newParts[j], i);

                if (oldInNew === -1 && newInOld === -1) {
                    // Both are different - show as removed then added
                    result.push({ text: oldParts[i], type: 'removed' });
                    result.push({ text: newParts[j], type: 'added' });
                    i++;
                    j++;
                } else if (oldInNew !== -1 && (newInOld === -1 || oldInNew - j <= newInOld - i)) {
                    // New text has additions before matching old
                    result.push({ text: newParts[j], type: 'added' });
                    j++;
                } else {
                    // Old text has removals before matching new
                    result.push({ text: oldParts[i], type: 'removed' });
                    i++;
                }
            }
        }

        return result;
    };

    const diffResult = useMemo(() => {
        if (!showDiff || (!oldText && !newText)) return [];
        return computeDiff(oldText, newText, compareMode);
    }, [oldText, newText, compareMode, showDiff]);

    const handleCompare = () => {
        setShowDiff(true);
    };

    const handleMerge = () => {
        // Merge keeps all content (both old and new)
        const merged = diffResult
            .filter(seg => seg.type !== 'removed')
            .map(seg => seg.text)
            .join(compareMode === 'line' ? '\n' : '');
        setMergedText(merged);
        setShowMergeSuccess(true);
        setTimeout(() => setShowMergeSuccess(false), 3000);
    };

    const handleClear = () => {
        setOldText('');
        setNewText('');
        setShowDiff(false);
        setMergedText('');
    };

    const copyDiff = () => {
        const text = diffResult.map(seg => seg.text).join(compareMode === 'line' ? '\n' : '');
        navigator.clipboard.writeText(text);
        alert('Đã sao chép!');
    };

    const getSeparator = () => {
        return compareMode === 'line' ? '\n' : '';
    };

    return (
        <div className="min-h-full bg-[#F9FAFB] p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">So Sánh & Merge Văn Bản</h1>
                    <p className="text-gray-500">
                        So sánh hai khối văn bản để xác định sự khác biệt. Highlighting trực quan cho phần thêm, xóa và sửa đổi.
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="text-blue-700 text-sm">
                        💡 Tất cả xử lý văn bản được thực hiện hoàn toàn trong trình duyệt. Dữ liệu của bạn không bao giờ được gửi lên máy chủ.
                    </p>
                </div>

                {/* Compare Mode */}
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm text-gray-600 font-medium">Chế độ so sánh:</span>
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button
                            onClick={() => { setCompareMode('char'); setShowDiff(false); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${compareMode === 'char' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Theo ký tự
                        </button>
                        <button
                            onClick={() => { setCompareMode('word'); setShowDiff(false); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${compareMode === 'word' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Theo từ
                        </button>
                        <button
                            onClick={() => { setCompareMode('line'); setShowDiff(false); }}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${compareMode === 'line' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Theo dòng
                        </button>
                    </div>
                </div>

                {/* Text Inputs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {/* Old Text */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                            <span className="text-red-500">📄</span>
                            <span className="font-medium text-gray-900">Văn bản cũ</span>
                        </div>
                        <textarea
                            value={oldText}
                            onChange={(e) => { setOldText(e.target.value); setShowDiff(false); }}
                            placeholder="Nhập hoặc dán văn bản gốc vào đây..."
                            className="w-full h-48 p-5 resize-none focus:outline-none text-gray-800 placeholder-gray-400"
                        />
                    </div>

                    {/* New Text */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                            <span className="text-green-500">📄</span>
                            <span className="font-medium text-gray-900">Văn bản mới</span>
                        </div>
                        <textarea
                            value={newText}
                            onChange={(e) => { setNewText(e.target.value); setShowDiff(false); }}
                            placeholder="Nhập hoặc dán văn bản mới vào đây..."
                            className="w-full h-48 p-5 resize-none focus:outline-none text-gray-800 placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={handleCompare}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
                    >
                        <GitCompare size={16} /> So sánh
                    </button>
                    <button
                        onClick={handleMerge}
                        disabled={!showDiff}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Merge size={16} /> Merge
                    </button>
                    <button
                        onClick={handleClear}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                        <Trash2 size={16} /> Xóa
                    </button>
                </div>

                {/* Diff Result */}
                {showDiff && (
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <span className="font-medium text-gray-900">Kết quả so sánh</span>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
                                        Thêm mới
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span>
                                        Đã xóa
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <span className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></span>
                                        Không đổi
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={copyDiff}
                                className="flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 transition-colors"
                            >
                                <Copy size={14} /> Có khác biệt
                            </button>
                        </div>
                        <div className="p-5 max-h-96 overflow-auto">
                            <div className={`font-mono text-sm leading-relaxed ${compareMode === 'line' ? 'whitespace-pre-wrap' : ''}`}>
                                {diffResult.map((segment, idx) => (
                                    <span
                                        key={idx}
                                        className={`${segment.type === 'added'
                                            ? 'bg-green-100 text-green-800'
                                            : segment.type === 'removed'
                                                ? 'bg-red-100 text-red-800 line-through'
                                                : 'text-gray-700'
                                            }`}
                                    >
                                        {segment.text}
                                        {compareMode === 'line' && idx < diffResult.length - 1 ? '\n' : ''}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Merged Result */}
                {mergedText && (
                    <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">📄</span>
                                <span className="font-medium text-gray-900">Văn bản đã merge</span>
                            </div>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(mergedText);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-sm text-emerald-700 transition-colors"
                            >
                                <Copy size={14} /> Sao chép kết quả merge
                            </button>
                        </div>
                        <div className="p-5 max-h-64 overflow-auto bg-gray-50">
                            <pre className="font-mono text-sm text-gray-800 whitespace-pre-wrap">{mergedText}</pre>
                        </div>
                    </div>
                )}

                {/* Success Toast */}
                {showMergeSuccess && (
                    <div className="fixed bottom-6 right-6 bg-white border border-gray-200 rounded-xl shadow-lg px-5 py-4 flex items-center gap-3 animate-fade-in z-50">
                        <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Check size={14} className="text-emerald-600" />
                        </div>
                        <span className="font-medium text-gray-900">Merge thành công</span>
                        <div className="h-1 w-24 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 animate-shrink" />
                        </div>
                        <button onClick={() => setShowMergeSuccess(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TextCompare;
