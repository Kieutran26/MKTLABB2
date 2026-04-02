
import React, { useState, useEffect } from 'react';
import { Star, Trash2, SquareStack, CheckSquare, PenTool, CheckCircle, Circle } from 'lucide-react';
import { VocabService } from '../services/vocabService';
import { Word, StudyMode } from '../types';

interface StarredViewProps {
    onStartStudy: (mode: StudyMode, words: Word[]) => void;
}

const StarredView: React.FC<StarredViewProps> = ({ onStartStudy }) => {
    const [starredWords, setStarredWords] = useState<Word[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStarredWords();
    }, []);

    const loadStarredWords = async () => {
        setLoading(true);
        const savedWords = await VocabService.getStarredWords();
        // Convert SavedWord to Word format
        setStarredWords(savedWords.map(w => ({
            id: w.id,
            term: w.english,
            definition: w.vietnamese,
            starred: w.starred,
            setId: w.setId
        })));
        setLoading(false);
    };

    const handleUnstar = async (id: string) => {
        const word = starredWords.find(w => w.id === id);
        if (word) {
            await VocabService.toggleStar(id, word.starred);
            setStarredWords(prev => prev.filter(w => w.id !== id));
            // Remove from selection if unstarred
            if (selectedIds.has(id)) {
                const newSet = new Set(selectedIds);
                newSet.delete(id);
                setSelectedIds(newSet);
            }
        }
    };

    const toggleSelect = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === starredWords.length) {
            setSelectedIds(new Set());
        } else {
            const allIds = starredWords.map(w => w.id);
            setSelectedIds(new Set(allIds));
        }
    };

    const handleStartStudy = (mode: StudyMode) => {
        if (selectedIds.size === 0) return;
        const selectedWords = starredWords.filter(w => selectedIds.has(w.id));
        onStartStudy(mode, selectedWords);
    };

    const isAllSelected = starredWords.length > 0 && selectedIds.size === starredWords.length;

    return (
        <div className="max-w-4xl mx-auto pt-10 px-4">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-yellow-100 p-3 rounded-2xl text-yellow-600 shadow-sm">
                    <Star size={32} strokeWidth={1.5} />
                </div>
                <h2 className="text-3xl font-bold text-slate-800">Từ đã đánh dấu</h2>
            </div>

            {/* Controls & Study Modes */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-soft mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleSelectAll}
                        className="flex items-center gap-2 text-sm font-medium hover:bg-slate-50 px-3 py-2 rounded-xl transition-colors border border-transparent hover:border-slate-100"
                    >
                        {isAllSelected ? <CheckCircle className="text-indigo-600" size={20} strokeWidth={1.5} /> : <Circle className="text-slate-300" size={20} strokeWidth={1.5} />}
                        <span className="text-slate-600">{isAllSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</span>
                    </button>
                    <span className="text-slate-300 text-sm">|</span>
                    <span className="text-sm font-medium text-slate-500">Đã chọn: <b className="text-indigo-600">{selectedIds.size}</b></span>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <button
                        disabled={selectedIds.size === 0}
                        onClick={() => handleStartStudy(StudyMode.FLASHCARD)}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        title="Học Flashcard với các từ đã chọn"
                    >
                        <SquareStack size={16} strokeWidth={1.5} /> Flashcard
                    </button>
                    <button
                        disabled={selectedIds.size === 0}
                        onClick={() => handleStartStudy(StudyMode.QUIZ)}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        title="Học Trắc nghiệm với các từ đã chọn"
                    >
                        <CheckSquare size={16} strokeWidth={1.5} /> Quiz
                    </button>
                    <button
                        disabled={selectedIds.size === 0}
                        onClick={() => handleStartStudy(StudyMode.WRITING)}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-white border border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                        title="Học Viết với các từ đã chọn"
                    >
                        <PenTool size={16} strokeWidth={1.5} /> Viết
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <div className="inline-block w-8 h-8 border-4 border-yellow-200 border-t-yellow-600 rounded-full animate-spin mb-3"></div>
                        <p className="text-slate-500">Đang tải...</p>
                    </div>
                ) : starredWords.length === 0 ? (
                    <div className="p-12 text-center text-slate-400">
                        Chưa có từ nào được đánh dấu. <br />
                        Hãy đánh dấu từ trong lúc học để xem lại ở đây.
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {starredWords.map(word => {
                            const isSelected = selectedIds.has(word.id);
                            return (
                                <div
                                    key={word.id}
                                    onClick={() => toggleSelect(word.id)}
                                    className={`p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/30' : ''}`}
                                >
                                    <div className={`text-slate-200 ${isSelected ? 'text-indigo-600' : ''}`}>
                                        {isSelected ? <CheckCircle size={24} strokeWidth={1.5} className="text-indigo-600" /> : <Circle size={24} strokeWidth={1.5} />}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-800">{word.term}</h3>
                                        <p className="text-slate-500">{word.definition}</p>
                                    </div>

                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleUnstar(word.id); }}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                        title="Bỏ đánh dấu"
                                    >
                                        <Trash2 size={20} strokeWidth={1.5} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StarredView;
