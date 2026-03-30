import { GoogleGenAI } from '@google/genai';

const apiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();

export const isGeminiConfigured = Boolean(apiKey);

let client: GoogleGenAI | null = null;

/** Returns a shared client, or null if VITE_GEMINI_API_KEY is missing. */
export function getGeminiClient(): GoogleGenAI | null {
    if (!apiKey) return null;
    if (!client) client = new GoogleGenAI({ apiKey });
    return client;
}
