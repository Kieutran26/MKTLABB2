import React, { useState, useMemo, useEffect } from 'react';
import { Ratio, Trash2, Monitor, Smartphone, Lock } from 'lucide-react';

// Greatest Common Divisor for simplifying ratios
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

interface AspectRatioPreset {
    ratio: string;
    label: string;
    width: number;
    height: number;
}

const PRESET_RATIOS: AspectRatioPreset[] = [
    { ratio: '16:9', label: 'HD/Full HD', width: 16, height: 9 },
    { ratio: '9:16', label: 'Vertical/Portrait', width: 9, height: 16 },
    { ratio: '4:3', label: '', width: 4, height: 3 },
    { ratio: '3:4', label: 'Vertical', width: 3, height: 4 },
    { ratio: '1:1', label: 'Square', width: 1, height: 1 },
    { ratio: '21:9', label: 'Ultrawide', width: 21, height: 9 },
    { ratio: '5:4', label: '', width: 5, height: 4 },
    { ratio: '4:5', label: 'Instagram portrait', width: 4, height: 5 },
    { ratio: '16:10', label: '', width: 16, height: 10 },
    { ratio: '15:9', label: '', width: 15, height: 9 },
    { ratio: '1.91:1', label: 'Facebook/LinkedIn', width: 1.91, height: 1 },
    { ratio: '5:3', label: '', width: 5, height: 3 },
    { ratio: '3:2', label: '', width: 3, height: 2 },
    { ratio: '2:3', label: 'Vertical', width: 2, height: 3 },
    { ratio: '1:2', label: 'Vertical', width: 1, height: 2 },
];

const AspectRatioCalculator: React.FC = () => {
    const [mode, setMode] = useState<'fromSize' | 'fromRatio'>('fromSize');

    // FromSize mode state
    const [width, setWidth] = useState<string>('');
    const [height, setHeight] = useState<string>('');

    // FromRatio mode state
    const [ratioInput, setRatioInput] = useState<string>('16:9');
    const [lockDimension, setLockDimension] = useState<'width' | 'height'>('width');
    const [lockedValue, setLockedValue] = useState<string>('');
    const [calculatedWidth, setCalculatedWidth] = useState<number | null>(null);
    const [calculatedHeight, setCalculatedHeight] = useState<number | null>(null);

    // Parse ratio string to width/height numbers
    const parseRatio = (ratioStr: string): { w: number; h: number } | null => {
        // Handle "16:9" format
        if (ratioStr.includes(':')) {
            const parts = ratioStr.split(':');
            const w = parseFloat(parts[0]);
            const h = parseFloat(parts[1]);
            if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                return { w, h };
            }
        }
        // Handle "1.78" decimal format (interpret as w:1)
        const decimal = parseFloat(ratioStr);
        if (!isNaN(decimal) && decimal > 0) {
            return { w: decimal, h: 1 };
        }
        return null;
    };

    // Calculate dimension from ratio
    useEffect(() => {
        if (mode !== 'fromRatio') return;

        const ratio = parseRatio(ratioInput);
        const value = parseFloat(lockedValue);

        if (!ratio || isNaN(value) || value <= 0) {
            setCalculatedWidth(null);
            setCalculatedHeight(null);
            return;
        }

        if (lockDimension === 'width') {
            // Width is locked, calculate height
            const newHeight = value * (ratio.h / ratio.w);
            setCalculatedWidth(value);
            setCalculatedHeight(Math.round(newHeight));
        } else {
            // Height is locked, calculate width
            const newWidth = value * (ratio.w / ratio.h);
            setCalculatedWidth(Math.round(newWidth));
            setCalculatedHeight(value);
        }
    }, [mode, ratioInput, lockDimension, lockedValue]);

    // Calculate results for fromSize mode
    const fromSizeResult = useMemo(() => {
        const w = parseFloat(width) || 0;
        const h = parseFloat(height) || 0;

        if (w <= 0 || h <= 0) return null;

        const divisor = gcd(Math.round(w), Math.round(h));
        const ratioW = Math.round(w) / divisor;
        const ratioH = Math.round(h) / divisor;

        let displayRatio = `${ratioW}:${ratioH}`;
        if (ratioW > 100 || ratioH > 100) {
            const decimal = (w / h).toFixed(2);
            displayRatio = `${decimal}:1`;
        }

        const orientation = w > h ? 'Ngang (Landscape)' : w < h ? 'Dọc (Portrait)' : 'Vuông (Square)';

        return {
            aspectRatio: displayRatio,
            fraction: `${ratioW}/${ratioH}`,
            size: `${Math.round(w)} × ${Math.round(h)} px`,
            orientation
        };
    }, [width, height]);

    const clearAll = () => {
        setWidth('');
        setHeight('');
        setRatioInput('16:9');
        setLockedValue('');
        setCalculatedWidth(null);
        setCalculatedHeight(null);
    };

    const handlePresetClick = (preset: AspectRatioPreset) => {
        if (mode === 'fromSize') {
            setWidth(String(preset.width * 100));
            setHeight(String(preset.height * 100));
        } else {
            setRatioInput(preset.ratio);
        }
    };

    return (
        <div className="min-h-screen bg-[#F9FAFB] p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Máy Tính Tỷ Lệ Khung Hình</h1>
                    <p className="text-gray-500">
                        Tính toán tỷ lệ khung hình phù hợp với bất kỳ kết hợp chiều rộng và chiều cao tùy chỉnh nào.
                    </p>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
                    <p className="text-blue-700 text-sm">
                        💡 Tất cả các phép tính được thực hiện hoàn toàn trong trình duyệt. Dữ liệu của bạn không bao giờ được gửi đến máy chủ.
                    </p>
                </div>

                {/* Mode Toggle */}
                <div className="flex items-center gap-4 mb-6">
                    <span className="text-sm text-gray-600 font-medium">Chế độ:</span>
                    <div className="flex bg-white rounded-lg border border-gray-200 p-1">
                        <button
                            onClick={() => setMode('fromSize')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'fromSize'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Tính Tỷ Lệ Từ Kích Thước
                        </button>
                        <button
                            onClick={() => setMode('fromRatio')}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'fromRatio'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            Tính Kích Thước Từ Tỷ Lệ
                        </button>
                    </div>
                </div>

                {/* MODE: From Size */}
                {mode === 'fromSize' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Input Section */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <Ratio size={18} className="text-blue-500" />
                                    <span className="font-medium text-gray-900">Máy Tính Tỷ Lệ Kích Thước Tùy Chỉnh</span>
                                </div>
                                <button onClick={clearAll} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500">
                                    <Trash2 size={14} /> Xóa
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chiều Rộng</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={width}
                                            onChange={(e) => setWidth(e.target.value)}
                                            placeholder="Nhập chiều rộng"
                                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-400 text-sm">px</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Chiều Cao</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={height}
                                            onChange={(e) => setHeight(e.target.value)}
                                            placeholder="Nhập chiều cao"
                                            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-400 text-sm">px</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Results Section */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-medium text-gray-900 mb-6 flex items-center gap-2">
                                <span>📊</span> Kết Quả Tỷ Lệ Khung Hình
                            </h3>

                            {fromSizeResult ? (
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Tỷ Lệ Khung Hình</p>
                                        <p className="text-3xl font-bold text-blue-600">{fromSizeResult.aspectRatio}</p>
                                    </div>
                                    <hr className="border-gray-100" />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Phân Số</p>
                                        <p className="text-xl font-semibold text-gray-900">{fromSizeResult.fraction}</p>
                                    </div>
                                    <hr className="border-gray-100" />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Kích thước</p>
                                        <p className="text-xl font-semibold text-gray-900">{fromSizeResult.size}</p>
                                    </div>
                                    <hr className="border-gray-100" />
                                    <div>
                                        <p className="text-sm text-gray-500 mb-1">Hướng</p>
                                        <div className="flex items-center gap-2">
                                            {fromSizeResult.orientation.includes('Ngang') ? (
                                                <Monitor size={20} className="text-blue-500" />
                                            ) : fromSizeResult.orientation.includes('Dọc') ? (
                                                <Smartphone size={20} className="text-purple-500" />
                                            ) : (
                                                <div className="w-5 h-5 border-2 border-emerald-500 rounded" />
                                            )}
                                            <p className="text-lg font-medium text-gray-900">{fromSizeResult.orientation}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <Ratio size={48} className="mx-auto mb-4 text-gray-200" />
                                    <p className="text-gray-500 font-medium">Chưa có dữ liệu</p>
                                    <p className="text-gray-400 text-sm mt-1">Nhập kích thước để tính tỷ lệ</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MODE: From Ratio */}
                {mode === 'fromRatio' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                        {/* Ratio Input */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                                <span>📐</span> Tỷ Lệ Khung Hình
                            </h3>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tỷ Lệ Khung Hình</label>
                                <input
                                    type="text"
                                    value={ratioInput}
                                    onChange={(e) => setRatioInput(e.target.value)}
                                    placeholder="Nhập tỷ lệ (vd: 16:9 hoặc 1.78)"
                                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="lockDimension"
                                        checked={lockDimension === 'width'}
                                        onChange={() => setLockDimension('width')}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Khóa Chiều Rộng</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="lockDimension"
                                        checked={lockDimension === 'height'}
                                        onChange={() => setLockDimension('height')}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <span className="text-sm text-gray-700">Khóa Chiều Cao</span>
                                </label>
                            </div>

                            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition-colors">
                                <Lock size={14} /> Khóa
                            </button>
                        </div>

                        {/* Size Input */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                                    <span>📏</span> Kích Thước
                                </h3>
                                <button onClick={clearAll} className="flex items-center gap-1 text-sm text-gray-400 hover:text-red-500">
                                    <Trash2 size={14} /> Xóa
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {lockDimension === 'width' ? 'Chiều Rộng (khóa)' : 'Chiều Rộng'}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={lockDimension === 'width' ? lockedValue : ''}
                                            onChange={(e) => lockDimension === 'width' && setLockedValue(e.target.value)}
                                            placeholder="Nhập chiều rộng"
                                            disabled={lockDimension !== 'width'}
                                            className={`flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${lockDimension !== 'width' ? 'bg-gray-50 text-gray-400' : ''
                                                }`}
                                        />
                                        <span className="text-gray-400 text-sm">px</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {lockDimension === 'height' ? 'Chiều Cao (khóa)' : 'Chiều Cao'}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            value={lockDimension === 'height' ? lockedValue : ''}
                                            onChange={(e) => lockDimension === 'height' && setLockedValue(e.target.value)}
                                            placeholder="Nhập chiều cao"
                                            disabled={lockDimension !== 'height'}
                                            className={`flex-1 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${lockDimension !== 'height' ? 'bg-gray-50 text-gray-400' : ''
                                                }`}
                                        />
                                        <span className="text-gray-400 text-sm">px</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calculated Result */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h3 className="font-medium text-gray-900 mb-6 flex items-center gap-2">
                                <span>✅</span> Kích Thước Đã Tính
                            </h3>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Chiều Rộng</p>
                                    <p className="text-2xl font-bold text-emerald-500">
                                        {calculatedWidth !== null ? `${calculatedWidth}` : '—'}
                                        <span className="text-lg ml-1">px</span>
                                    </p>
                                </div>

                                <hr className="border-gray-100" />

                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Chiều Cao</p>
                                    <p className="text-2xl font-bold text-emerald-500">
                                        {calculatedHeight !== null ? `${calculatedHeight}` : '—'}
                                        <span className="text-lg ml-1">px</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Preset Ratios - Shared by both modes */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <span>📐</span> Kích thước có sẵn
                    </h3>
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                        {PRESET_RATIOS.map((preset, i) => (
                            <button
                                key={i}
                                onClick={() => handlePresetClick(preset)}
                                className={`p-3 rounded-xl border text-center transition-all hover:shadow-sm ${(mode === 'fromRatio' && ratioInput === preset.ratio)
                                        ? 'border-blue-300 bg-blue-50'
                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <p className="font-semibold text-gray-900">{preset.ratio}</p>
                                {preset.label && (
                                    <p className="text-[10px] text-gray-400 mt-0.5">{preset.label}</p>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AspectRatioCalculator;
