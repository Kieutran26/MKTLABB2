import React from 'react';
import { EditorialFieldHint } from './mastermind-editorial-field-hint';

export type ImcPlannerEditorialFieldProps = {
    title: string;
    required?: boolean;
    optional?: boolean;
    /** Nhãn phụ bên phải tiêu đề (vd: số trường) */
    headerMeta?: string;
    /** Chữ nhỏ mô tả (tooltip popup) */
    hint: string;
    /** Ví dụ: hiển thị dưới hint trong popup */
    example?: string;
    children: React.ReactNode;
    className?: string;
};

/**
 * Trường form IMC Planner — Editorial Minimalism: title + badge + tooltip(?), control.
 */
export const ImcPlannerEditorialField: React.FC<ImcPlannerEditorialFieldProps> = ({
    title,
    required,
    optional,
    headerMeta,
    hint,
    example,
    children,
    className = '',
}) => (
    <div className={className}>
        <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-950">{title}</span>
            {required && (
                <span className="rounded bg-rose-50 px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide text-rose-600 ring-1 ring-rose-100/80">
                    Bắt buộc
                </span>
            )}
            {optional && (
                <span className="rounded bg-amber-50 px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100/80">
                    Tùy chọn
                </span>
            )}
            
            <EditorialFieldHint title="Gợi ý" anchor="label">
                <div className="space-y-2">
                    <p>{hint}</p>
                    {example && (
                        <p className="border-t border-stone-100 pt-2 text-[11px] italic text-stone-500">
                            {example}
                        </p>
                    )}
                </div>
            </EditorialFieldHint>

            {headerMeta && <span className="text-[9px] font-medium text-stone-400">{headerMeta}</span>}
        </div>
        <div className="relative mt-0.5">
            {children}
        </div>
    </div>
);
