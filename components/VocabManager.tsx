
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Upload, FileText, FolderPlus, Save, X, Loader2, Volume2 } from 'lucide-react';
import { VocabService, SavedVocabSet, SavedWord } from '../services/vocabService';
import { VocabSet, Word } from '../types';

// Text-to-Speech function for pronunciation
const speakWord = (word: string) => {
  if ('speechSynthesis' in window) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    // Try to find an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice =>
      voice.lang.startsWith('en') && voice.name.includes('English')
    ) || voices.find(voice => voice.lang.startsWith('en'));

    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    window.speechSynthesis.speak(utterance);
  }
};

const VocabManager: React.FC = () => {
  const [sets, setSets] = useState<VocabSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [words, setWords] = useState<Word[]>([]);

  // UI States
  const [isCreatingSet, setIsCreatingSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [loading, setLoading] = useState(false);
  const [wordsLoading, setWordsLoading] = useState(false);

  // Add Word States
  const [addMode, setAddMode] = useState<'manual' | 'bulk' | 'file'>('manual');
  const [manualEn, setManualEn] = useState('');
  const [manualVi, setManualVi] = useState('');
  const [bulkText, setBulkText] = useState('');

  // Edit States
  const [editingWord, setEditingWord] = useState<Word | null>(null);

  useEffect(() => {
    refreshData();
  }, []);

  useEffect(() => {
    if (selectedSetId) {
      loadWords();
    } else {
      setWords([]);
    }
  }, [selectedSetId]);

  const loadWords = async () => {
    if (!selectedSetId) return;
    setWordsLoading(true);
    const loadedWords = await VocabService.getWordsBySet(selectedSetId);
    // Convert SavedWord to Word format
    setWords(loadedWords.map(w => ({
      id: w.id,
      term: w.english,
      definition: w.vietnamese,
      starred: w.starred,
      setId: w.setId
    })));
    setWordsLoading(false);
  };

  const refreshData = async () => {
    setLoading(true);
    const loadedSets = await VocabService.getVocabSets();
    // Convert SavedVocabSet to VocabSet format
    setSets(loadedSets.map(s => ({
      id: s.id,
      name: s.name,
      createdAt: s.createdAt
    })));
    if (loadedSets.length > 0 && !selectedSetId) {
      setSelectedSetId(loadedSets[0].id);
    }
    setLoading(false);
  };

  const handleCreateSet = async () => {
    if (!newSetName.trim()) return;
    const newSet: SavedVocabSet = {
      id: Date.now().toString(),
      name: newSetName.trim(),
      description: '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const success = await VocabService.saveVocabSet(newSet);
    if (success) {
      setSets([...sets, { id: newSet.id, name: newSet.name, createdAt: newSet.createdAt }]);
      setSelectedSetId(newSet.id);
      setNewSetName('');
      setIsCreatingSet(false);
    }
  };

  const handleDeleteSet = async (id: string) => {
    if (confirm('Bạn có chắc muốn xóa bộ từ vựng này và tất cả từ trong đó?')) {
      const success = await VocabService.deleteVocabSet(id);
      if (success) {
        await refreshData();
        if (selectedSetId === id) setSelectedSetId(null);
      }
    }
  };

  const handleAddManual = async () => {
    if (!selectedSetId || !manualEn.trim() || !manualVi.trim()) return;
    const newWord: SavedWord = {
      id: Date.now().toString(),
      setId: selectedSetId,
      english: manualEn.trim(),
      vietnamese: manualVi.trim(),
      starred: false,
      createdAt: Date.now()
    };
    const success = await VocabService.saveWord(newWord);
    if (success) {
      setWords([...words, {
        id: newWord.id,
        term: newWord.english,
        definition: newWord.vietnamese,
        starred: newWord.starred,
        setId: newWord.setId
      }]);
      setManualEn('');
      setManualVi('');
    }
  };

  const handleBulkPaste = async () => {
    if (!selectedSetId || !bulkText.trim()) return;
    const lines = bulkText.split('\n');
    const newWords: SavedWord[] = [];

    lines.forEach((line, index) => {
      const parts = line.split('\t');
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        newWords.push({
          id: Date.now() + index + Math.random().toString(),
          setId: selectedSetId,
          english: parts[0].trim(),
          vietnamese: parts[1].trim(),
          starred: false,
          createdAt: Date.now()
        });
      }
    });

    if (newWords.length > 0) {
      const success = await VocabService.saveWords(newWords);
      if (success) {
        setWords([...words, ...newWords.map(w => ({
          id: w.id,
          term: w.english,
          definition: w.vietnamese,
          starred: w.starred,
          setId: w.setId
        }))]);
        setBulkText('');
        alert(`Đã thêm thành công ${newWords.length} từ.`);
      }
    } else {
      alert('Không tìm thấy từ hợp lệ. Hãy đảm bảo định dạng: [Tiếng Anh] TAB [Tiếng Việt]');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedSetId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const newWords: SavedWord[] = [];

      lines.forEach((line, index) => {
        const parts = line.split('\t');
        if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
          newWords.push({
            id: Date.now() + index + Math.random().toString(),
            setId: selectedSetId,
            english: parts[0].trim(),
            vietnamese: parts[1].trim(),
            starred: false,
            createdAt: Date.now()
          });
        }
      });

      if (newWords.length > 0) {
        const success = await VocabService.saveWords(newWords);
        if (success) {
          setWords([...words, ...newWords.map(w => ({
            id: w.id,
            term: w.english,
            definition: w.vietnamese,
            starred: w.starred,
            setId: w.setId
          }))]);
          alert(`Đã thêm thành công ${newWords.length} từ từ file.`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleEditWord = async (word: Word) => {
    const updatedWord: SavedWord = {
      id: word.id,
      setId: word.setId,
      english: word.term,
      vietnamese: word.definition,
      starred: word.starred,
      createdAt: Date.now()
    };
    const success = await VocabService.saveWord(updatedWord);
    if (success) {
      setWords(words.map(w => w.id === word.id ? word : w));
      setEditingWord(null);
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (confirm('Xóa từ này?')) {
      const success = await VocabService.deleteWord(id);
      if (success) {
        setWords(words.filter(w => w.id !== id));
      }
    }
  };

  return (
    <div className="h-screen pt-4 pb-4 px-8 flex flex-col">
      <h2 className="text-3xl font-bold mb-6 text-slate-800">Quản lý từ vựng</h2>

      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar: Sets List */}
        <div className="w-1/4 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
            <h3 className="font-semibold text-slate-700">Bộ từ vựng</h3>
            <button
              onClick={() => setIsCreatingSet(true)}
              className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500 hover:text-indigo-600"
              title="Tạo bộ mới"
            >
              <FolderPlus size={18} strokeWidth={1.5} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {isCreatingSet && (
              <div className="p-2 bg-slate-50 rounded-lg mb-2 border border-slate-200">
                <input
                  autoFocus
                  className="w-full p-2 text-sm border border-slate-200 rounded-md mb-2 focus:border-indigo-500 focus:outline-none"
                  placeholder="Tên bộ mới..."
                  value={newSetName}
                  onChange={e => setNewSetName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreateSet()}
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setIsCreatingSet(false)} className="text-xs text-slate-500 hover:text-slate-700">Hủy</button>
                  <button onClick={handleCreateSet} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors">Tạo</button>
                </div>
              </div>
            )}

            {sets.map(set => (
              <div
                key={set.id}
                onClick={() => setSelectedSetId(set.id)}
                className={`group p-3 rounded-xl cursor-pointer flex justify-between items-center transition-all ${selectedSetId === set.id
                  ? 'bg-indigo-50 text-indigo-700 font-medium ring-1 ring-indigo-200'
                  : 'hover:bg-slate-50 text-slate-600'
                  }`}
              >
                <span className="truncate">{set.name}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteSet(set.id); }}
                  className={`opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 hover:text-red-500 transition-all ${selectedSetId === set.id ? 'text-indigo-300' : 'text-slate-300'}`}
                >
                  <Trash2 size={14} strokeWidth={1.5} />
                </button>
              </div>
            ))}

            {sets.length === 0 && !isCreatingSet && (
              <div className="text-center py-8 text-slate-400 text-sm">
                Chưa có danh mục nào. <br /> Hãy tạo mới!
              </div>
            )}
          </div>
        </div>

        {/* Main Content: Add Words & Word List */}
        <div className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {selectedSetId ? (
            <>
              {/* Add Word Area */}
              <div className="p-6 bg-slate-50 border-b border-slate-100">
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() => setAddMode('manual')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${addMode === 'manual' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-white'}`}
                  >
                    Thủ công
                  </button>
                  <button
                    onClick={() => setAddMode('bulk')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${addMode === 'bulk' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-white'}`}
                  >
                    Paste hàng loạt
                  </button>
                  <button
                    onClick={() => setAddMode('file')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${addMode === 'file' ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100' : 'text-slate-500 hover:bg-white'}`}
                  >
                    Upload File
                  </button>
                </div>

                {addMode === 'manual' && (
                  <div className="flex gap-4">
                    <input
                      className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder="Từ tiếng Anh (English)"
                      value={manualEn}
                      onChange={e => setManualEn(e.target.value)}
                    />
                    <input
                      className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                      placeholder="Nghĩa tiếng Việt"
                      value={manualVi}
                      onChange={e => setManualVi(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddManual()}
                    />
                    <button onClick={handleAddManual} className="bg-indigo-600 text-white px-6 rounded-xl hover:bg-indigo-700 shadow-soft transition-all">
                      <Plus size={20} strokeWidth={1.5} />
                    </button>
                  </div>
                )}

                {addMode === 'bulk' && (
                  <div className="flex flex-col gap-3">
                    <textarea
                      className="w-full p-4 border border-slate-200 rounded-xl h-24 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-mono"
                      placeholder={`Ví dụ:\nHello\tXin chào\nApple\tQuả táo`}
                      value={bulkText}
                      onChange={e => setBulkText(e.target.value)}
                    />
                    <button onClick={handleBulkPaste} className="self-end bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-soft hover:bg-indigo-700 transition-all">Thêm danh sách</button>
                  </div>
                )}

                {addMode === 'file' && (
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-white hover:bg-slate-50 transition-colors">
                    <input type="file" id="fileUpload" className="hidden" accept=".txt" onChange={handleFileUpload} />
                    <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center gap-2 text-slate-500 hover:text-indigo-600">
                      <Upload size={32} strokeWidth={1.5} />
                      <span className="text-sm font-medium">Click để chọn file .txt</span>
                      <span className="text-xs text-slate-400">Cấu trúc: [Tiếng Anh] TAB [Tiếng Việt]</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Word List */}
              <div className="flex-1 overflow-y-auto p-2">
                {wordsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                    <p className="text-sm text-slate-500">Đang tải từ vựng...</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-white sticky top-0 z-10">
                      <tr>
                        <th className="p-3 text-sm font-semibold text-slate-500 border-b">Tiếng Anh</th>
                        <th className="p-3 text-sm font-semibold text-slate-500 border-b">Tiếng Việt</th>
                        <th className="p-3 text-sm font-semibold text-slate-500 border-b w-24">Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {words.map(word => (
                        <tr key={word.id} className="group hover:bg-slate-50 border-b border-slate-50">
                          {editingWord?.id === word.id ? (
                            <>
                              <td className="p-2">
                                <input
                                  className="w-full p-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  value={editingWord.term}
                                  onChange={e => setEditingWord({ ...editingWord, term: e.target.value })}
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  className="w-full p-2 border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  value={editingWord.definition}
                                  onChange={e => setEditingWord({ ...editingWord, definition: e.target.value })}
                                />
                              </td>
                              <td className="p-2 flex gap-2">
                                <button onClick={() => handleEditWord(editingWord)} className="text-green-600 hover:bg-green-50 p-1 rounded"><Save size={16} strokeWidth={1.5} /></button>
                                <button onClick={() => setEditingWord(null)} className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded"><X size={16} strokeWidth={1.5} /></button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 font-medium text-slate-800">
                                <div className="flex items-center gap-2">
                                  {word.term}
                                  <button
                                    onClick={() => speakWord(word.term)}
                                    className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                    title="Phát âm"
                                  >
                                    <Volume2 size={16} strokeWidth={1.5} />
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-slate-600">{word.definition}</td>
                              <td className="p-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setEditingWord(word)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-indigo-600 border border-transparent hover:border-slate-100 transition-all"><Edit2 size={16} strokeWidth={1.5} /></button>
                                <button onClick={() => handleDeleteWord(word.id)} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg text-slate-400 hover:text-red-500 border border-transparent hover:border-slate-100 transition-all"><Trash2 size={16} strokeWidth={1.5} /></button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                      {words.length === 0 && (
                        <tr>
                          <td colSpan={3} className="p-8 text-center text-slate-400">
                            Chưa có từ vựng trong danh mục này.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <FileText size={48} strokeWidth={1} className="mb-4 opacity-30" />
              <p>Chọn một danh mục bên trái hoặc tạo mới để bắt đầu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VocabManager;
