import React from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ 
  isOpen, title, message, onConfirm, onCancel, isDestructive 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-100 animate-in fade-in zoom-in">
        <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-slate-800">{title}</h3>
            <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <p className="text-slate-600 mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3">
            <button 
                onClick={onCancel} 
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-bold hover:bg-slate-50 transition-colors"
            >
                Hủy
            </button>
            <button 
                onClick={onConfirm} 
                className={`flex-1 py-2.5 rounded-xl text-white font-bold transition-colors shadow-sm ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
            >
                Xác nhận
            </button>
        </div>
      </div>
    </div>
  );
};