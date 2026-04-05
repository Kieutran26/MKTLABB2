/**
 * Feature workspace toolbar — design source: IMC Planner (Thủ công / Brand Vault / Lịch sử / CTA).
 * Keep class strings identical when updating IMC; import here everywhere else.
 */

export const WS_SEGMENT_SHELL =
    'inline-flex gap-1 rounded-2xl border border-stone-200 bg-stone-50/30 p-1 shadow-sm';

const WS_TAB_BASE =
    'flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all';

/** Active / inactive tab inside the segmented control */
export function wsWorkspaceTabClass(active: boolean): string {
    return active
        ? `${WS_TAB_BASE} bg-white text-stone-900 shadow-sm ring-1 ring-stone-900/5`
        : `${WS_TAB_BASE} text-stone-400 hover:text-stone-600`;
}

const WS_HISTORY_BASE =
    'inline-flex size-10 shrink-0 items-center justify-center rounded-full transition-all';

/** History / panel toggle (circle): active = dark fill, inactive = white + border */
export function wsHistoryToggleClass(active: boolean): string {
    return active
        ? `${WS_HISTORY_BASE} bg-stone-900 text-white shadow-md`
        : `${WS_HISTORY_BASE} border border-stone-200 bg-white text-stone-600 shadow-sm hover:bg-stone-50`;
}

/** Icon-only save (circle), same footprint as history */
export const WS_SAVE_ICON_BTN =
    'inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 shadow-sm transition-all hover:bg-stone-50 active:scale-95 disabled:pointer-events-none disabled:opacity-50';

/** Primary header CTA — fixed width to match IMC “Tạo kế hoạch” */
export const WS_PRIMARY_CTA =
    'flex h-10 w-[161.648px] items-center justify-center gap-2 rounded-full bg-stone-950 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-95';

/** Same visual as WS_PRIMARY_CTA but allows wider label (e.g. “Thêm Persona”) */
export const WS_PRIMARY_CTA_AUTO =
    'flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-stone-950 px-5 text-sm font-medium text-white shadow-md transition-all hover:bg-stone-800 active:scale-95';
