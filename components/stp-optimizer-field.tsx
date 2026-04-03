import React from 'react';
import { Diamond } from 'lucide-react';
import { EditorialFieldHint } from './mastermind-editorial-field-hint';

export type StpOptimizerBadge = 'required' | 'important';

export type StpOptimizerFieldProps = {
    title: string;
    badge: StpOptimizerBadge;
    /** Mô tả ngắn dưới tiêu đề */
    subtitle: string;
    /** Hướng dẫn nhập (tuỳ chọn) */
    guideline?: string;
    /** Dòng ví dụ VD: … */
    example: string;
    /** Nội dung bổ sung cho popover ? */
    hintExtra?: string;
    children: React.ReactNode;
    /** Chiếm full width trong grid 2 cột */
    fullWidth?: boolean;
    className?: string;
};

/**
 * Trường form STP Optimizer — đồng bộ typography/spacing với ImcPlannerEditorialField + mô tả/guideline/VD hiển thị sẵn.
 */
export const StpOptimizerField: React.FC<StpOptimizerFieldProps> = ({
    title,
    badge,
    subtitle,
    guideline,
    example,
    hintExtra,
    children,
    fullWidth,
    className = '',
}) => (
    <div className={`${fullWidth ? 'md:col-span-2' : ''} ${className}`}>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-950">{title}</span>
            {badge === 'required' && (
                <span className="rounded bg-rose-50 px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide text-rose-600 ring-1 ring-rose-100/80">
                    Bắt buộc
                </span>
            )}
            {badge === 'important' && (
                <span className="rounded bg-amber-50 px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100/80">
                    Tùy chọn
                </span>
            )}
            <EditorialFieldHint title="Gợi ý" anchor="label">
                <div className="space-y-2">
                    <p>{subtitle}</p>
                    {guideline && <p className="text-stone-600">{guideline}</p>}
                    {hintExtra && <p className="border-t border-stone-100 pt-2 text-[11px] text-stone-500">{hintExtra}</p>}
                    <p className="border-t border-stone-100 pt-2 text-[11px] italic text-stone-500">{example}</p>
                </div>
            </EditorialFieldHint>
        </div>
        <div className="relative mt-0.5">{children}</div>
    </div>
);
