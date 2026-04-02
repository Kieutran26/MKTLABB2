import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ToastContextType {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    // Return mock functions if not in provider
    return {
      showToast: () => { },
      success: () => { },
      error: () => { },
      warning: () => { },
      info: () => { },
      showConfirm: async () => false
    };
  }
  return context;
};

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300);
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      iconColor: 'text-emerald-500',
      titleColor: 'text-emerald-800',
      textColor: 'text-emerald-600'
    },
    error: {
      icon: XCircle,
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      iconColor: 'text-rose-500',
      titleColor: 'text-rose-800',
      textColor: 'text-rose-600'
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      iconColor: 'text-amber-500',
      titleColor: 'text-amber-800',
      textColor: 'text-amber-600'
    },
    info: {
      icon: Info,
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      iconColor: 'text-blue-500',
      titleColor: 'text-blue-800',
      textColor: 'text-blue-600'
    }
  };

  const c = config[toast.type];
  const Icon = c.icon;

  return (
    <div
      className={`
                flex items-start gap-3 p-4 rounded-xl border shadow-sm
                ${c.bg} ${c.border}
                transition-all duration-300 ease-out
                ${isExiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
            `}
      style={{ minWidth: '320px', maxWidth: '420px' }}
    >
      <Icon size={20} className={`${c.iconColor} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${c.titleColor}`}>{toast.title}</div>
        {toast.message && (
          <div className={`text-sm mt-0.5 ${c.textColor}`}>{toast.message}</div>
        )}
      </div>
      <button
        onClick={() => { setIsExiting(true); setTimeout(onClose, 300); }}
        className={`${c.iconColor} hover:opacity-70 transition-opacity`}
      >
        <X size={18} />
      </button>
    </div>
  );
};

// Confirm Modal Component
const ConfirmModal: React.FC<{
  options: ConfirmOptions;
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ options, onConfirm, onCancel }) => {
  const typeColors = {
    danger: { bg: 'bg-red-500 hover:bg-red-600', iconBg: 'bg-red-50', icon: 'text-red-500' },
    warning: { bg: 'bg-amber-500 hover:bg-amber-600', iconBg: 'bg-amber-50', icon: 'text-amber-500' },
    info: { bg: 'bg-blue-500 hover:bg-blue-600', iconBg: 'bg-blue-50', icon: 'text-blue-500' }
  };

  const colors = typeColors[options.type || 'info'];

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-[scale-in_0.2s_ease-out]">
        <div className="p-6">
          <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center mb-4`}>
            {options.type === 'danger' ? (
              <AlertTriangle size={24} className={colors.icon} />
            ) : options.type === 'warning' ? (
              <AlertTriangle size={24} className={colors.icon} />
            ) : (
              <Info size={24} className={colors.icon} />
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{options.title}</h3>
          <p className="text-gray-500 text-sm leading-relaxed">{options.message}</p>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            {options.cancelText || 'Hủy'}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-colors ${colors.bg}`}
          >
            {options.confirmText || 'Xác nhận'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<{
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const success = useCallback((title: string, message?: string) => {
    showToast({ type: 'success', title, message });
  }, [showToast]);

  const error = useCallback((title: string, message?: string) => {
    showToast({ type: 'error', title, message });
  }, [showToast]);

  const warning = useCallback((title: string, message?: string) => {
    showToast({ type: 'warning', title, message });
  }, [showToast]);

  const info = useCallback((title: string, message?: string) => {
    showToast({ type: 'info', title, message });
  }, [showToast]);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    confirmState?.resolve(true);
    setConfirmState(null);
  };

  const handleCancel = () => {
    confirmState?.resolve(false);
    setConfirmState(null);
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, showConfirm }}>
      {children}

      {/* Toast Container */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3">
        {toasts.map(toast => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {/* Confirm Modal */}
      {confirmState && (
        <ConfirmModal
          options={confirmState.options}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ToastContext.Provider>
  );
};

// Simple standalone toast for backward compatibility
interface SimpleToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

export const Toast: React.FC<SimpleToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const config = {
    success: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', Icon: CheckCircle },
    error: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-800', Icon: XCircle },
    warning: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', Icon: AlertTriangle },
    info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', Icon: Info }
  };

  const c = config[type];

  return (
    <div className={`fixed bottom-6 right-6 p-4 rounded-xl border shadow-lg flex items-center gap-3 z-50 ${c.bg} ${c.border} ${c.text}`}>
      <c.Icon size={20} />
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full">
        <X size={16} />
      </button>
    </div>
  );
};