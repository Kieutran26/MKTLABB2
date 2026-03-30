
import React, { useState, useEffect } from 'react';
import { Plus, Copy, Edit2, Trash2, X, TerminalSquare, Check, Sparkles, Eye } from 'lucide-react';
import { SavedPrompt } from '../types';
import { PromptService } from '../services/promptService';
import { Toast, ToastType } from './Toast';
import { ConfirmDialog } from './ConfirmDialog';

const PromptManager: React.FC = () => {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [viewingPrompt, setViewingPrompt] = useState<SavedPrompt | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; id: string | null }>({ show: false, id: null });

  // Form State
  const [aiModel, setAiModel] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const SUGGESTED_MODELS = ['Gemini', 'ChatGPT', 'Claude', 'Midjourney', 'Copilot', 'Llama'];

  const showToast = (message: string, type: ToastType = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    const data = await PromptService.getPrompts();
    setPrompts(data);
    setIsLoading(false);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleEdit = (prompt: SavedPrompt) => {
    setEditingId(prompt.id);
    setAiModel(prompt.aiModel);
    setTitle(prompt.title);
    setContent(prompt.content);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    setConfirmDialog({ show: true, id });
  };

  const confirmDelete = async () => {
    const id = confirmDialog.id;
    setConfirmDialog({ show: false, id: null });

    if (id) {
      const success = await PromptService.deletePrompt(id);
      if (success) {
        await refreshData();
        showToast('Đã xóa prompt', 'success');
      } else {
        showToast('Lỗi khi xóa prompt', 'error');
      }
    }
  };

  const handleSave = async () => {
    if (!aiModel.trim() || !title.trim() || !content.trim()) {
      showToast('Vui lòng nhập đầy đủ thông tin!', 'error');
      return;
    }

    const prompt: SavedPrompt = {
      id: editingId || Date.now().toString(),
      aiModel,
      title,
      content,
      createdAt: Date.now()
    };

    const success = await PromptService.savePrompt(prompt);

    if (success) {
      setShowModal(false);
      resetForm();
      await refreshData();
      showToast('Đã lưu prompt thành công!', 'success');
    } else {
      showToast('Lỗi khi lưu prompt', 'error');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setAiModel('');
    setTitle('');
    setContent('');
  };

  const getBadgeColor = (model: string) => {
    const m = model.toLowerCase();
    if (m.includes('gemini') || m.includes('google')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (m.includes('chatgpt') || m.includes('gpt')) return 'bg-green-50 text-green-700 border-green-100';
    if (m.includes('claude')) return 'bg-orange-50 text-orange-700 border-orange-100';
    if (m.includes('midjourney')) return 'bg-purple-50 text-purple-700 border-purple-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  return (
    <div className="max-w-6xl mx-auto pt-10 px-4 pb-10">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
          <TerminalSquare className="text-slate-700" strokeWidth={1.5} />
          Kho Prompt AI
        </h2>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-[0_4px_14px_0_rgba(79,70,229,0.3)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.4)]"
        >
          <Plus size={20} strokeWidth={1.5} /> Thêm Prompt
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {prompts.map(prompt => (
          <div key={prompt.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-soft hover:shadow-lg transition-all flex flex-col group">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getBadgeColor(prompt.aiModel)}`}>
                {prompt.aiModel}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(prompt)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit2 size={16} strokeWidth={1.5} />
                </button>
                <button onClick={() => handleDelete(prompt.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-bold text-lg text-slate-800 leading-tight mb-1">{prompt.title}</h3>
              <p className="text-xs text-slate-400">Mục đích sử dụng</p>
            </div>

            {/* Preview with fade */}
            <div className="relative mb-4">
              <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {prompt.content}
              </p>
              <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-white to-transparent"></div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-auto">
              <button
                onClick={() => setViewingPrompt(prompt)}
                className="flex-1 py-2.5 px-4 bg-slate-50 text-slate-700 rounded-xl font-medium hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 border border-slate-100"
              >
                <Eye size={16} strokeWidth={1.5} />
                Xem
              </button>
              <button
                onClick={() => handleEdit(prompt)}
                className="flex-1 py-2.5 px-4 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border border-indigo-100"
              >
                <Edit2 size={16} strokeWidth={1.5} />
                Sửa
              </button>
            </div>
          </div>
        ))}
        {prompts.length === 0 && (
          <div className="col-span-1 md:col-span-2 p-12 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-white/50">
            <Sparkles className="mx-auto text-slate-300 mb-4" size={48} strokeWidth={1} />
            <p className="text-slate-500 font-medium">Chưa có prompt nào được lưu.</p>
            <p className="text-sm text-slate-400">Lưu lại các câu lệnh hay để dùng lại sau!</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewingPrompt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border ${getBadgeColor(viewingPrompt.aiModel)}`}>
                  {viewingPrompt.aiModel}
                </span>
                <h3 className="text-xl font-bold text-slate-800">{viewingPrompt.title}</h3>
              </div>
              <button onClick={() => setViewingPrompt(null)} className="text-slate-400 hover:text-slate-700">
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nội dung Prompt</p>
                  <button
                    onClick={() => handleCopy(viewingPrompt.content, viewingPrompt.id)}
                    className="p-2 bg-white rounded-lg shadow-sm border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 transition-all"
                    title="Copy Prompt"
                  >
                    {copiedId === viewingPrompt.id ? <Check size={16} className="text-green-600" strokeWidth={1.5} /> : <Copy size={16} strokeWidth={1.5} />}
                  </button>
                </div>
                <p className="font-mono text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {viewingPrompt.content}
                </p>
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 border-t border-slate-100 bg-white">
              <button
                onClick={() => setViewingPrompt(null)}
                className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  handleEdit(viewingPrompt);
                  setViewingPrompt(null);
                }}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-soft"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Chỉnh sửa Prompt' : 'Thêm Prompt Mới'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={24} strokeWidth={1.5} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Mô hình AI</label>
                <div className="flex gap-2 flex-wrap mb-3">
                  {SUGGESTED_MODELS.map(model => (
                    <button
                      key={model}
                      onClick={() => setAiModel(model)}
                      className={`px-4 py-1.5 text-xs font-bold rounded-full border transition-all ${aiModel === model ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:bg-slate-50'}`}
                    >
                      {model}
                    </button>
                  ))}
                </div>
                <input
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="Hoặc nhập tên AI khác (VD: Dall-E)..."
                  value={aiModel}
                  onChange={e => setAiModel(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Mục đích / Kết quả (Chi tiết)</label>
                <input
                  className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  placeholder="VD: Dịch thuật giọng văn chuyên nghiệp..."
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Chi tiết Prompt</label>
                <textarea
                  className="w-full p-4 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all h-40 font-mono text-sm"
                  placeholder="Nhập nội dung prompt tại đây..."
                  value={content}
                  onChange={e => setContent(e.target.value)}
                />
              </div>
            </div>

            <div className="p-6 pt-0 flex gap-3 mt-auto bg-white border-t border-slate-100 pt-4 rounded-b-3xl">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-3 text-slate-500 font-medium hover:bg-slate-50 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-soft"
              >
                Lưu Prompt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.show}
        title="Xóa Prompt"
        message="Bạn có chắc muốn xóa prompt này không? Hành động này không thể hoàn tác."
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ show: false, id: null })}
        isDestructive={true}
      />
    </div>
  );
};

export default PromptManager;
