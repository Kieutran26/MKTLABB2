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
        <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-semibold tracking-tight text-stone-900">{title}</span>
            {required && (
                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-rose-700 ring-1 ring-rose-100">
                    Bắt buộc
                </span>
            )}
            {optional && (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-100">
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

            {headerMeta && <span className="text-[10px] font-medium text-stone-400">{headerMeta}</span>}
        </div>
        <div className="relative">
            {children}
        </div>
    </div>
);
