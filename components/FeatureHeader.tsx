import React from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureHeaderProps {
    icon: LucideIcon;
    eyebrow: string;
    title: string;
    subline: string;
    children?: React.ReactNode;
    /** Override horizontal padding (default px-8) for edge-to-edge layouts */
    className?: string;
}

const FeatureHeader: React.FC<FeatureHeaderProps> = ({ 
    icon: Icon, 
    eyebrow, 
    title, 
    subline, 
    children,
    className,
}) => {
    return (
        <header
            className={`flex shrink-0 border-b border-stone-200/70 bg-[#FCFDFC] py-6 items-center justify-between ${className ?? 'px-8'}`}
        >
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-stone-400">
                    <Icon size={14} strokeWidth={1.5} />
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em]">{eyebrow}</span>
                </div>
                <h2 className="text-2xl font-semibold text-stone-900 tracking-tight leading-tight">{title}</h2>
                <p className="text-xs text-stone-400 font-medium mt-1">{subline}</p>
            </div>

            <div className="flex items-center gap-4">
                {children}
            </div>
        </header>
    );
};

export default FeatureHeader;
