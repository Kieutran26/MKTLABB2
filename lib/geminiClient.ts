type GenerateContentParams = {
    model?: string;
    plan?: 'free' | 'pro' | 'promax';
    feature?: string;
    taskType?: string;
    contents: any;
    config?: {
        systemInstruction?: string;
        responseMimeType?: string;
        temperature?: number;
        maxOutputTokens?: number;
        safetySettings?: any[];
    };
};

type GenerateContentResult = {
    text: string;
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
    usageMetadata: Record<string, never>;
};

type OpenAICompatibleClient = {
    models: {
        generateContent: (params: GenerateContentParams) => Promise<GenerateContentResult>;
    };
};

const backendBaseUrl =
    (typeof import.meta.env.VITE_BACKEND_URL === 'string' && import.meta.env.VITE_BACKEND_URL.trim()) ||
    (typeof window !== 'undefined' && window.location?.origin) ||
    'http://localhost:3011';

export const isGeminiConfigured = true;

let client: OpenAICompatibleClient | null = null;

export function getGeminiClient(): OpenAICompatibleClient {
    if (client) return client;

    client = {
        models: {
            generateContent: async (params: GenerateContentParams) => {
                const contents =
                    typeof params.contents === 'string'
                        ? [{ parts: [{ text: params.contents }] }]
                        : Array.isArray(params.contents)
                            ? params.contents
                            : [params.contents];

                const requestBody = {
                    contents,
                    generationConfig: {
                        temperature: params.config?.temperature ?? 0.7,
                        ...(params.config?.responseMimeType
                            ? { response_mime_type: params.config.responseMimeType }
                            : {}),
                        ...(typeof params.config?.maxOutputTokens === 'number'
                            ? { maxOutputTokens: params.config.maxOutputTokens }
                            : {}),
                    },
                    ...(params.config?.systemInstruction
                        ? {
                              systemInstruction: {
                                  parts: [{ text: params.config.systemInstruction }],
                              },
                          }
                        : {}),
                };

                const response = await fetch(`${backendBaseUrl}/api/openai/generate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        requestBody,
                        preferredModel: params.model,
                        plan: params.plan,
                        feature: params.feature,
                        taskType: params.taskType,
                    }),
                });

                const raw = await response.text();
                let payload: any = null;
                try {
                    payload = raw ? JSON.parse(raw) : null;
                } catch {
                    payload = null;
                }

                if (!payload) {
                    throw new Error(
                        `AI proxy returned an invalid response (status ${response.status}). ` +
                        `Expected JSON but received ${raw ? 'non-JSON content' : 'an empty body'}.`
                    );
                }

                if (!response.ok) {
                    throw new Error(
                        payload?.details?.error?.message ||
                            payload?.instruction ||
                            payload?.error ||
                            'OpenAI request failed.'
                    );
                }

                const text = typeof payload?.text === 'string' ? payload.text : '';
                return {
                    text,
                    candidates: [{ content: { parts: [{ text }] } }],
                    usageMetadata: {},
                };
            },
        },
    };

    return client;
}
