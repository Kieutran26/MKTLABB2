import React, { useState, useMemo } from 'react';
import { FileText, Copy, RefreshCw, Check, Minus, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Vietnamese Lorem Ipsum - Marketing-focused
const LOREM_WORDS_VI = [
    'thương hiệu', 'chiến lược', 'marketing', 'khách hàng', 'sản phẩm', 'dịch vụ', 'trải nghiệm',
    'giá trị', 'đổi mới', 'sáng tạo', 'phát triển', 'kết nối', 'cộng đồng', 'cam kết', 'chất lượng',
    'uy tín', 'chuyên nghiệp', 'hiệu quả', 'tối ưu', 'giải pháp', 'nền tảng', 'công nghệ', 'số hóa',
    'truyền thông', 'nội dung', 'tương tác', 'chuyển đổi', 'tăng trưởng', 'doanh thu', 'thị trường',
    'cạnh tranh', 'định vị', 'nhận diện', 'thông điệp', 'insight', 'persona', 'hành trình', 'điểm chạm',
    'trung thành', 'bền vững', 'minh bạch', 'tin cậy', 'hợp tác', 'đối tác', 'mục tiêu', 'thành công',
    'đột phá', 'tiên phong', 'dẫn đầu', 'chuẩn mực', 'xuất sắc', 'vượt trội', 'độc đáo', 'khác biệt'
];

const LOREM_SENTENCES_VI = [
    'Chúng tôi cam kết mang đến những giải pháp marketing hiệu quả và sáng tạo cho doanh nghiệp của bạn.',
    'Với đội ngũ chuyên gia giàu kinh nghiệm, chúng tôi giúp thương hiệu của bạn kết nối với khách hàng mục tiêu.',
    'Chiến lược marketing tối ưu là chìa khóa để phát triển bền vững trong thị trường cạnh tranh.',
    'Mỗi khách hàng là một hành trình riêng biệt cần được thấu hiểu và chăm sóc chu đáo.',
    'Công nghệ số hóa đang thay đổi cách doanh nghiệp tương tác với khách hàng.',
    'Nội dung chất lượng là nền tảng xây dựng uy tín và niềm tin thương hiệu.',
    'Trải nghiệm khách hàng xuất sắc tạo nên sự khác biệt trong thị trường đầy cạnh tranh.',
    'Đổi mới và sáng tạo không ngừng là kim chỉ nam cho mọi hoạt động của chúng tôi.',
    'Thương hiệu mạnh được xây dựng từ những giá trị cốt lõi và cam kết nhất quán.',
    'Chuyển đổi số giúp doanh nghiệp tối ưu hóa quy trình và nâng cao hiệu quả kinh doanh.'
];

// Classic Lorem Ipsum
const LOREM_WORDS_CLASSIC = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
    'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit',
    'voluptate', 'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia', 'deserunt',
    'mollit', 'anim', 'id', 'est', 'laborum'
];

type TextType = 'classic' | 'vietnamese';
type GenerateMode = 'paragraphs' | 'sentences' | 'words';

const LoremIpsumGenerator: React.FC = () => {
    const [textType, setTextType] = useState<TextType>('vietnamese');
    const [mode, setMode] = useState<GenerateMode>('paragraphs');
    const [count, setCount] = useState(3);
    const [copied, setCopied] = useState(false);
    const [seed, setSeed] = useState(0); // Used to force regeneration

    const generateWord = (type: TextType): string => {
        const words = type === 'vietnamese' ? LOREM_WORDS_VI : LOREM_WORDS_CLASSIC;
        return words[Math.floor(Math.random() * words.length)];
    };

    const generateSentence = (type: TextType): string => {
        if (type === 'vietnamese') {
            return LOREM_SENTENCES_VI[Math.floor(Math.random() * LOREM_SENTENCES_VI.length)];
        }
        // Classic: generate 8-15 words
        const wordCount = Math.floor(Math.random() * 8) + 8;
        const words = Array.from({ length: wordCount }, () => generateWord(type));
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
        return words.join(' ') + '.';
    };

    const generateParagraph = (type: TextType): string => {
        const sentenceCount = Math.floor(Math.random() * 3) + 4; // 4-6 sentences
        return Array.from({ length: sentenceCount }, () => generateSentence(type)).join(' ');
    };

    const generatedText = useMemo(() => {
        // seed is used to force recalculation
        void seed;
        switch (mode) {
            case 'words':
                return Array.from({ length: count }, () => generateWord(textType)).join(' ');
            case 'sentences':
                return Array.from({ length: count }, () => generateSentence(textType)).join(' ');
            case 'paragraphs':
                return Array.from({ length: count }, () => generateParagraph(textType)).join('\n\n');
            default:
                return '';
        }
    }, [textType, mode, count, seed]);

    const stats = useMemo(() => {
        const words = generatedText.split(/\s+/).filter(w => w.length > 0).length;
        const characters = generatedText.length;
        const paragraphs = generatedText.split(/\n\n+/).filter(p => p.trim().length > 0).length;
        return { words, characters, paragraphs };
    }, [generatedText]);

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText);
        setCopied(true);
        toast.success('Đã sao chép!', { icon: '📋' });
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerate = () => {
        setSeed(s => s + 1); // Increment seed to force regeneration
        toast.success('Đã tạo mới!', { icon: '🔄' });
    };


    return (
        <div className="min-h-full bg-slate-50 p-8">
            <Toaster position="top-center" />
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Tạo Văn Bản Giả</h1>
                            <p className="text-sm text-slate-500">Lorem Ipsum Generator</p>
                        </div>
                    </div>
                </div>

                {/* Controls */}
                <div className="bg-white border border-slate-100 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Text Type */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Loại Văn Bản</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setTextType('vietnamese')}
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${textType === 'vietnamese'
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    🇻🇳 Tiếng Việt
                                </button>
                                <button
                                    onClick={() => setTextType('classic')}
                                    className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${textType === 'classic'
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    📜 Lorem Ipsum
                                </button>
                            </div>
                        </div>

                        {/* Generate Mode */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Đơn Vị</label>
                            <div className="flex gap-2">
                                {([
                                    { id: 'paragraphs', label: 'Đoạn' },
                                    { id: 'sentences', label: 'Câu' },
                                    { id: 'words', label: 'Từ' }
                                ] as { id: GenerateMode; label: string }[]).map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => setMode(item.id)}
                                        className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${mode === item.id
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Count */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Số Lượng</label>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCount(c => Math.max(1, c - 1))}
                                    className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all"
                                >
                                    <Minus size={16} />
                                </button>
                                <input
                                    type="number"
                                    value={count}
                                    onChange={(e) => setCount(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                                    className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                                    min={1}
                                    max={100}
                                />
                                <button
                                    onClick={() => setCount(c => Math.min(100, c + 1))}
                                    className="w-10 h-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-100 transition-all"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>{stats.words} từ</span>
                            <span>•</span>
                            <span>{stats.characters} ký tự</span>
                            <span>•</span>
                            <span>{stats.paragraphs} đoạn</span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleRegenerate}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all text-sm"
                            >
                                <RefreshCw size={16} /> Tạo Mới
                            </button>
                            <button
                                onClick={handleCopy}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all text-sm"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                                {copied ? 'Đã Sao Chép' : 'Sao Chép'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Generated Text Display */}
                <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileText size={18} className="text-slate-400" />
                            <span className="font-medium text-slate-900">Văn Bản Được Tạo</span>
                        </div>
                        <span className="text-xs text-slate-400 uppercase tracking-wide">
                            {textType === 'vietnamese' ? 'Tiếng Việt - Marketing' : 'Lorem Ipsum - Classic'}
                        </span>
                    </div>
                    <div className="p-6">
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-normal">
                            {generatedText || 'Nhấn "Tạo Mới" để tạo văn bản...'}
                        </div>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-sm text-slate-600">
                        💡 <strong>Mẹo:</strong> Văn bản giả giúp làm đầy nội dung khi thiết kế UI/UX, mockup, hoặc demo trước khi có nội dung thực.
                        Chọn "Tiếng Việt" để có văn bản marketing phù hợp với thị trường Việt Nam.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoremIpsumGenerator;
