
import React, { useState, useEffect } from 'react';
import { SquareStack, CheckSquare, PenTool, Play, CheckCircle2 } from 'lucide-react';
import { VocabService } from '../services/vocabService';
import { VocabSet, StudyMode } from '../types';

interface StartLearningProps {
  onStart: (mode: StudyMode, setIds: string[]) => void;
}

const StartLearning: React.FC<StartLearningProps> = ({ onStart }) => {
  const [sets, setSets] = useState<VocabSet[]>([]);
  const [selectedSetIds, setSelectedSetIds] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<StudyMode | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSets();
  }, []);

  const loadSets = async () => {
    setLoading(true);
    const loadedSets = await VocabService.getVocabSets();
    // Convert SavedVocabSet to VocabSet format
    setSets(loadedSets.map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt
    })));
    setLoading(false);
  };

  const toggleSet = (id: string) => {
    setSelectedSetIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleStart = () => {
    if (selectedMode && selectedSetIds.length > 0) {
      onStart(selectedMode, selectedSetIds);
    }
  };

  const modes = [
    {
      id: StudyMode.FLASHCARD,
      name: 'Flashcards',
      desc: 'Lật thẻ để ôn tập từ vựng',
      icon: SquareStack,
      // Soft UI colors
      bg: 'bg-orange-100',
      text: 'text-orange-600',
    },
    {
      id: StudyMode.QUIZ,
      name: 'Trắc nghiệm',
      desc: 'Chọn 1 trong 4 đáp án đúng',
      icon: CheckSquare,
      bg: 'bg-blue-100',
      text: 'text-blue-600',
    },
    {
      id: StudyMode.WRITING,
      name: 'Chế độ Viết',
      desc: 'Gõ lại từ vựng dựa trên nghĩa',
      icon: PenTool,
      bg: 'bg-emerald-100',
      text: 'text-emerald-600',
    }
  ];

  return (
    <div className="max-w-5xl mx-auto pt-10 px-6 pb-20">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-800">Bắt đầu học</h2>
        <p className="text-slate-500 mt-2">Chọn chế độ và danh sách từ vựng để bắt đầu hành trình của bạn.</p>
      </div>

      {/* 1. Select Mode */}
      <div className="mb-12">
        <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold ring-4 ring-indigo-50/50">1</span>
          Chọn chế độ học
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modes.map(mode => (
            <div
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={`relative cursor-pointer p-8 rounded-[2rem] border transition-all duration-300 flex flex-col items-center text-center gap-4 group
                ${selectedMode === mode.id
                  ? `bg-white border-indigo-200 ring-4 ring-indigo-50 shadow-xl scale-[1.02]`
                  : 'bg-white border-slate-100 shadow-soft hover:shadow-lg hover:-translate-y-1 hover:border-slate-200'
                }`}
            >
              <div className={`p-5 rounded-2xl ${mode.bg} ${mode.text} mb-2 transition-transform group-hover:scale-110 duration-300`}>
                <mode.icon size={32} strokeWidth={1.5} />
              </div>
              <div>
                <h4 className="font-bold text-xl text-slate-800 mb-2">{mode.name}</h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{mode.desc}</p>
              </div>

              {selectedMode === mode.id && (
                <div className="absolute top-5 right-5 text-indigo-500 animate-in fade-in zoom-in duration-300">
                  <div className="bg-indigo-600 text-white p-1 rounded-full shadow-lg shadow-indigo-200">
                    <CheckCircle2 size={16} strokeWidth={3} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 2. Select Sets */}
      <div className="mb-12">
        <h3 className="text-lg font-bold mb-6 text-slate-700 flex items-center gap-3">
          <span className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-sm font-bold ring-4 ring-indigo-50/50">2</span>
          Chọn danh mục từ vựng <span className="text-slate-400 text-sm font-normal ml-1">({selectedSetIds.length} đã chọn)</span>
        </h3>

        {loading ? (
          <div className="p-16 text-center bg-white rounded-[2rem] border border-slate-200">
            <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
            <p className="text-slate-500">Đang tải danh mục...</p>
          </div>
        ) : sets.length === 0 ? (
          <div className="p-16 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200 text-slate-400">
            <p className="font-medium text-lg mb-2">Chưa có danh mục nào</p>
            <p className="text-sm">Hãy vào "Quản lý từ vựng" để tạo mới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sets.map(set => (
              <div
                key={set.id}
                onClick={() => toggleSet(set.id)}
                className={`cursor-pointer p-5 rounded-2xl border transition-all select-none relative overflow-hidden group
                  ${selectedSetIds.includes(set.id)
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 scale-[1.02]'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:shadow-md hover:bg-slate-50'
                  }`}
              >
                <div className="font-bold truncate text-lg">{set.name}</div>
                <div className={`text-xs mt-1 font-medium ${selectedSetIds.includes(set.id) ? 'text-indigo-200' : 'text-slate-400'}`}>
                  {new Date(set.createdAt).toLocaleDateString()}
                </div>
                {selectedSetIds.includes(set.id) && (
                  <div className="absolute top-3 right-3 text-white animate-in fade-in zoom-in">
                    <CheckCircle2 size={18} strokeWidth={2} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Start Button */}
      <div className="flex justify-end pb-10">
        <button
          onClick={handleStart}
          disabled={!selectedMode || selectedSetIds.length === 0}
          className="group flex items-center gap-3 px-10 py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[2rem] text-xl font-bold shadow-xl shadow-indigo-200 hover:shadow-2xl hover:shadow-indigo-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none transition-all duration-300"
        >
          <span>Bắt đầu ngay</span>
          <Play size={24} strokeWidth={2} className="fill-current group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default StartLearning;
