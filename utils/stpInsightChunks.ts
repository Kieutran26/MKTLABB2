export type StpStrategyChunk = { type: 'paragraph'; content: string } | { type: 'evidence'; content: string };

const DAN_CHUNG_START = /\(\s*Dẫn chứng\s*:/i;

/** Bỏ tiền tố (Dẫn chứng: …) và ngoặc đóng khi hiển thị riêng cột “Dẫn chứng”. */
export function stripEvidenceWrapper(raw: string): string {
    let s = raw.trim();
    if (DAN_CHUNG_START.test(s) && s.endsWith(')')) {
        s = s.replace(DAN_CHUNG_START, '').replace(/\)\s*$/, '').trim();
    }
    return s;
}

/**
 * Tách phần chính và khối (Dẫn chứng: …); phần chính dài thì tách thêm theo câu (. )
 * để xuống dòng dễ đọc.
 */
export function parseStpStrategyBodyChunks(text: string): StpStrategyChunk[] {
    const t = (text ?? '').trim();
    if (!t) return [];

    let mainPart = t;
    let evidenceRaw: string | null = null;

    let lastDc = -1;
    for (const m of t.matchAll(/\(\s*Dẫn chứng\s*:/gi)) {
        lastDc = m.index ?? -1;
    }
    if (lastDc >= 0) {
        mainPart = t.slice(0, lastDc).trim();
        evidenceRaw = t.slice(lastDc).trim();
    }

    const chunks: StpStrategyChunk[] = [];
    for (const p of splitMainIntoParagraphs(mainPart)) {
        chunks.push({ type: 'paragraph', content: p });
    }
    if (evidenceRaw) {
        chunks.push({ type: 'evidence', content: stripEvidenceWrapper(evidenceRaw) });
    }
    return chunks;
}

function splitMainIntoParagraphs(main: string): string[] {
    const m = main.trim();
    if (!m) return [];
    if (m.length < 200) return [m];

    const pieces = m
        .split(/\.\s+/)
        .map((x) => x.trim())
        .filter(Boolean);
    if (pieces.length < 2) return [m];

    return pieces.map((p, i) => (i < pieces.length - 1 ? `${p}.` : p));
}
