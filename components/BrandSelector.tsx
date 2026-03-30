import React, { useState } from 'react';
import { useBrand } from "./BrandContext";
import { ChevronDown, Check, ShieldCheck, Plus } from 'lucide-react';

const BrandSelector: React.FC<{ onViewChange?: (view: any) => void }> = ({ onViewChange }) => {
    const { brands, currentBrand, switchBrand } = useBrand();
    const [isOpen, setIsOpen] = useState(false);

    if (brands.length === 0) return null;

    return (
        <div className="relative z-50">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-sm px-3 py-1.5 rounded-xl transition-all"
            >
                <div className="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 overflow-hidden flex items-center justify-center">
                    {currentBrand?.identity.logoMain ? (
                        <img src={currentBrand.identity.logoMain} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                        <ShieldCheck size={14} className="text-indigo-600" />
                    )}
                </div>
                <span className="text-sm font-bold text-slate-700 max-w-[120px] truncate">
                    {currentBrand?.identity.name || 'Chọn Thương hiệu'}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Chuyển đổi thương hiệu
                        </div>
                        <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                            {brands.map(brand => (
                                <button
                                    key={brand.id}
                                    onClick={() => { switchBrand(brand.id); setIsOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors ${brand.id === currentBrand?.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                                        {brand.identity.logoMain ? (
                                            <img src={brand.identity.logoMain} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <ShieldCheck size={16} className="text-slate-400" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-sm truncate">{brand.identity.name}</div>
                                    </div>
                                    {brand.id === currentBrand?.id && <Check size={16} className="text-indigo-600" />}
                                </button>
                            ))}
                        </div>
                        <div className="border-t border-slate-100 mt-2 pt-2">
                            <button 
                                onClick={() => { if(onViewChange) onViewChange('BRAND_VAULT'); setIsOpen(false); }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                            >
                                <Plus size={16} /> Quản lý Vault
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default BrandSelector;