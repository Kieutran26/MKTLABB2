import React, { useState } from 'react';
import { HelpCircle, Sparkles, Loader2, Copy, Check, RefreshCw, Lightbulb } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { getGeminiClient } from '../../lib/geminiClient';

const ProblemToQuestion: React.FC = () => {
    const [problem, setProblem] = useState('');
    const [questions, setQuestions] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    const handleGenerate = async () => {
        if (!problem.trim()) {
            toast.error('Vui lòng nhập vấn đề!');
            return;
        }

        const ai = getGeminiClient();
        if (!ai) {
            toast.error('Thêm VITE_GEMINI_API_KEY vào .env.local (Google AI Studio).');
            return;
        }

        setIsGenerating(true);
        setQuestions([]);

        try {
            const prompt = `Bạn là chuyên gia tư duy giải quyết vấn đề. Nhiệm vụ của bạn là chuyển đổi vấn đề/lời than phiền thành các câu hỏi có thể hành động được.

VẤN ĐỀ/THAN PHIỀN:
"${problem}"

Hãy tạo 5 câu hỏi có thể hành động được (actionable questions) từ vấn đề trên. Các câu hỏi phải:
1. Bắt đầu bằng "Làm thế nào...", "Điều gì...", "Tại sao...", "Khi nào...", "Ai có thể..."
2. Tập trung vào giải pháp, không phải vấn đề
3. Cụ thể và có thể thực hiện được
4. Mở ra hướng suy nghĩ mới

LƯU Ý: Đây là lần tạo ngẫu nhiên lúc ${Date.now()}. Vui lòng sinh ra các câu hỏi KHÁC BIỆT hoàn toàn so với những lần trước.

Trả về CHÍNH XÁC theo format JSON array, không có markdown hay giải thích:
["Câu hỏi 1", "Câu hỏi 2", "Câu hỏi 3", "Câu hỏi 4", "Câu hỏi 5"]`;

            const response = await ai.models.generateContent({
                model: 'gpt-4.1',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: 0.9,
                }
            });

            const text = response.text || '';

            // Parse JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                setQuestions(parsed);
                toast.success('Đã tạo câu hỏi!', { icon: '💡' });
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error: any) {
            console.error('Error:', error);
            const errorMessage = error?.message || 'Đã xảy ra lỗi. Vui lòng thử lại!';
            toast.error(errorMessage, { duration: 5000 });
        } finally {
            setIsGenerating(false);
        }
    };


    const handleCopy = (text: string, index: number) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        toast.success('Đã sao chép!', { icon: '📋' });
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleCopyAll = () => {
        navigator.clipboard.writeText(questions.join('\n\n'));
        toast.success('Đã sao chép tất cả!', { icon: '📋' });
    };

    const exampleProblems = [
        'Doanh thu tháng này giảm 20%',
        'Nhân viên hay nghỉ việc',
        'Khách hàng phàn nàn về dịch vụ',
        'Không có thời gian làm việc quan trọng'
    ];

    return (
        <div className="min-h-full bg-slate-50 p-8">
            <Toaster position="top-center" />
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-white border border-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                            <HelpCircle size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Chuyển Vấn Đề Thành Câu Hỏi</h1>
                            <p className="text-sm text-slate-500">Problem to Actionable Questions</p>
                        </div>
                    </div>
                </div>

                {/* Input Section */}
                <div className="bg-white border border-slate-100 rounded-xl p-6 mb-6">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Nhập vấn đề hoặc lời than phiền
                        </label>
                        <textarea
                            value={problem}
                            onChange={(e) => setProblem(e.target.value)}
                            placeholder="VD: Doanh thu tháng này giảm mạnh, không biết nguyên nhân do đâu..."
                            rows={4}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-300 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Example chips */}
                    <div className="mb-4">
                        <p className="text-xs text-slate-500 mb-2">Ví dụ:</p>
                        <div className="flex flex-wrap gap-2">
                            {exampleProblems.map((ex, i) => (
                                <button
                                    key={i}
                                    onClick={() => setProblem(ex)}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-all"
                                >
                                    {ex}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !problem.trim()}
                        className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Đang phân tích...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Chuyển Thành Câu Hỏi
                            </>
                        )}
                    </button>
                </div>

                {/* Results Section */}
                {questions.length > 0 && (
                    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lightbulb size={18} className="text-amber-500" />
                                <span className="font-medium text-slate-900">Câu Hỏi Có Thể Hành Động</span>
                            </div>
                            <button
                                onClick={handleCopyAll}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 hover:bg-slate-100 transition-all"
                            >
                                <Copy size={14} />
                                Sao chép tất cả
                            </button>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {questions.map((question, index) => (
                                <div key={index} className="px-5 py-4 flex items-start gap-4 group hover:bg-slate-50 transition-colors">
                                    <div className="w-7 h-7 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 font-medium text-sm shrink-0 mt-0.5">
                                        {index + 1}
                                    </div>
                                    <p className="flex-1 text-sm text-slate-800 leading-relaxed">{question}</p>
                                    <button
                                        onClick={() => handleCopy(question, index)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-slate-600 transition-all shrink-0"
                                    >
                                        {copiedIndex === index ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Regenerate button */}
                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg transition-all text-sm"
                            >
                                <RefreshCw size={16} />
                                Tạo câu hỏi mới
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {questions.length === 0 && !isGenerating && (
                    <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
                        <div className="w-14 h-14 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                            <HelpCircle size={28} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 text-sm mb-1">Chưa có câu hỏi nào</p>
                        <p className="text-slate-400 text-xs">Nhập vấn đề và nhấn "Chuyển Thành Câu Hỏi"</p>
                    </div>
                )}

                {/* Info Card */}
                <div className="mt-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-sm text-slate-600">
                        💡 <strong>Tại sao cần chuyển vấn đề thành câu hỏi?</strong> Câu hỏi đúng mở ra cánh cửa tìm giải pháp.
                        Thay vì than phiền "Doanh thu giảm", hãy hỏi "Làm thế nào để tăng doanh thu 10% trong tháng tới?"
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ProblemToQuestion;
