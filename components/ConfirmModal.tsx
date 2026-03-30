import React, { useState, createContext, useContext, useCallback } from 'react';
import { AlertTriangle, HelpCircle, Info, X, Send, Trash2 } from 'lucide-react';

type ConfirmType = 'danger' | 'warning' | 'info' | 'send';

interface ConfirmOptions {
    title: string;
    message: string;
    type?: ConfirmType;
    confirmText?: string;
    cancelText?: string;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export const useConfirm = () => {
    const context = useContext(ConfirmContext);
    if (!context) {
        // Fallback to browser confirm if not in provider
        return {
            confirm: (options: ConfirmOptions) => Promise.resolve(window.confirm(options.message))
        };
    }
    return context;
};

interface ModalState extends ConfirmOptions {
    resolve: (value: boolean) => void;
}

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [modal, setModal] = useState<ModalState | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setModal({ ...options, resolve });
        });
    }, []);

    const handleConfirm = () => {
        modal?.resolve(true);
        setModal(null);
    };

    const handleCancel = () => {
        modal?.resolve(false);
        setModal(null);
    };

    const config = {
        danger: {
            icon: Trash2,
            iconBg: 'bg-rose-100',
            iconColor: 'text-rose-600',
            confirmBg: 'bg-rose-500 hover:bg-rose-600',
            confirmText: 'text-white'
        },
        warning: {
            icon: AlertTriangle,
            iconBg: 'bg-amber-100',
            iconColor: 'text-amber-600',
            confirmBg: 'bg-amber-500 hover:bg-amber-600',
            confirmText: 'text-white'
        },
        info: {
            icon: HelpCircle,
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            confirmBg: 'bg-blue-500 hover:bg-blue-600',
            confirmText: 'text-white'
        },
        send: {
            icon: Send,
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
            confirmBg: 'bg-indigo-500 hover:bg-indigo-600',
            confirmText: 'text-white'
        }
    };

    const c = modal ? config[modal.type || 'info'] : config.info;
    const Icon = c.icon;

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}

            {/* Confirm Modal */}
            {modal && (
                <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 pb-4">
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center shrink-0`}>
                                    <Icon size={24} className={c.iconColor} />
                                </div>
                                <div className="flex-1 pt-1">
                                    <h3 className="font-semibold text-gray-900 text-lg">{modal.title}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{modal.message}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 p-4 pt-2 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={handleCancel}
                                className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                            >
                                {modal.cancelText || 'Huỷ'}
                            </button>
                            <button
                                onClick={handleConfirm}
                                className={`flex-1 py-2.5 px-4 rounded-xl font-medium transition-colors ${c.confirmBg} ${c.confirmText}`}
                            >
                                {modal.confirmText || 'Xác nhận'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ConfirmContext.Provider>
    );
};
