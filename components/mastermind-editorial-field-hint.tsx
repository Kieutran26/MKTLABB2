import React, { useCallback, useEffect, useId, useRef, useState } from 'react';

const HOVER_CLOSE_MS = 120;

export type EditorialFieldHintProps = {
    title: string;
    children: React.ReactNode;
    /** 'input' = inside field, centered; 'textarea' = top-right; 'label' = inline after title */
    anchor?: 'input' | 'textarea' | 'label';
    /** Where the popover anchors horizontally when anchor is 'label' */
    popoverAlign?: 'left' | 'right';
};

const popoverClass =
    'w-[min(100vw-2rem,300px)] border border-stone-200 bg-white px-5 py-4 text-left shadow-[0_12px_40px_-12px_rgba(28,25,23,0.18)] before:absolute before:left-0 before:right-0 before:top-full before:h-2 before:content-[\'\']';

/**
 * Minimal "?" hint for Mastermind — Editorial Minimalism popover.
 */
export const EditorialFieldHint: React.FC<EditorialFieldHintProps> = ({
    title,
    children,
    anchor = 'input',
    popoverAlign = 'left',
}) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hintId = useId();

    const close = useCallback(() => setOpen(false), []);

    const scheduleClose = useCallback(() => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_MS);
    }, []);

    const cancelClose = useCallback(() => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
            closeTimer.current = null;
        }
    }, []);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open, close]);

    useEffect(() => () => cancelClose(), [cancelClose]);

    const insetPosition =
        anchor === 'textarea'
            ? 'right-2 top-2.5'
            : anchor === 'input'
              ? 'right-2 top-1/2 -translate-y-1/2'
              : '';

    const popoverPosition =
        anchor === 'label'
            ? popoverAlign === 'right'
              ? 'bottom-[calc(100%+4px)] right-0'
              : 'bottom-[calc(100%+4px)] left-0'
            : 'bottom-[calc(100%+4px)] right-0';

    const button = (
        <button
            type="button"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-stone-300 bg-white/90 text-[11px] font-serif font-medium leading-none text-stone-500 shadow-sm transition-colors hover:border-stone-800 hover:text-stone-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-stone-900"
            aria-expanded={open}
            aria-describedby={open ? hintId : undefined}
            onMouseEnter={() => {
                cancelClose();
                setOpen(true);
            }}
            onMouseLeave={scheduleClose}
            onClick={() => setOpen((v) => !v)}
            onKeyDown={(e) => {
                if (e.key === 'Escape') close();
            }}
        >
            ?
        </button>
    );

    const panel = open && (
        <div
            id={hintId}
            role="tooltip"
            className={`absolute z-50 ${popoverPosition} ${popoverClass}`}
            onMouseEnter={() => {
                cancelClose();
                setOpen(true);
            }}
            onMouseLeave={scheduleClose}
        >
            <div className="mb-3 border-t-2 border-stone-900 pt-3">
                <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                    {title}
                </p>
            </div>
            <div className="font-serif text-[13px] leading-[1.65] text-stone-700">{children}</div>
        </div>
    );

    if (anchor === 'label') {
        return (
            <div ref={wrapRef} className="relative z-20 inline-flex shrink-0 items-center align-middle">
                {button}
                {panel}
            </div>
        );
    }

    return (
        <div ref={wrapRef} className={`absolute z-20 ${insetPosition}`}>
            {button}
            {panel}
        </div>
    );
};
