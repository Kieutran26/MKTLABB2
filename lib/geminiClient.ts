import { GoogleGenAI } from '@google/genai';

function sanitizeGeminiKey(raw: unknown): string {
    if (raw == null) return '';
    let s = String(raw)
        .replace(/^\uFEFF/, '')
        .replace(/\u200B/g, '')
        .trim();
    if (
        (s.startsWith('"') && s.endsWith('"')) ||
        (s.startsWith("'") && s.endsWith("'"))
    ) {
        s = s.slice(1, -1).trim();
    }
    return s;
}

const apiKey = sanitizeGeminiKey(
    import.meta.env.VITE_GEMINI_API_KEY ??
        (import.meta.env as { GEMINI_API_KEY?: string }).GEMINI_API_KEY
);

export const isGeminiConfigured = Boolean(apiKey);

let client: GoogleGenAI | null = null;

/** Returns a shared client, or null if VITE_GEMINI_API_KEY is missing. */
export function getGeminiClient(): GoogleGenAI | null {
    if (!apiKey) return null;
    if (!client) client = new GoogleGenAI({ apiKey });
    return client;
}
