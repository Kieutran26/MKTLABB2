/**
 * Anthropic Claude API Service (Fallback for Gemini)
 * Gọi thẳng Anthropic API — không qua proxy server local
 */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
// FIX: Gọi thẳng Anthropic API thay vì proxy localhost:3001
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export interface ClaudeOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemInstruction?: string;
}

/**
 * Calls the Anthropic Claude Messages API directly.
 * This is used as a high-reliability fallback when Gemini is rate-limited.
 */
export async function callClaudeAPI(
    prompt: string,
    options: ClaudeOptions = {}
): Promise<string> {
    if (!ANTHROPIC_API_KEY) {
        throw new Error('VITE_ANTHROPIC_API_KEY is not configured. Please add it to your .env.local file.');
    }

    const {
        model = 'claude-3-5-sonnet-latest',
        temperature = 0.7,
        maxTokens = 8192,
        systemInstruction
    } = options;

    try {
        console.warn(`[Claude Fallback] Using model: ${model}`);

        const body: any = {
            model,
            max_tokens: maxTokens,
            temperature,
            messages: [
                { role: 'user', content: prompt }
            ]
        };

        if (systemInstruction) {
            body.system = systemInstruction;
        }

        const response = await fetch(ANTHROPIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': ANTHROPIC_API_KEY,
                'anthropic-version': ANTHROPIC_VERSION,
                // Cho phép gọi từ browser
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify(body)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Claude API Error Details:', data);
            throw new Error(`Claude API Error (${response.status}): ${data.error?.message || JSON.stringify(data)}`);
        }

        const text = data.content?.[0]?.text;
        if (!text) {
            throw new Error('No text returned from Claude API');
        }

        return text;
    } catch (error: any) {
        console.error('❌ Claude API Failure:', error);
        throw error;
    }
}

/**
 * Enhanced Claude caller that handles object-based contents (similar to Gemini SDK format)
 */
export async function callClaudeWithParams(params: {
    model?: string;
    contents: any;
    config?: any;
}): Promise<string> {
    const { contents, config, model } = params;

    // Extract prompt text from contents (Gemini format)
    let promptText = '';
    if (typeof contents === 'string') {
        promptText = contents;
    } else {
        const parts = Array.isArray(contents) ? contents[0]?.parts : contents?.parts;
        promptText = Array.isArray(parts) ? parts.map((p: any) => p.text || '').join('\n') : (parts?.text || '');
    }

    return callClaudeAPI(promptText, {
        model: model?.includes('claude') ? model : 'claude-3-5-sonnet-latest',
        temperature: config?.temperature,
        maxTokens: config?.maxOutputTokens,
        systemInstruction: config?.systemInstruction
    });
}