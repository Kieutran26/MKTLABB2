import React, { useState, useEffect } from 'react';
import {PenTool, Facebook, Instagram, Linkedin, AtSign, Video, Search, CheckSquare, Square, Sparkles, Copy, Check, Loader2, History, Trash2, Clock, X, Edit3, ShieldCheck, Save, Diamond, Lock, ChevronRight, Pencil} from 'lucide-react';
import { generateMultiPlatformContent } from '../services/geminiService';
import { ContentGeneratorService } from '../services/contentGeneratorService';
import { ContentHistoryRecord } from '../types';
import { Toast, ToastType } from './Toast';
import { useBrand } from './BrandContext';
import FeatureHeader from './FeatureHeader';
import BrandSelector from './BrandSelector';
import { saasService } from '../services/saasService';
import { useAuth } from './AuthContext';

const cardClass = 'rounded-2xl border border-stone-200/90 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]';
const inputClass = 'w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none focus:ring-2 focus:ring-stone-200/80';

const PLATFORMS = [
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'threads', label: 'Threads', icon: AtSign },
  { id: 'tiktok', label: 'TikTok', icon: Video },
  { id: 'seo', label: 'SEO Web', icon: Search },
];

interface ContentGeneratorProps {
  initialData?: { topic?: string; context?: string } | null;
}

const ContentGenerator: React.FC<ContentGeneratorProps> = ({ initialData }) => {
  const { user } = useAuth();
  const { currentBrand } = useBrand();
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'vault'>('manual');
  const [sampleContent, setSampleContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<Record<string, any>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [manualBrandName, setManualBrandName] = useState('');
  const [manualTone, setManualTone] = useState('');
  const [manualAudience, setManualAudience] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<ContentHistoryRecord[]>([]);
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      if (!user) return;
      const p = await saasService.getUserProfile(user.uid);
      setProfile(p);
    };
    loadUser();
  }, [user]);

  useEffect(() => {
    const loadHistory = async () => {
      if (showHistory) {
        const historyData = await ContentGeneratorService.getContentHistory();
        setHistory(historyData);
      }
    };
    loadHistory();
  }, [showHistory]);

  const handleGenerate = async () => {
    if (!sampleContent.trim() || selectedPlatforms.length === 0) {
      setToast({ message: 'Vui lòng nhập nội dung.', type: 'error' });
      return;
    }
    setIsGenerating(true);
    let contextPrompt = activeTab === 'manual' 
      ? `BRAND: ${manualBrandName}, TONE: ${manualTone}, AUDIENCE: ${manualAudience}`
      : `BRAND: ${currentBrand?.identity.name}, TONE: ${currentBrand?.strategy.toneOfVoice}, AUDIENCE: ${currentBrand?.audience.demographics}`;
    
    try {
      const generatedData = await generateMultiPlatformContent(`${contextPrompt}\n\nCONTENT: ${sampleContent}`, selectedPlatforms);
      setResults(generatedData);
      setToast({ message: 'Đã tạo xong!', type: 'success' });
    } catch (e) {
      setToast({ message: 'Lỗi tạo content!', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#FCFDFC] font-sans">
      <FeatureHeader
        icon={PenTool}
        eyebrow="OMNICHANNEL CONTENT"
        title="Content Multi-Platform"
        subline="Phóng tác nội dung đa nền tảng dựa trên ý tưởng gốc, tối ưu cho từng kênh phân phối."
      >
        <div className="flex shrink-0 items-center justify-end gap-2">
            <div className="inline-flex gap-1 rounded-2xl border border-stone-200 bg-stone-50/50 p-1 shadow-sm mr-2">
                <button onClick={() => setActiveTab('manual')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'manual' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}><Pencil size={14} /> Thủ công</button>
                <button onClick={() => setActiveTab('vault')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === 'vault' ? 'bg-white text-stone-900 shadow-sm ring-1 ring-stone-200' : 'text-stone-500 hover:text-stone-700'}`}>
                    <Diamond size={14} className={profile?.subscription_tier === 'promax' ? "text-amber-500 fill-amber-500" : "text-stone-400"} /> Brand Vault
                </button>
            </div>
            <button
                onClick={() => setShowHistory(!showHistory)}
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl transition-all active:scale-95 ${showHistory ? 'bg-stone-900 text-white shadow-md' : 'border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:bg-stone-50'}`}
            >
                <History size={18} strokeWidth={2} />
            </button>
        </div>
      </FeatureHeader>

      <div className="flex-1 grid overflow-hidden p-6 gap-6" style={{ gridTemplateColumns: showHistory ? '300px 450px 1fr' : '450px 1fr' }}>
          {showHistory && (
              <div className={`${cardClass} overflow-y-auto p-4 space-y-3 bg-stone-50/30`}>
                  <h3 className="text-xs font-bold uppercase text-stone-400 mb-4 tracking-widest px-2">Lịch sử nội dung</h3>
                  {history.map(h => <div key={h.id} className="p-4 rounded-2xl border border-stone-100 bg-white hover:border-stone-300 cursor-pointer transition-all shadow-sm"><p className="text-sm font-medium text-stone-900 line-clamp-2">{h.originalContent}</p><p className="text-[10px] text-stone-400 mt-2">{new Date(h.timestamp).toLocaleDateString()}</p></div>)}
              </div>
          )}

          <div className={`${cardClass} overflow-y-auto p-8 space-y-8`}>
              {activeTab === 'vault' && profile?.subscription_tier !== 'promax' ? (
                  <div className="p-8 rounded-3xl border border-stone-200 bg-stone-50/50 text-center space-y-6">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm"><Diamond size={32} /></div>
                      <h2 className="text-xl font-medium">Brand-Aware Content</h2>
                      <p className="text-sm text-stone-500 leading-relaxed">Nâng cấp Pro Max để AI viết bài dựa trên Persona thực tế và Brand DNA của bạn từ Vault, tăng tỷ lệ chuyển đổi gấp 3 lần.</p>
                      <button className="w-full py-4 bg-stone-900 text-white rounded-2xl font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2">Mở khóa Pro Max <ChevronRight size={18} /></button>
                  </div>
              ) : (
                  <>
                      {activeTab === 'vault' && <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-2 block">Thương hiệu</label><BrandSelector /></div>}
                      {activeTab === 'manual' && <div className="space-y-4"><div><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Tên thương hiệu</label><input className={inputClass} value={manualBrandName} onChange={e => setManualBrandName(e.target.value)} /></div><div><label className="text-[10px] font-bold uppercase text-stone-400 mb-1 block">Giọng văn & Đối tượng</label><input className={inputClass} value={manualTone} onChange={e => setManualTone(e.target.value)} /></div></div>}
                      <div className="pt-4 border-t border-stone-100"><label className="text-[10px] font-bold uppercase text-stone-400 mb-2 block">Nội dung / Ý tưởng gốc</label><textarea className={`${inputClass} min-h-[160px]`} value={sampleContent} onChange={e => setSampleContent(e.target.value)} placeholder="Nhập bài viết gốc hoặc ý tưởng của bạn..." /></div>
                      <div><label className="text-[10px] font-bold uppercase text-stone-400 mb-3 block">Nền tảng đích</label><div className="grid grid-cols-2 gap-2">{PLATFORMS.map(p => <button key={p.id} onClick={() => setSelectedPlatforms(prev => prev.includes(p.id) ? prev.filter(x => x !== p.id) : [...prev, p.id])} className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium transition-all ${selectedPlatforms.includes(p.id) ? 'bg-stone-900 text-white border-stone-900' : 'bg-white text-stone-600 border-stone-200'}`}>{<p.icon size={16} />}{p.label}</button>)}</div></div>
                      <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-4 bg-stone-900 text-white rounded-full font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2">{isGenerating ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={20} /> Viết Content Ngay</>}</button>
                  </>
              )}
          </div>

          <div className={`${cardClass} overflow-y-auto p-8`}>
              <h3 className="text-xs font-bold uppercase text-stone-400 mb-6 tracking-widest">Nội dung tối ưu</h3>
              {Object.keys(results).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-stone-300 opacity-50"><PenTool size={48} className="mb-4" /><p className="text-sm">Kết quả sẽ hiển thị tại đây</p></div>
              ) : (
                  <div className="space-y-6">
                      {PLATFORMS.map(p => {
                          const content = results[p.id];
                          if (!content) return null;
                          return (
                              <div key={p.id} className="rounded-2xl border border-stone-100 bg-stone-50/30 p-6 space-y-4">
                                  <div className="flex justify-between items-center"><div className="flex items-center gap-2 text-sm font-bold text-stone-900">{<p.icon size={16} />}{p.label}</div><button onClick={() => {navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content)); setToast({message: 'Đã copy', type: 'success'})}} className="p-2 bg-white rounded-lg border border-stone-200 shadow-sm"><Copy size={14} /></button></div>
                                  <div className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{typeof content === 'string' ? content : (content.paragraph || JSON.stringify(content))}</div>
                              </div>
                          );
                      })}
                  </div>
              )}
          </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default ContentGenerator;
