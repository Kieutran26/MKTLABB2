import React, { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

type PortalPlacement = {
    left: number;
    top: number;
    width: number;
    transform: string;
};

/**
 * Minimal "?" hint — popover rendered in a portal so parent overflow-hidden never clips it.
 */
export const EditorialFieldHint: React.FC<EditorialFieldHintProps> = ({
    title,
    children,
    anchor = 'input',
    popoverAlign = 'left',
}) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const panelResizeObserverRef = useRef<ResizeObserver | null>(null);
    const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hintId = useId();
    const [placement, setPlacement] = useState<PortalPlacement | null>(null);

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

    const updatePlacement = useCallback(() => {
        const trigger = wrapRef.current;
        if (!open || !trigger || typeof window === 'undefined') {
            setPlacement(null);
            return;
        }
        const rect = trigger.getBoundingClientRect();
        const margin = 8;
        const panelW = Math.min(300, window.innerWidth - margin * 2);
        let left: number;
        if (anchor === 'label' && popoverAlign === 'right') {
            left = Math.max(margin, Math.min(rect.right - panelW, window.innerWidth - panelW - margin));
        } else if (anchor === 'label') {
            left = Math.max(margin, Math.min(rect.left, window.innerWidth - panelW - margin));
        } else {
            left = Math.max(margin, Math.min(rect.right - panelW, window.innerWidth - panelW - margin));
        }
        const gap = 6;
        const panelH = panelRef.current?.offsetHeight ?? 200;
        const spaceAbove = rect.top - margin;
        let top: number;
        let transform: string;
        if (spaceAbove >= panelH + gap) {
            top = rect.top - gap;
            transform = 'translateY(-100%)';
        } else {
            top = rect.bottom + gap;
            transform = 'none';
        }
        setPlacement({ left, top, width: panelW, transform });
    }, [open, anchor, popoverAlign]);

    const setPanelEl = useCallback(
        (node: HTMLDivElement | null) => {
            panelResizeObserverRef.current?.disconnect();
            panelResizeObserverRef.current = null;
            panelRef.current = node;
            if (!node) return;
            if (!open) return;
            const ro = new ResizeObserver(() => updatePlacement());
            ro.observe(node);
            panelResizeObserverRef.current = ro;
            queueMicrotask(() => updatePlacement());
        },
        [open, updatePlacement]
    );

    useLayoutEffect(() => {
        if (!open) {
            setPlacement(null);
            return;
        }
        updatePlacement();
        window.addEventListener('scroll', updatePlacement, true);
        window.addEventListener('resize', updatePlacement);
        return () => {
            window.removeEventListener('scroll', updatePlacement, true);
            window.removeEventListener('resize', updatePlacement);
        };
    }, [open, updatePlacement]);

    useEffect(
        () => () => {
            panelResizeObserverRef.current?.disconnect();
            panelResizeObserverRef.current = null;
        },
        []
    );

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            const t = e.target as Node;
            if (wrapRef.current?.contains(t)) return;
            if (panelRef.current?.contains(t)) return;
            close();
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

    const panelInner = (
        <>
            <div className="mb-3 border-t-2 border-stone-900 pt-3">
                <p className="font-sans text-[9px] font-semibold uppercase tracking-[0.22em] text-stone-400">
                    {title}
                </p>
            </div>
            <div className="font-serif text-[13px] leading-[1.65] text-stone-700">{children}</div>
        </>
    );

    const portalPanel =
        open &&
        placement &&
        typeof document !== 'undefined' &&
        createPortal(
            <div
                ref={setPanelEl}
                id={hintId}
                role="tooltip"
                style={{
                    position: 'fixed',
                    left: placement.left,
                    top: placement.top,
                    width: placement.width,
                    transform: placement.transform,
                    zIndex: 99999,
                }}
                className={popoverClass}
                onMouseEnter={() => {
                    cancelClose();
                    setOpen(true);
                }}
                onMouseLeave={scheduleClose}
            >
                {panelInner}
            </div>,
            document.body
        );

    if (anchor === 'label') {
        return (
            <>
                <div ref={wrapRef} className="relative z-20 inline-flex shrink-0 items-center align-middle">
                    {button}
                </div>
                {portalPanel}
            </>
        );
    }

    return (
        <>
            <div ref={wrapRef} className={`absolute z-20 ${insetPosition}`}>
                {button}
            </div>
            {portalPanel}
        </>
    );
};
