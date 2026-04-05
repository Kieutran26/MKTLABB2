import { ContentPillar, AdsHealthInput, AdsHealthResult, BrandPositioningInput, BrandPositioningResult, PricingAnalyzerInput, PricingAnalyzerResult, AudienceEmotionMapInput, AudienceEmotionMapResult, StrategicSolution } from "../types";

// Direct REST API implementation (no SDK)
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

/** Ordered candidates for v1beta REST `generateContent` (unversioned 1.5 ids often 404 on newer keys). Override with VITE_GEMINI_REST_MODEL. */
function getGeminiRestModelCandidates(): string[] {
    const fromEnv =
        typeof import.meta.env.VITE_GEMINI_REST_MODEL === 'string'
            ? import.meta.env.VITE_GEMINI_REST_MODEL.trim()
            : '';
    const defaults = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-2.0-flash-001',
        'gemini-1.5-flash-002',
        'gemini-1.5-flash-001',
    ];
    const ordered = fromEnv ? [fromEnv, ...defaults.filter((m) => m !== fromEnv)] : defaults;
    return [...new Set(ordered)];
}

/** Preferred model id (metadata only; actual REST calls try candidates until one succeeds). */
const GEMINI_REST_MODEL = getGeminiRestModelCandidates()[0];

async function postGeminiGenerateContent(requestBody: unknown, errorPrefix: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY is not configured');
    }
    const candidates = getGeminiRestModelCandidates();
    let lastErrorText = '';
    let lastStatus = 404;

    for (const model of candidates) {
        const url = `${GEMINI_API_BASE}/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });
        const raw = await response.text();

        if (!response.ok) {
            if (response.status === 404) {
                lastStatus = 404;
                lastErrorText = raw;
                continue;
            }
            throw new Error(`${errorPrefix} (${response.status}): ${raw}`);
        }

        const data = JSON.parse(raw) as any;
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('No text returned from Gemini API');
        }
        return text;
    }

    throw new Error(`${errorPrefix} (${lastStatus}): ${lastErrorText || 'no model matched'}`);
}

// Helper function to call Gemini API directly
async function callGeminiAPI(
    prompt: string,
    systemInstruction?: string,
    options: { temperature?: number; jsonMode?: boolean; maxOutputTokens?: number } = {}
) {
    if (!GEMINI_API_KEY) {
        throw new Error('VITE_GEMINI_API_KEY is not configured');
    }

    // Build the request body
    const requestBody: any = {
        contents: [{
            parts: [{
                text: systemInstruction
                    ? `${systemInstruction}\n\n${prompt}`
                    : prompt
            }]
        }],
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ],
        generationConfig: {
            temperature: options.temperature ?? 0.7,
            ...(typeof options.maxOutputTokens === 'number' && options.maxOutputTokens > 0
                ? { maxOutputTokens: options.maxOutputTokens }
                : {})
        }
    };

    // Add JSON mode if requested
    if (options.jsonMode) {
        requestBody.generationConfig.responseMimeType = 'application/json';
    }

    try {
        return await postGeminiGenerateContent(requestBody, 'Gemini API Error');
    } catch (error: any) {
        console.error('❌ Gemini API Error:', error);
        throw error;
    }
}


// Helper for Vision API (Text + Image)
async function callGeminiVisionAPI(prompt: string, base64Data: string, mimeType: string) {
    if (!GEMINI_API_KEY) throw new Error('VITE_GEMINI_API_KEY is not configured');

    const requestBody = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: base64Data
                    }
                }
            ]
        }],
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ],
        generationConfig: { temperature: 0.4 }
    };

    try {
        return await postGeminiGenerateContent(requestBody, 'Gemini Vision API Error');
    } catch (error: any) {
        console.error('❌ Gemini Vision API Error:', error);
        throw error;
    }
}

// Helper for Multi-Image Vision API
async function callGeminiMultiImageAPI(prompt: string, images: { base64: string; mimeType: string }[]) {
    if (!GEMINI_API_KEY) throw new Error('VITE_GEMINI_API_KEY is not configured');

    const parts: any[] = [{ text: prompt }];

    // Add all images
    for (const img of images) {
        parts.push({
            inlineData: {
                mimeType: img.mimeType,
                data: img.base64
            }
        });
    }

    const requestBody = {
        contents: [{ parts }],
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ],
        generationConfig: { temperature: 0.4 }
    };

    try {
        return await postGeminiGenerateContent(requestBody, 'Gemini Multi-Vision API Error');
    } catch (error: any) {
        console.error('❌ Gemini Multi-Vision API Error:', error);
        throw error;
    }
}

export const analyzeImages = async (
    images: { base64: string; mimeType: string }[],
    promptText: string = "Describe these images briefly."
): Promise<string> => {
    try {
        return await callGeminiMultiImageAPI(promptText, images);
    } catch (error) {
        console.error("Gemini Multi-Image Analysis failed:", error);
        return "Failed to analyze images.";
    }
};

// Compatibility wrapper to maintain existing code structure
const ai = {
    models: {
        generateContent: async (params: any) => {
            const { contents, config } = params;

            // Call the direct API
            const text = await callGeminiAPI(
                contents,
                config?.systemInstruction,
                {
                    temperature: config?.temperature,
                    jsonMode: config?.responseMimeType === 'application/json',
                    maxOutputTokens: config?.maxOutputTokens
                }
            );

            // Return in expected format
            return {
                text: text,
                candidates: [{ content: { parts: [{ text }] } }],
                usageMetadata: {}
            };
        }
    }
};

// ... (SAFETY_SETTINGS omitted as it is used above or can be reused)
// ...

export const analyzeImage = async (
    base64Data: string,
    mimeType: string,
    promptText: string = "Describe this image in detail."
): Promise<string> => {
    try {
        return await callGeminiVisionAPI(promptText, base64Data, mimeType);
    } catch (error) {
        console.error("Gemini Image Analysis failed:", error);
        return "Failed to analyze image.";
    }
};

// NOTE: These settings are critical for local usage where default filters are stricter.
const SAFETY_SETTINGS = [
    { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
    { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
] as any; // Type assertion to bypass strict typing

export const translateText = async (text: string, from: 'en' | 'vi', to: 'en' | 'vi'): Promise<string> => {
    const sourceLang = from === 'en' ? 'English' : 'Vietnamese';
    const targetLang = to === 'en' ? 'English' : 'Vietnamese';

    const systemPrompt = `You are a professional translator. 
  Your task is to translate the user's text from ${sourceLang} to ${targetLang}.
IMPORTANT: Return ONLY the translated text.Do not add any explanations, notes, pronunciation guides, or extra punctuation that is not in the original text.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: text,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.1, // Low temperature for deterministic translations
                safetySettings: SAFETY_SETTINGS,
            },
        });

        return response.text?.trim() || "Translation error.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error: Could not translate. Check API Key.";
    }
};

export const generateMultiPlatformContent = async (
    sampleContent: string,
    platforms: string[]
): Promise<Record<string, any>> => {
    if (!sampleContent.trim() || platforms.length === 0) return {};

    const systemPrompt = `You are an expert social media content creator and SEO specialist.
  Your task is to take the provided "Sample Content" and rewrite / optimize it for each of the requested platforms.
  
  **CRITICAL: ALL GENERATED CONTENT MUST BE IN VIETNAMESE LANGUAGE.**
  
  Guidelines per platform:
- Facebook: Engaging, conversational, encourage sharing / comments. Use moderate emojis.
- Instagram: Visual storytelling, concise caption + hashtags. Emoji heavy.
- LinkedIn: Professional tone, thought leadership, value-driven. Minimal emojis.
- Threads: Casual, conversational, under 500 chars. Some emojis.
- TikTok: Trendy, hook-first, call-outs. High energy. Emojis + slang OK.
- SEO Web: Return a JSON object with {title_tag, meta_description, paragraph} optimized for search engines.

  Output Format: JSON object mapping platform name to its optimized content string (or object for SEO).
  Example: { "facebook": "...", "instagram": "...", "linkedin": "...", "seo": {...} }
  
  **IMPORTANT: Generate ALL content in VIETNAMESE. Do not use English.**`;

    const prompt = `Sample Content / Topic:\n"${sampleContent}"\n\nPlatforms requested: ${platforms.join(', ')}\n\nGenerate optimized content for each platform IN VIETNAMESE.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Gemini Content Gen Error:", error);
        return {};
    }
};

export const generateKeyVisual = async (
    params: {
        description: string;
        style: string;
        aspectRatio: string;
        numberOfImages: number;

        // New Fields
        concept?: string;
        mood?: string;
        referenceImage?: string;
        productAssets?: string[];
        placementInstructions?: string;

        mainHeading?: string;
        mainHeadingStyle?: string;
        mainHeadingEffect?: string;
        subHeading?: string;
        subHeadingEffect?: string;
        contentText?: string;
        contentTextEffect?: string;
        cta?: string;
        ctaEffect?: string;

        productImage?: string; // Base64 Main
        productNote?: string;
        refinement?: string; // If regenerating with changes
    }
): Promise<{ imageUrl: string; promptUsed: string }[]> => { // Return array

    // --- 1. Construct Prompt for Gemini 2.5 Flash Image ---
    let promptParts: any[] = [];

    // 1. Initial Context & Role
    let introPrompt = `You are an expert Senior Art Director and CGI Artist. 
    Your goal is to create a high - end, commercial Key Visual advertisement.
    
    ** CRITICAL INSTRUCTION - COMPOSITION:**
    You will be provided with a ** MAIN PRODUCT IMAGE **.You MUST feature the product from this image as the central hero object. 
    - DO NOT hallucinate a new product. 
    - DO NOT use the object from the Reference Style image.
    - YOU MUST composite the Main Product into a scene defined by the Style Reference.
    `;
    promptParts.push({ text: introPrompt });

    // 2. Reference Image (Style Only)
    if (params.referenceImage) {
        promptParts.push({ text: "**INPUT 1: STYLE REFERENCE IMAGE**\nUse this image ONLY for lighting, color palette, mood, and compositional structure. Do NOT copy the specific object or person in this image." });
        const base64Data = params.referenceImage.split(',')[1] || params.referenceImage;
        promptParts.push({
            inlineData: {
                data: base64Data,
                mimeType: 'image/png'
            }
        });
    }

    // 3. Main Product Image (Hero Subject)
    if (params.productImage) {
        promptParts.push({ text: "**INPUT 2: MAIN PRODUCT IMAGE (HERO)**\nThis is the actual product being advertised. You MUST extract this object and place it prominently in the final design. Ensure the product looks realistic and retains its key identity features." });
        const base64Data = params.productImage.split(',')[1] || params.productImage;
        promptParts.push({
            inlineData: {
                data: base64Data,
                mimeType: 'image/png'
            }
        });
    }

    // 4. Product Assets (Supplementary Elements)
    if (params.productAssets && params.productAssets.length > 0) {
        promptParts.push({ text: "**INPUT 3: VISUAL ASSETS**\nUse these additional elements (icons, decorations, secondary items) to enhance the background or surrounding composition. Do not make them the main focus." });
        for (const asset of params.productAssets) {
            const base64Data = asset.split(',')[1] || asset;
            promptParts.push({
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/png'
                }
            });
        }
    }

    // 5. Detailed Design Brief
    let brief = `
    ** DESIGN SPECIFICATIONS:**
    - ** Concept:** ${params.concept || 'N/A'}
    - ** Mood & Tone:** ${params.mood || 'N/A'}
    - ** Visual Style:** ${params.style}
    - ** Description:** ${params.description}
    - ** Aspect Ratio:** ${params.aspectRatio}
`;

    if (params.placementInstructions) {
        brief += `\n - ** Layout / Placement:** ${params.placementInstructions} `;
    }

    if (params.productNote) {
        brief += `\n - ** Product Handling:** ${params.productNote} (Apply these notes to the Main Product Image provided)`;
    }

    // --- Typography Section ---
    brief += `\n\n ** TYPOGRAPHY & TEXT:** `;

    if (params.mainHeading) {
        brief += `\n - ** Main Headline:** "${params.mainHeading}"`;
        brief += `\n - Font Style: ${params.mainHeadingStyle || 'Modern'} `;
        if (params.mainHeadingEffect) {
            brief += `\n - Text Effect: ${params.mainHeadingEffect} `;
        }
    }

    if (params.subHeading) {
        brief += `\n - ** Sub - Headline:** "${params.subHeading}"`;
        if (params.subHeadingEffect) {
            brief += ` (Effect / Style: ${params.subHeadingEffect})`;
        }
    }

    if (params.contentText) {
        brief += `\n - ** Body Copy / Content Text:** "${params.contentText}"(Small text)`;
        if (params.contentTextEffect) {
            brief += ` (Effect / Style: ${params.contentTextEffect})`;
        }
    }

    if (params.cta) {
        brief += `\n - ** Call To Action(CTA) Button:** "${params.cta}"`;
        if (params.ctaEffect) {
            brief += ` (Effect / Shape: ${params.ctaEffect})`;
        }
    }
    // --------------------------

    if (params.refinement) {
        brief += `\n\n ** REFINEMENT REQUEST:** ${params.refinement}. Modify the previous logic to satisfy this request while keeping the Main Product intact.`;
    }

    brief += `\n\n ** FINAL EXECUTION COMMAND:**
    Generate a photorealistic or stylized(based on style) final image. 
    The Main Product must be the clear focal point. 
    The Reference Image's aesthetic should surround the product. 
    Ensure text elements(Headline, CTA) are legible if rendered, or leave clear negative space for them.`;

    promptParts.push({ text: brief });

    const results: { imageUrl: string; promptUsed: string }[] = [];

    // --- 2. Attempt Generation with Gemini 2.5 Flash Image ---
    try {
        // Execute parallel requests to get multiple images if requested.
        const requests = [];
        for (let i = 0; i < params.numberOfImages; i++) {
            requests.push(ai.models.generateContent({
                model: 'gemini-2.5-flash-image',
                contents: { parts: promptParts },
                config: {
                    imageConfig: {
                        aspectRatio: params.aspectRatio as any,
                    },
                    // CRITICAL: Set safety settings to BLOCK_NONE for local development
                    safetySettings: SAFETY_SETTINGS,
                }
            }));
        }

        const responses = await Promise.all(requests);

        for (const response of responses) {
            if (response.candidates && response.candidates[0].content.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData && part.inlineData.data) {
                        results.push({
                            imageUrl: `data: image / png; base64, ${part.inlineData.data} `,
                            promptUsed: brief
                        });
                    }
                }
            }
        }

        return results;

    } catch (error: any) {
        console.error("Gemini 2.5 Flash Image failed.", error);
        return [];
    }
};

export const generateStoryboardFrame = async (
    script: string,
    style: string
): Promise<string | null> => {
    // Prompt specifically designed for storyboard consistency
    const prompt = `Cinematic storyboard frame.Style: ${style}. Script description: "${script}". 
    High quality, detailed, 16: 9 aspect ratio, visual storytelling, concept art.`;

    // Use Gemini 2.5 Flash Image directly
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: prompt,
            config: {
                imageConfig: { aspectRatio: '16:9' },
                safetySettings: SAFETY_SETTINGS
            }
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        // Check all parts for image data, just in case text comes first
        if (response.candidates?.[0]?.content?.parts) {
            for (const p of response.candidates[0].content.parts) {
                const part = p as any;
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
    } catch (e) {
        console.error("Gemini 2.5 Flash Image failed for storyboard.", e);
    }

    return null;
}



// --- MINDMAP GENERATOR ---
export interface MindmapData {
    nodes: { id: string; label: string; type: 'root' | 'branch' | 'leaf' }[];
    edges: { id: string; source: string; target: string }[];
}

// --- MINDMAP AI V2 ---

export interface MindmapInput {
    topic: string;           // Chủ đề chính (Central Topic)
    goal?: string;           // Mục tiêu (VD: Kinh doanh, Nghiên cứu, Học tập)
    audience?: string;       // Đối tượng hướng tới
    depth?: number;          // Độ sâu mong muốn (2-4 cấp)
}

export const generateMindmapData = async (input: MindmapInput | string): Promise<MindmapData> => {
    // Support both old (string) and new (object) input format
    const inputData: MindmapInput = typeof input === 'string'
        ? { topic: input, depth: 3 }
        : input;

    const depth = inputData.depth || 3;
    const hasGoal = inputData.goal && inputData.goal.trim().length > 0;

    const systemPrompt = `### ROLE & CONTEXT:
Bạn là Knowledge Architect (Kiến trúc sư Thông tin) và Chuyên gia Tư duy Hệ thống (Systems Thinking).
Nhiệm vụ: Phân rã chủ đề phức tạp thành Mindmap có cấu trúc CHẶT CHẼ, LOGIC và có CHIỀU SÂU.
Bạn tuân thủ tuyệt đối nguyên tắc MECE (Mutually Exclusive, Collectively Exhaustive - Không trùng lặp, Không bỏ sót).

### INPUT DATA:
- **Chủ đề chính**: ${inputData.topic}
- **Mục tiêu**: ${inputData.goal || 'Chưa xác định (tạo mindmap tổng quan)'}
- **Đối tượng**: ${inputData.audience || 'Chung'}
- **Độ sâu**: ${depth} cấp độ nhánh

### LOGIC PHÂN TÍCH & XÂY DỰNG CÂY (CRITICAL RULES):

**1. CONTEXTUAL BRANCHING (Phân nhánh theo ngữ cảnh):**
${hasGoal ? `
- Dựa vào mục tiêu "${inputData.goal}", chọn các nhánh chính (Level 1) PHÙ HỢP NHẤT
- LOẠI BỎ những nhánh không liên quan đến mục tiêu
- VD: Nếu mục tiêu "Kinh doanh" → Dùng: "Mô hình kinh doanh", "Phân khúc khách hàng", "Marketing & Sale"
- VD: Nếu mục tiêu "Nghiên cứu" → Dùng: "Thành phần", "Tác động", "Đối tượng khuyên dùng"
` : `
- Tạo mindmap TỔNG QUAN với các nhánh phổ quát nhất cho chủ đề
`}

**2. SPECIFIC INSIGHT (Chi tiết đắt giá & BÁM SÁT CHỦ ĐỀ GỐC):**
- Ở các nhánh con (Level 2, Level 3), TUYỆT ĐỐI không dùng từ đơn chung chung
- PHẢI dùng cụm từ ngắn gọn nhưng CHỨA THÔNG TIN CỤ THỂ và PHẢI THỂ HIỆN RÕ SỰ LIÊN QUAN TỚI CHỦ ĐỀ CHÍNH ("${inputData.topic}").
- SAI: "Marketing" -> "Facebook"
- ĐÚNG: "Marketing" -> "Facebook Ads (Target Eat Clean)"

**3. ANTI-HALLUCINATION (Chống bịa đặt):**
- Chỉ đưa ra các nhánh dựa trên kiến thức phổ quát đã kiểm chứng
- Không tự bịa thuật ngữ không tồn tại

**4. MECE COMPLIANCE:**
- Các nhánh cùng cấp KHÔNG được trùng lặp ý nghĩa
- Các nhánh cùng cấp phải BAO QUÁT đủ các khía cạnh quan trọng

### OUTPUT FORMAT (STRICT JSON):
{
  "nodes": [
    { "id": "root", "label": "${inputData.topic}", "type": "root" },
    { "id": "b1", "label": "Nhánh 1 (sát với mục tiêu)", "type": "branch" },
    { "id": "b1-l1", "label": "Chi tiết cụ thể với insight", "type": "leaf" },
    { "id": "b1-l2", "label": "Hành động hoặc thông tin chi tiết", "type": "leaf" },
    { "id": "b2", "label": "Nhánh 2...", "type": "branch" },
    ...
  ],
  "edges": [
    { "id": "e-root-b1", "source": "root", "target": "b1" },
    { "id": "e-b1-l1", "source": "b1", "target": "b1-l1" },
    ...
  ]
}

### QUALITY CONTROL:
- Tạo đúng 4 nhánh chính (branches)
- Mỗi nhánh chính có 2-4 nhánh con (leaves) TÙY THEO ĐỘ SÂU
- Label phải bằng Tiếng Việt, ngắn gọn nhưng ĐẮT GIÁ (có thông tin cụ thể)
- IDs phải unique (root, b1, b2, b1-l1, b1-l2, etc.)`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Create mindmap for: "${inputData.topic}" ${hasGoal ? `with goal: "${inputData.goal}"` : ''}`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.7
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Mindmap Gen Error:", error);
        return { nodes: [], edges: [] };
    }
};

export interface DeepDiveResult {
    angles: string[];
    headlines: string[];
    keywords: string[];
}

export const brainstormNodeDetails = async (nodeLabel: string, rootContext?: string): Promise<DeepDiveResult> => {
    const systemPrompt = `### ROLE & TASK
    You are an elite Digital Content Strategist.
    You are brainstorming content ideas IN ONLY VIETNAMESE.

    ### CONTEXT
    ${rootContext ? `
    🔹 **MAIN PROJECT / CORE THEME:** "${rootContext}"
    🔹 **SUB-CATEGORY / ASPECT TO FOCUS ON:** "${nodeLabel}"
    
    CRITICAL RULE: The brainstorm MUST be about the MAIN PROJECT. The SUB-CATEGORY is just the angle you must use.
    If the MAIN PROJECT is "Tour du lịch cho người cao tuổi" and SUB-CATEGORY is "Nhân khẩu học", your ideas MUST be about "Tâm lý và nhân khẩu học của người cao tuổi khi đi du lịch".
    You MUST NOT output generic ideas about "${nodeLabel}". EVERY angle, headline, and keyword MUST explicitly serve "${rootContext}".
    ` : `
    🔹 **TOPIC:** "${nodeLabel}"
    `}

    ### OUTPUT FORMAT (REQUIREMENTS)
    1. "angles": 5 unique perspectives/angles to write about this topic.
    2. "headlines": 3 highly engaging, click-worthy titles. ${rootContext ? `(MUST contain words relating to "${rootContext}")` : ''}
    3. "keywords": 5 SEO keywords.

    Return ONLY a valid JSON object matching the format below.
    {
        "angles": ["...", "..."],
        "headlines": ["...", "..."],
        "keywords": ["...", "..."]
    }`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: rootContext ? `Generate ideas for project: "${rootContext}". Focus ONLY on this aspect: "${nodeLabel}".` : `Deep dive topic: "${nodeLabel}"`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Deep dive error:", error);
        return { angles: [], headlines: [], keywords: [] };
    }
};

// --- SCAMPER TOOL V2 ---

export interface ScamperInput {
    topic: string;           // Chủ đề/Sản phẩm
    problem: string;         // Vấn đề cần giải quyết (Pain Point)
    targetAudience?: string; // Đối tượng khách hàng
    constraints?: string;    // Ràng buộc (ngân sách, không gian, etc.)
}

export interface ScamperIdea {
    idea_name: string;
    how_to: string;
    example: string;
}

export interface ScamperResult {
    substitute: ScamperIdea[];
    combine: ScamperIdea[];
    adapt: ScamperIdea[];
    modify: ScamperIdea[];
    putToAnotherUse: ScamperIdea[];
    eliminate: ScamperIdea[];
    reverse: ScamperIdea[];
}

export const generateScamperIdeas = async (
    input: ScamperInput | string,
    context?: string,
    method?: string
): Promise<ScamperResult | Record<string, string[]>> => {
    // Support both old (string) and new (object) input format
    const inputData: ScamperInput = typeof input === 'string'
        ? { topic: input, problem: context || '' }
        : input;

    const systemPrompt = `### ROLE & CONTEXT:
Bạn là Product Innovation Expert (Chuyên gia Đổi mới Sản phẩm) với tư duy "Design Thinking".
Nhiệm vụ: Sử dụng kỹ thuật SCAMPER để tìm ra các giải pháp ĐỘT PHÁ nhưng KHẢ THI nhằm giải quyết vấn đề cụ thể của doanh nghiệp.
Bạn KHÔNG đưa ra lý thuyết suông, bạn đưa ra "CHIẾN THUẬT" (tactics) có thể thực hiện được NGAY.

### INPUT DATA:
- **Chủ đề/Sản phẩm**: ${inputData.topic}
- **Vấn đề cần giải quyết (Pain Point)**: ${inputData.problem || 'Chưa xác định'}
- **Đối tượng khách hàng**: ${inputData.targetAudience || 'Chung'}
- **Ràng buộc**: ${inputData.constraints || 'Không có ràng buộc cụ thể'}

### SCAMPER RULES (BẮT BUỘC TUÂN THỦ):

**1. PROBLEM-CENTRIC (Tập trung vấn đề):**
- Ý tưởng BẮT BUỘC phải giải quyết được "${inputData.problem || 'vấn đề của sản phẩm'}"
- Nếu ý tưởng hay nhưng KHÔNG giải quyết vấn đề → LOẠI BỎ

**2. MICRO-INNOVATION (Đổi mới nhỏ):**
- Ưu tiên thay đổi NHỎ về quy trình, dịch vụ, trải nghiệm (low cost)
- Tránh đề xuất thay đổi toàn bộ mô hình kinh doanh (trừ khi được yêu cầu)
${inputData.constraints ? `- Tuân thủ ràng buộc: ${inputData.constraints}` : ''}

**3. CỤ THỂ HÓA (Be Specific):**
- KHÔNG nói: "Tổ chức sự kiện"
- PHẢI nói: "Tổ chức sự kiện đổi sách cũ lấy voucher mỗi Chủ nhật cuối tháng"

${method ? `### FOCUS ONLY ON: ${method.toUpperCase()}` : '### Generate ideas for ALL 7 categories.'}

### OUTPUT FORMAT (STRICT JSON - Idea Cards):
{
  "substitute": [
    {
      "idea_name": "Tên ý tưởng hấp dẫn, ngắn gọn",
      "how_to": "Thay thế yếu tố X bằng Y để giải quyết vấn đề",
      "example": "Ví dụ cụ thể có thể làm ngay"
    }
  ],
  "combine": [
    {
      "idea_name": "string",
      "how_to": "Kết hợp sản phẩm với hoạt động/yếu tố Z",
      "example": "VD: Kết hợp cafe với Speed Networking 15 phút giữa giờ"
    }
  ],
  "adapt": [
    {
      "idea_name": "string",
      "how_to": "Học hỏi và áp dụng từ ngành/sản phẩm khác",
      "example": "string"
    }
  ],
  "modify": [
    {
      "idea_name": "string",
      "how_to": "Thay đổi hình dạng/quy mô/tần suất/quy trình",
      "example": "string"
    }
  ],
  "putToAnotherUse": [
    {
      "idea_name": "string",
      "how_to": "Sử dụng cho mục đích/đối tượng/thời điểm khác",
      "example": "string"
    }
  ],
  "eliminate": [
    {
      "idea_name": "Loại bỏ rào cản tương tác",
      "how_to": "Loại bỏ yếu tố không cần thiết hoặc gây cản trở",
      "example": "VD: Loại bỏ Wifi trong khung giờ Social Hour để ép mọi người nói chuyện"
    }
  ],
  "reverse": [
    {
      "idea_name": "string",
      "how_to": "Đảo ngược quy trình/thứ tự/vai trò",
      "example": "string"
    }
  ]
}

### QUALITY CONTROL:
- Mỗi category có 1-2 ý tưởng CHẤT LƯỢNG (không cần nhiều)
- idea_name phải hấp dẫn, dễ nhớ
- example phải CỤ THỂ, có thể thực hiện NGAY
- Tất cả phải liên quan đến việc giải quyết "${inputData.problem || 'vấn đề chính'}"`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate SCAMPER ideas for: "${inputData.topic}" to solve: "${inputData.problem}"`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.8
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("SCAMPER Gen Error:", error);
        return {};
    }
};

// --- STRATEGIC MODEL GENERATOR ---
export interface StrategicModelData {
    model_type: string;
    data: Record<string, string[] | string>;
    summary: string;
}

export const generateStrategicModel = async (productInfo: string, modelType: string, context?: string): Promise<StrategicModelData> => {
    const systemPrompt = `You are a senior marketing strategist. 
    Your task is to generate a ${modelType} analysis for the user's product/service.
    
    Context: ${context || 'No specific context'}
Product / Service: ${productInfo}
    
    ** CRITICAL:** Output MUST be valid JSON.All content MUST be in ** VIETNAMESE **.

    ** MODEL STRUCTURES:**

    1. ** SWOT **:
- data keys: "strengths"(array), "weaknesses"(array), "opportunities"(array), "threats"(array).
    
    2. ** AIDA **:
- data keys: "attention"(string / array), "interest"(string / array), "desire"(string / array), "action"(string / array).
    
    3. ** 4P ** (Marketing Mix):
- data keys: "product"(array), "price"(array), "place"(array), "promotion"(array).

    4. ** 5W1H **:
- data keys: "who", "what", "where", "when", "why", "how". (All arrays of strings).

    5. ** SMART **:
- data keys: "specific", "measurable", "achievable", "relevant", "time_bound". (All strings describing the goal).

    ** OUTPUT FORMAT:**
    {
        "model_type": "${modelType}",
        "data": { ...specific keys based on model ... },
        "summary": "A short strategic summary in Vietnamese."
    }
        `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate ${modelType} model`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Strategic Model Gen Error:", error);
        return { model_type: modelType, data: {}, summary: "Lỗi khi tạo mô hình." };
    }
};

export const generateAllStrategicModels = async (productInfo: string, context?: string): Promise<Record<string, StrategicModelData>> => {
    const systemPrompt = `You are a senior marketing strategist. 
    The user wants a COMPLETE strategic analysis covering 5 models: SWOT, AIDA, 4P, 5W1H, and SMART Goals.

    Context: ${context || 'No specific context'}
Product / Service: ${productInfo}
    
    ** CRITICAL:** Output MUST be valid JSON.All content MUST be in ** VIETNAMESE **.

    ** OUTPUT FORMAT:**
    {
        "SWOT": {
            "model_type": "SWOT",
            "data": { "strengths": [], "weaknesses": [], "opportunities": [], "threats": [] },
            "summary": "..."
        },
        "AIDA": {
            "model_type": "AIDA",
            "data": { "attention": "...", "interest": "...", "desire": "...", "action": "..." },
            "summary": "..."
        },
        "4P": {
            "model_type": "4P",
            "data": { "product": [], "price": [], "place": [], "promotion": [] },
            "summary": "..."
        },
        "5W1H": {
            "model_type": "5W1H",
            "data": { "who": [], "what": [], "where": [], "when": [], "why": [], "how": [] },
            "summary": "..."
        },
        "SMART": {
            "model_type": "SMART",
            "data": { "specific": "...", "measurable": "...", "achievable": "...", "relevant": "...", "time_bound": "..." },
            "summary": "..."
        }
    }
        `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate ALL models`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("All Strategic Models Gen Error:", error);
        return {};
    }
};

// --- SMART CONTENT CALENDAR ---
export const suggestPillarsFromStrategy = async (strategy: string, context: string): Promise<ContentPillar[]> => {
    const systemPrompt = `You are a content strategist.
    Based on the user's "Overall Content Strategy", suggest 4 distinct Content Pillars (Topics).

Strategy: "${strategy}"
Context: ${context}
    
    ** CRITICAL:** Output MUST be valid JSON.Content in ** VIETNAMESE **.
    
    ** OUTPUT FORMAT(JSON Array):**
    [
        { "name": "Topic 1", "weight": 40, "color": "#3b82f6" },
        { "name": "Topic 2", "weight": 20, "color": "#ef4444" },
        { "name": "Topic 3", "weight": 20, "color": "#eab308" },
        { "name": "Topic 4", "weight": 20, "color": "#22c55e" }
    ]
        (Ensure weights sum to 100. Use hex colors provided in example as base, vary if needed.)
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Suggest Pillars`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text || "[]";
        return JSON.parse(text);
    } catch (error) {
        console.error("Pillar Suggestion Error:", error);
        return [];
    }
};

export const generateContentCalendar = async (
    brandContext: string,
    personaContext: string,
    pillars: ContentPillar[],
    angles: string[],
    month: string,
    year: number,
    isShuffle: boolean = false,
    overallStrategy: string = ""
): Promise<any[]> => {
    const totalWeight = pillars.reduce((sum, p) => sum + p.weight, 0) || 100;
    const pillarInstruction = pillars.map(p => `- ${p.name} (Tỷ trọng: ${Math.round((p.weight / totalWeight) * 100)}%)`).join('\n');
    const anglesInstruction = angles.length > 0 ? angles.join(', ') : 'Tự do sáng tạo (Tùy chọn)';

    const systemPrompt = `Bạn là Senior Content Marketing Manager người Việt Nam.
    Nhiệm vụ: Lên kế hoạch nội dung chi tiết cho tháng ${month}/${year}.
    
    THÔNG TIN ĐẦU VÀO:
    - Bối cảnh thương hiệu: ${brandContext}
    - Chân dung khách hàng: ${personaContext}
    - Chiến lược tổng thể: ${overallStrategy}
    
    CÁC CHỦ ĐỀ CHÍNH (PILLARS) VÀ TỶ TRỌNG KỲ VỌNG:
    ${pillarInstruction}
    
    GÓC TIẾP CẬN (ANGLES):
    Sử dụng linh hoạt các góc tiếp cận sau: ${anglesInstruction}
    
    YÊU CẦU:
    1. Tạo 15-20 bài đăng phân bổ rải rác đều trong tháng ${month}/${year}.
    2. Mỗi bài đăng phải thuộc một trong các Chủ đề (Pillars) đã cho ở trên.
    3. Trả về kết quả hoàn toàn bằng TIẾNG VIỆT (kể cả description).
    4. Định dạng trả về BẮT BUỘC là MẢNG JSON theo cấu trúc (không markdown, không text diễn giải):
    [
      {
        "id": "chuỗi ngẫu nhiên (vd: evt-1)",
        "title": "Tiêu đề bài viết ngắn gọn, hấp dẫn",
        "date": "YYYY-MM-DD" (chỉ trong tháng ${month} năm ${year}),
        "pillar": "Tên chủ đề (phải copy CHÍNH XÁC từ danh sách trên)",
        "format": "Định dạng (vd: Bài đăng ảnh, Video Ngắn, Infographic, Carousel...)",
        "description": "Nội dung tóm tắt cách triển khai bài viết (1-2 câu)"
      }
    ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: isShuffle ? "Hãy tạo một phương án lịch nội dung HOÀN TOÀN MỚI, khác biệt so với các đề xuất thông thường dựa trên yêu cầu trên." : "Hãy lập kế hoạch lịch nội dung cho tháng này dựa trên yêu cầu trên.",
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: isShuffle ? 1.0 : 0.7
            },
        });

        const text = response.text || "[]";
        // Parse array form raw text
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Content Calendar Generation Error:", error);
        return [];
    }
};

// --- MASTERMIND STRATEGY ---

export const generateMastermindStrategy = async (
    brandInfo: string,
    audienceInfo: string,
    goalInfo: string,
    vibeInfo: string,
    tone: string
): Promise<any> => {
    const systemPrompt = `Bạn là một Giám đốc Marketing cấp cao (CMO) với hơn 15 năm kinh nghiệm thực chiến tại Việt Nam và Đông Nam Á.

Nhiệm vụ: Tổng hợp bối cảnh và tạo ra một chiến lược marketing hoàn chỉnh, có chiều sâu và CỰC KỲ CHI TIẾT (1500-2000 chữ) dưới dạng HTML chuẩn SEO theo phong cách Editorial Minimalism.

**INPUT DATA:**
- Bối cảnh thương hiệu: ${brandInfo}
- Thấu hiểu đối tượng: ${audienceInfo}
- Mục tiêu chiến lược: ${goalInfo}
- Phong thái & Tactical: ${vibeInfo}

**YÊU CẦU DESIGN SYSTEM (Đã có CSS sẵn trong project):**
Bạn phải sử dụng chính xác các class và cấu trúc HTML sau để tạo ra báo cáo. Wrapper ngoài cùng phải là <div class="mastermind-page">.

**CẤU TRÚC HTML MẪU VÀ CÁC CLASS BẮT BUỘC:**

1. **HEADER:**
<div class="doc-header">
    <div>
        <div class="doc-eyebrow">Chiến lược Mastermind · [Tên Ngành Hàng]</div>
        <div class="doc-title">[Tên Thương Hiệu] × <em>[Khách Hàng Mục Tiêu]</em></div>
    </div>
    <div class="doc-meta">
        <span class="doc-date">Q[X] · 2026</span>
        <span class="doc-tag">Chiến lược tổng thể</span>
    </div>
</div>

2. **BIG IDEA:**
<div class="big-idea">
    <div class="bi-label">Big Idea · Core Message</div>
    <div class="bi-quote">"[Câu slogan/thông điệp cốt lõi đắt giá]"</div>
    <div class="bi-sub">[Giải thích ngắn gọn ý nghĩa chiến lược của Big Idea này]</div>
</div>

3. **INSIGHT STRIP (3 Cột):**
<div class="insight-strip">
    <div class="ins-item">
        <div class="ins-num">01</div>
        <div class="ins-label">Core Insight</div>
        <div class="ins-val">[Ghi insight theo công thức: Muốn X nhưng cần Y vì lý do Z]</div>
    </div>
    <div class="ins-item">
        <div class="ins-num">02</div>
        <div class="ins-label">Baseline hiện tại</div>
        <div class="ins-val">[Các chỉ số hiện tại dựa trên input user, nếu trống hãy ước lượng thông minh]</div>
    </div>
    <div class="ins-item">
        <div class="ins-num">03</div>
        <div class="ins-label">Mục tiêu 90 ngày</div>
        <div class="ins-val">[Các chỉ số KPI kỳ vọng sau 3 tháng]</div>
    </div>
</div>

4. **TWO COLUMN SECTION (Persona & Competitive):**
<div class="two-col">
    <div class="section">
        <div class="section-head"><div class="section-icon"></div><span class="section-title">Persona & Hành trình</span></div>
        <div class="persona-name">[Tên đại diện], [Tuổi]</div>
        <div class="persona-tag">[Nghề nghiệp] · [Địa điểm] · [Thu nhập]<br>[Sở thích/Thói quen]</div>
        <div class="persona-body">[Mô tả sâu về tâm lý và thói quen]</div>
        <div style="margin-bottom:6px;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:var(--ink-3);font-weight:500">Nỗi đau sâu nhất</div>
        <div class="pain-item"><div class="pain-dot red"></div>[Pain point 1]</div>
        [Thêm các pain-item khác...]
    </div>
    <div class="section">
        <div class="section-head"><div class="section-icon warn"></div><span class="section-title">Competitive Space</span></div>
        <div class="comp-body">[Phân tích bối cảnh cạnh tranh hiện tại]</div>
        <div class="comp-axis">
            <div class="axis-row">
                <div class="axis-label">[Trục X]</div>
                <div class="axis-track">
                    <div class="axis-fill" style="width:[X]%"></div>
                    <div class="axis-marker marker-us" style="left:[X-2]%"></div>
                    <div class="axis-marker marker-them" style="left:[Y]%"></div>
                </div>
            </div>
            [Thêm các trục axis-row khác...]
        </div>
        <div class="axis-legend">
            <div class="leg"><div class="leg-dot" style="background:var(--accent)"></div>Thương hiệu</div>
            <div class="leg"><div class="leg-dot" style="background:var(--ink-4)"></div>Đối thủ TB</div>
        </div>
    </div>
</div>

5. **ROADMAP (3 Cột):**
<div class="roadmap">
    <div class="section-head"><div class="section-icon"></div><span class="section-title">Lộ trình 90 ngày</span></div>
    <div class="roadmap-grid">
        <div class="rm-col">
            <div class="rm-month">Tháng 1</div>
            <div class="rm-theme">[Chủ đề chính]</div>
            <div class="rm-item"><div class="rm-dot"></div>[Hành động 1]</div>
            <div class="rm-kpi">Target: [KPI chi tiết]</div>
        </div>
        [Tương tự cho Tháng 2 và Tháng 3]
    </div>
</div>

6. **CHANNEL ALLOCATION (Grid các card):**
<div class="channel-section">
    <div class="section-head"><span class="section-title">Phân bổ kênh & KPI</span></div>
    <div class="channel-grid">
        <div class="ch-card">
            <div class="ch-top"><span class="ch-name">[Tên Kênh]</span><span class="ch-pct">[X]%</span></div>
            <div class="ch-bar"><div class="ch-fill" style="width:[X]%"></div></div>
            <div class="ch-kpi">[KPI & Lý do chọn kênh]</div>
        </div>
        [Thêm các ch-card khác...]
    </div>
</div>

7. **CONTENT MIX & EXAMPLES:**
<div class="content-section">
    <div class="section-head"><span class="section-title">Content Mix hàng tuần</span></div>
    <div class="content-tabs">
        <div class="ct-tab">
            <div class="ct-type visual">Visual</div>
            <div class="ct-ratio">[Số bài]×</div>
            <div class="ct-example">"[Ví dụ nội dung thật đăng ngay]"</div>
            <div class="ct-hook"><strong>Hook TikTok:</strong> [Câu nói/Cảnh quay]</div>
        </div>
        [Tương tự cho Story và Action]
    </div>
</div>

8. **CMO FINAL ADVICE:**
<div class="cmo-section">
    <div class="cmo-head"><div class="cmo-label">Lời khuyên từ CMO</div><div class="cmo-sig">Expert Note</div></div>
    <div class="cmo-grid">
        <div class="cmo-item"><div class="cmo-num">I.</div><div class="cmo-text">[Lời khuyên quan trọng nhất]</div></div>
        <div class="cmo-item"><div class="cmo-num">II.</div><div class="cmo-text">[Cạm bẫy cần tránh]</div></div>
        <div class="cmo-item"><div class="cmo-num">III.</div><div class="cmo-text">[Cơ hội chưa khai phá]</div></div>
    </div>
    <div class="cmo-quote">"[Câu định vị thương hiệu cuối cùng gợi cảm hứng]"</div>
</div>

Hãy viết báo cáo cực kỳ giá trị, đúng thực tế và ngôn từ "sắc búa". ĐÂY LÀ ĐẦU RA (RETURN) CHO ỨNG DỤNG THEO ĐỊNH DẠNG JSON. DO NOT INCLUDE ANY MARKDOWN FENCES LIKE \`\`\`json OUTSIDE OF JSON.

**OUTPUT FORMAT (STRICT JSON ONLY):**
{
    "coreMessage": "Tên chiến lược cốt lõi (5-10 từ)",
    "htmlOutput": "<div class='mastermind-page'>...toàn bộ nội dung HTML ở đây...</div>"
}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate Deep Mastermind Strategy Report`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.7
            },
        });

        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (error) {
        console.error("Mastermind Gen Error:", error);
        return null;
    }
};

// --- AUTO BRIEF GENERATOR ---
import { BriefData } from "../types";

export interface AutoBriefInput {
    productBrand: string;
    industry: string;
    goal: string;
    targetAudience: string;
    usp?: string;
    budget?: string;      // Critical for Budget Reality Check
    duration?: string;
    mandatories?: string; // V2: Must-haves and restrictions
}

// Parse budget string to number in millions VND
const parseBudgetToMillions = (budgetStr?: string): number => {
    if (!budgetStr) return 0;
    const cleaned = budgetStr.toLowerCase().replace(/[^0-9.trămbmtỷty]/g, '');

    if (budgetStr.includes('tỷ') || budgetStr.includes('ty')) {
        const num = parseFloat(cleaned) || 0;
        return num * 1000; // Convert to millions
    }
    if (budgetStr.includes('triệu') || budgetStr.includes('tr') || budgetStr.includes('m')) {
        return parseFloat(cleaned) || 0;
    }
    // Assume raw number is in millions
    const num = parseFloat(cleaned) || 0;
    return num > 1000 ? num / 1000000 : num; // Handle if entered as actual VND
};

export const generateAutoBrief = async (
    input: AutoBriefInput,
    onProgress?: (step: string) => void
): Promise<BriefData | null> => {
    // V2: Budget Reality Check
    const budgetMillions = parseBudgetToMillions(input.budget);

    let budgetTier: 'micro' | 'small' | 'medium' | 'large' = 'micro';
    let budgetConstraints = '';
    let goalAdjustment = '';

    if (budgetMillions < 50) {
        budgetTier = 'micro';
        budgetConstraints = `
⚠️ NGÂN SÁCH MICRO (< 50 triệu VNĐ):
- CHỈ ĐƯỢC đề xuất: Content Fanpage, Seeding hội nhóm, Ads cơ bản
- CẤM đề xuất: Quay TVC, Event offline, App/Game/AR Filter, KOL hạng A/Celebrity`;

        if (input.goal.toLowerCase().includes('doanh thu') || input.goal.toLowerCase().includes('bán hàng')) {
            goalAdjustment = `
⚠️ ĐIỀU CHỈNH MỤC TIÊU: 
Người dùng chọn "Tăng doanh thu" nhưng ngân sách ${input.budget} quá nhỏ.
→ Tự động điều chỉnh thành "Tăng nhận diện" hoặc "Thúc đẩy dùng thử (Trial)"
→ Giải thích trong Brief rằng ngân sách nhỏ cần focus vào awareness trước`;
        }
    } else if (budgetMillions >= 50 && budgetMillions < 500) {
        budgetTier = 'small';
        budgetConstraints = `
✅ NGÂN SÁCH NHỎ-TRUNG (50-500 triệu VNĐ):
- CÓ THỂ đề xuất: KOC/Micro-KOL, Photoshoot campaign, Video TikTok chất lượng cao
- CHƯA NÊN đề xuất: TVC quay studio, Celebrity/KOL hạng A, Event lớn`;
    } else if (budgetMillions >= 500 && budgetMillions < 1000) {
        budgetTier = 'medium';
        budgetConstraints = `
✅ NGÂN SÁCH TRUNG-LỚN (500 triệu - 1 tỷ VNĐ):
- CÓ THỂ đề xuất: Macro-KOL, Mini-event, Content production chất lượng cao
- CẨN THẬN: Celebrity booking có thể hết ngân sách chỉ cho 1 post`;
    } else {
        budgetTier = 'large';
        budgetConstraints = `
🚀 NGÂN SÁCH LỚN (> 1 tỷ VNĐ):
- ĐƯỢC đề xuất: TVC, Đại sứ thương hiệu, Chuỗi sự kiện, Integrated campaign
- Focus vào impact và brand love dài hạn`;
    }

    const systemPrompt = `### ROLE & CONTEXT:
Bạn là Senior Strategic Planner (Chuyên gia Hoạch định Chiến lược) tại Agency quảng cáo hàng đầu.
Bạn có tư duy sắc bén, hiểu rõ thị trường Việt Nam và đặc biệt NHẠY CẢM VỚI NGÂN SÁCH (Budget-conscious).
Nhiệm vụ: Nhận thông tin sơ khởi từ khách hàng và viết lại thành Creative Brief chuẩn chỉnh, KHẢ THI để chuyển giao cho Creative Team và Media thực thi.

### INPUT DATA:
- **Thương hiệu**: ${input.productBrand}
- **Ngành hàng**: ${input.industry}
- **Mục tiêu sơ khởi**: ${input.goal}
- **Đối tượng**: ${input.targetAudience}
- **USP**: ${input.usp || 'Chưa xác định'}
- **Ngân sách**: ${input.budget || 'Chưa xác định'} (≈ ${budgetMillions} triệu VNĐ - Tier: ${budgetTier.toUpperCase()})
- **Thời gian**: ${input.duration || 'Chưa xác định'}
- **Mandatories**: ${input.mandatories || 'Không có'}

### QUY TẮC TƯ DUY (CRITICAL LOGIC):

**1. KIỂM TRA TÍNH KHẢ THI NGÂN SÁCH (Budget Reality Check):**
${budgetConstraints}
${goalAdjustment}

**2. INSIGHT SÂU SẮC (Không chung chung):**
- KHÔNG viết "Gen Z thích năng động" (quá chung)
- PHẢI viết theo cấu trúc:
  * "Tôi muốn... (Mong muốn)"
  * "Nhưng... (Rào cản/Sự thật ngầm hiểu)"
  * "Vì vậy... (Cơ hội cho thương hiệu)"

**3. CHIẾN THUẬT PHÙ HỢP NGÂN SÁCH:**
- Ngân sách < 50tr: Focus Organic, UGC, Seeding
- Ngân sách 50-200tr: Paid Social + Micro-KOL
- Ngân sách 200-500tr: Full Paid + KOC Army + Photoshoot
- Ngân sách 500tr-1tỷ: Macro-KOL + Event nhỏ + Video production
- Ngân sách > 1tỷ: TVC + Celebrity + Omnichannel

### OUTPUT FORMAT (STRICT JSON - FIELD NAMES PHẢI ĐÚNG):
{
  "project_name": "Tên Campaign sáng tạo, bắt tai (tiếng Việt)",
  "context_analysis": "Bối cảnh & Thách thức: Tóm tắt tình hình thương hiệu và lý do chạy chiến dịch. [Budget Tier: ${budgetTier.toUpperCase()}]",
  "objectives": {
    "business": "Mục tiêu kinh doanh (đã điều chỉnh theo ngân sách ${budgetTier})",
    "marketing": "Mục tiêu marketing với metrics thực tế theo ngân sách",
    "communication": "Mục tiêu truyền thông phù hợp"
  },
  "target_persona": {
    "demographic": "Chân dung: Họ là ai? (tuổi, nghề nghiệp, lifestyle)",
    "psychographic": "Sở thích, hành vi, lối sống",
    "insight": "Tôi muốn [mong muốn], nhưng [rào cản], vì vậy [cơ hội cho brand]"
  },
  "strategy": {
    "core_message": "Thông điệp chủ đạo - 1 câu slogan ngắn gọn, đắt giá",
    "key_hook": "Concept/Big Idea xuyên suốt chiến dịch",
    "tone_mood": "Tính cách thương hiệu trong chiến dịch"
  },
  "execution_plan": [
    {
      "phase": "Giai đoạn 1: Teasing",
      "activity": "Hoạt động PHÙ HỢP ngân sách ${budgetTier}",
      "channel": "Kênh cụ thể"
    },
    {
      "phase": "Giai đoạn 2: Booming", 
      "activity": "Hoạt động chính (đảm bảo KHẢ THI với ngân sách)",
      "channel": "Kênh chính"
    },
    {
      "phase": "Giai đoạn 3: Sustain",
      "activity": "Duy trì thảo luận",
      "channel": "Kênh duy trì"
    }
  ],
  "kpis_deliverables": {
    "success_metrics": "KPIs THỰC TẾ với ngân sách này (không chém gió)",
    "estimated_reach": "Lượt tiếp cận ước tính dựa trên ngân sách ${budgetMillions}tr"
  }
}

### QUALITY CONTROL:
- Insight PHẢI theo cấu trúc 3 phần (Desire-Barrier-Opportunity)
- Execution Plan PHẢI realistc với budget tier "${budgetTier}"
- KPIs KHÔNG được "chém gió" (VD: 50tr không thể cam kết 1 triệu reach)
- Nếu ngân sách quá thấp so với mục tiêu, PHẢI giải thích trong budget_reality_check`;

    try {
        if (onProgress) {
            onProgress('💰 Đang kiểm tra tính khả thi ngân sách...');
            await new Promise(r => setTimeout(r, 600));
            onProgress('🎯 Đang điều chỉnh mục tiêu theo budget...');
            await new Promise(r => setTimeout(r, 600));
            onProgress('🧠 Đang trích xuất Deep Insight (3 lớp)...');
            await new Promise(r => setTimeout(r, 600));
            onProgress('💡 Đang xây dựng Big Idea khả thi...');
            await new Promise(r => setTimeout(r, 600));
            onProgress('📋 Đang lập kế hoạch 3 giai đoạn...');
            await new Promise(r => setTimeout(r, 600));
            onProgress('📊 Đang ước tính KPIs thực tế...');
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate comprehensive Creative Brief with Budget Reality Check for: ${input.productBrand}`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.75
            },
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as BriefData;
    } catch (error) {
        console.error("Auto Brief Gen Error:", error);
        return null;
    }
};

// --- SOP BUILDER ---
import { SOPData } from "../types";

export interface SOPInput {
    processName: string;
    primaryRole: string;
    frequency: string;
    tools?: string;      // V2: Available tools
    goalOutput?: string; // V2: Desired outcome
    scope?: string;
}

export const generateSOP = async (
    input: SOPInput,
    onProgress?: (step: string) => void
): Promise<SOPData | null> => {
    // Determine if Routine (daily/weekly) or Project (one-time/monthly)
    const isRoutine = ['daily', 'weekly'].includes(input.frequency);
    const frequencyType = isRoutine ? 'Routine (Quy trình lặp lại)' : 'Project/Workflow (Quy trình theo giai đoạn)';

    const systemPrompt = `### ROLE & CONTEXT:
Bạn là Operations Director (Giám đốc Vận hành) & Process Architect với tư duy "Lean Management" (Quản trị tinh gọn).
Nhiệm vụ: Chuyển hóa yêu cầu công việc mơ hồ thành bản hướng dẫn SOP chi tiết, dễ hiểu đến mức nhân viên thực tập mới vào nghề cũng có thể làm theo CHÍNH XÁC mà không cần hỏi lại.
Bạn GHÉT sự chung chung, bạn YÊU THÍCH sự chính xác và các checklist cụ thể.

### INPUT DATA:
- **Tên quy trình**: ${input.processName}
- **Vai trò thực hiện**: ${input.primaryRole}
- **Tần suất**: ${input.frequency} → Loại: ${frequencyType}
- **Công cụ sẵn có**: ${input.tools || 'Chưa xác định (AI tự đề xuất)'}
- **Kết quả mong muốn**: ${input.goalOutput || 'Chưa xác định'}

### QUY TẮC XỬ LÝ LOGIC (CRITICAL RULES):

**1. PHÂN LOẠI QUY TRÌNH:**
${isRoutine ? `
- Đây là ROUTINE (Hàng ngày/Hàng tuần)
- Các bước phải lặp lại, có KHUNG GIỜ cụ thể (VD: 9:00 AM check mail)
- Steps ngắn gọn, dạng Checklist nhanh
- Không chia giai đoạn dài dòng
` : `
- Đây là PROJECT/WORKFLOW (Một lần/Theo sự kiện)
- Các bước phải theo trình tự thời gian (Giai đoạn 1 → Giai đoạn 2)
- Chi tiết, chia giai đoạn rõ ràng
- Có deadline từng phase
`}

**2. NGUYÊN TẮC "ACTIONABLE" (Hành động hóa):**
- KHÔNG dùng động từ chung chung: "Nghiên cứu", "Quản lý", "Xử lý"
- PHẢI dùng động từ chỉ hành động CỤ THỂ:
  ✅ "Mở file Sheet tại đường link X"
  ✅ "Liệt kê 5 đối thủ chính"
  ✅ "Gửi email xác nhận cho Sếp A"
  ✅ "Xuất file PDF và upload lên Drive"
  ❌ "Nghiên cứu thị trường" (quá chung chung)
  ❌ "Quản lý tiến độ" (không cụ thể)

**3. DEFINITION OF DONE (Tiêu chuẩn hoàn thành):**
- Mỗi bước PHẢI có tiêu chí để biết đã xong chưa
- VD: "Có file báo cáo PDF", "Đã được Sếp A duyệt trên Trello", "Screenshot màn hình confirm"

**4. TÍCH HỢP CÔNG CỤ:**
- BẮT BUỘC gắn tên công cụ vào từng bước
- Nếu người dùng cung cấp: ${input.tools || 'không có'} → Ưu tiên dùng những công cụ này
- Nếu không có, đề xuất: Google Sheet, Trello, Slack, Canva, Meta Business Suite...

### OUTPUT FORMAT (STRICT JSON):
{
  "sop_title": "Quy trình: ${input.processName}",
  "estimated_time": "Thời gian ước tính phù hợp",
  "summary": "Mục đích ngắn gọn và ai chịu trách nhiệm chính",
  "phases": [
    {
      "phase_name": "Giai đoạn 1: [Tên giai đoạn]",
      "steps": [
        {
          "id": 1,
          "action": "Tên hành động CỤ THỂ, bắt đầu bằng động từ hành động",
          "role": "${input.primaryRole}",
          "tools": ["Tên công cụ cụ thể"],
          "how_to": "Mô tả CHI TIẾT cách làm (VD: Truy cập đường link X, xuất dữ liệu 7 ngày qua)",
          "definition_of_done": "Tiêu chí hoàn thành (VD: 01 file Excel đã lưu tại thư mục Y)",
          "critical_note": "Lỗi thường gặp hoặc lưu ý quan trọng",
          "completed": false
        }
      ],
      "collapsed": false
    }
  ],
  "risks_warnings": ["Lỗi thường gặp 1", "Lỗi thường gặp 2"]
}

### QUALITY CONTROL:
- **how_to phải như hướng dẫn step-by-step**: "Click vào nút Export → Chọn định dạng CSV → Lưu vào folder X"
- **definition_of_done phải đo lường được**: không viết "Làm xong" mà phải "Có 1 file PDF dưới 5MB"
- Mỗi phase ít nhất 2-3 steps
- Tools phải là tên công cụ THẬT, không viết "Công cụ thiết kế"
- Ngôn ngữ: Tiếng Việt chuyên nghiệp, gãy gọn`;

    try {
        if (onProgress) {
            onProgress('🔍 Đang phân loại quy trình (Routine vs Project)...');
            await new Promise(r => setTimeout(r, 600));
            onProgress('📋 Đang áp dụng Lean Management Framework...');
            await new Promise(r => setTimeout(r, 600));
            onProgress('🎯 Đang tạo Definition of Done cho từng bước...');
            await new Promise(r => setTimeout(r, 600));
            onProgress('🛠️ Đang tích hợp công cụ vào quy trình...');
            await new Promise(r => setTimeout(r, 600));
            onProgress('✅ Đang hoàn thiện SOP...');
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate comprehensive SOP with Lean Management framework for: ${input.processName}`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.6
            },
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const data = JSON.parse(jsonStr) as SOPData;

        // Ensure all steps have completed: false
        if (data.phases) {
            data.phases = data.phases.map(phase => ({
                ...phase,
                collapsed: false,
                steps: phase.steps.map(step => ({
                    ...step,
                    completed: false
                }))
            }));
        }

        return data;
    } catch (error) {
        console.error("SOP Gen Error:", error);
        return null;
    }
};

// --- HOOK GENERATOR (The Hook Matrix) ---
import { HookGeneratorResult } from '../types';

export interface HookInput {
    topic: string;
    targetAudience: string;
    usp?: string;
    platform?: string;
}

export const generateHooks = async (
    input: HookInput,
    onProgress?: (step: string) => void
): Promise<HookGeneratorResult | null> => {
    const systemPrompt = `### ROLE & OBJECTIVE
Bạn là một chuyên gia Copywriting hàng đầu và bậc thầy về Tâm lý học hành vi (Behavioral Psychology). Nhiệm vụ của bạn là tạo ra các "Hook" (Lời dẫn/Mở đầu) có khả năng thu hút sự chú ý ngay lập tức dựa trên mô hình "The Hook Matrix".

### THE HOOK MATRIX - 3 CORE PSYCHOLOGICAL TRIGGERS

**1. NEGATIVE WARNING (Cảnh báo tiêu cực)**
- Tâm lý: Đánh vào nỗi sợ mắc sai lầm hoặc hậu quả nếu không sử dụng đúng cách/đúng sản phẩm
- Công thức: "Dừng ngay nếu..." / "Đừng bao giờ..." / "Sai lầm nghiêm trọng khi..."
- Kích hoạt: Fear of Loss, Regret Aversion

**2. SECRET REVEAL (Tiết lộ bí mật)**
- Tâm lý: Đánh vào sự tò mò, hứa hẹn một giải pháp mới lạ hoặc ít người biết
- Công thức: "Bí mật mà..." / "Điều không ai nói với bạn về..." / "Cách ít người biết để..."
- Kích hoạt: Curiosity Gap, Exclusivity

**3. TRANSFORMATION (Sự lột xác)**
- Tâm lý: Nhấn mạnh vào kết quả trước/sau (Before/After) để thấy rõ hiệu quả
- Công thức: "Từ X đến Y trong Z ngày" / "Làm thế nào tôi..." / "Kết quả sau khi..."
- Kích hoạt: Social Proof, Aspiration

### INSTRUCTIONS

**BƯỚC 1: INSIGHT ANALYSIS (Phân tích sâu)**
Dựa trên Topic, Target Audience và USP (nếu có), hãy phân tích:
1. **Pain Point (Nỗi đau thầm kín)**: Vấn đề cụ thể, gây khó chịu nhất mà khách hàng đang gặp phải
2. **Desire (Khao khát tột cùng)**: Trạng thái lý tưởng mà họ muốn đạt được sau khi giải quyết nỗi đau đó

**BƯỚC 2: HOOK GENERATION**
Tạo 3 hooks cho mỗi loại (Negative Warning, Secret Reveal, Transformation) cho từng platform:

**📱 VIDEO (TikTok/Reels/Shorts):**
- Hook Text: < 10 từ, gây shock/tò mò ngay giây đầu tiên
- Visual Cue: Mô tả chi tiết cảnh quay/hành động cụ thể trong 3 giây đầu (VD: "Cận cảnh texture kem tan trên da", "Biểu cảm nhăn mặt khi...")
- Psychology Trigger: Chọn từ danh sách triggers

**🌐 LANDING PAGE:**
- Headline: Kết quả cụ thể + Thời gian + Cam kết (< 15 từ)
- Sub-headline: Xử lý từ chối (objection handling), giải thích thêm
- Psychology Trigger

**📧 EMAIL:**
- Subject Line: < 50 ký tự, tạo FOMO hoặc Exclusive
- Preview Text: Gợi mở thêm, tạo curiosity gap
- Psychology Trigger

**📲 SOCIAL POST:**
- Hook Text: Câu mở đầu gây chú ý, có thể phủ định niềm tin phổ biến
- Hashtag Suggestion: 3-5 hashtags relevant
- Psychology Trigger

### PSYCHOLOGY TRIGGERS (Chọn 1 cho mỗi hook)
- Fear of Loss (Sợ mất mát)
- Risk Reversal (Đảo ngược rủi ro)
- Curiosity Gap (Khoảng trống tò mò)
- Contrarian (Đi ngược xu hướng)
- Social Proof (Bằng chứng xã hội)
- Urgency (Tính cấp bách)
- Exclusivity (Độc quyền)
- Authority (Uy tín chuyên gia)

### OUTPUT FORMAT (STRICT JSON)
{
  "analysis": {
    "identified_pain_point": "Mô tả nỗi đau cụ thể...",
    "identified_desire": "Mô tả khao khát cụ thể..."
  },
  "hooks": {
    "video_shorts": [
      {
        "style": "Negative Warning" | "Secret Reveal" | "Transformation",
        "hook_text": "Câu hook ngắn gọn < 10 từ",
        "visual_cue": "Mô tả chi tiết cảnh quay/hành động trong 3 giây đầu",
        "psychology_trigger": "Tên trigger"
      }
    ],
    "landing_page": [
      {
        "style": "Negative Warning" | "Secret Reveal" | "Transformation",
        "headline": "Tiêu đề chính",
        "sub_headline": "Tiêu đề phụ giải thích thêm",
        "psychology_trigger": "Tên trigger"
      }
    ],
    "email": [
      {
        "style": "Negative Warning" | "Secret Reveal" | "Transformation",
        "subject_line": "Tiêu đề email < 50 chars",
        "preview_text": "Preview text gợi mở",
        "psychology_trigger": "Tên trigger"
      }
    ],
    "social_post": [
      {
        "style": "Negative Warning" | "Secret Reveal" | "Transformation",
        "hook_text": "Câu mở đầu post",
        "hashtag_suggestion": "#hashtag1 #hashtag2 #hashtag3",
        "psychology_trigger": "Tên trigger"
      }
    ]
  }
}

### IMPORTANT NOTES
- Visual Cue phải mô tả hành động cụ thể, dễ hình dung (ví dụ: "Cận cảnh texture kem tan trên da", "Biểu cảm nhăn mặt khi...")
- Headline phải lồng ghép khéo léo USP (nếu có) vào giải pháp hoặc vấn đề
- Ngôn ngữ: Tiếng Việt tự nhiên, bắt trend nếu phù hợp với nhóm khách hàng trẻ
- Tạo 3 hooks cho mỗi loại (Negative Warning, Secret Reveal, Transformation) cho mỗi platform
- Output PHẢI là JSON valid, không có markdown`;

    try {
        onProgress?.('Phân tích Pain Point & Desire...');

        const userPrompt = `TOPIC / SẢN PHẨM: ${input.topic}
TARGET AUDIENCE: ${input.targetAudience}
${input.usp ? `USP / FEATURES: ${input.usp}` : ''}
${input.platform ? `PLATFORM: ${input.platform}` : ''}

Hãy áp dụng The Hook Matrix để tạo hooks theo 3 loại chính:
1. Negative Warning (Cảnh báo tiêu cực)
2. Secret Reveal (Tiết lộ bí mật)
3. Transformation (Sự lột xác)

Nhớ:
1. Phân tích Pain Point & Desire trước
2. Tạo 3 hooks cho mỗi loại cho mỗi platform
3. Video hooks PHẢI có visual_cue chi tiết (mô tả hành động cụ thể trong 3 giây đầu)
4. Mỗi hook phải có psychology_trigger`;

        onProgress?.('Áp dụng The Hook Matrix...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.85,
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: 'application/json'
            },
        });

        onProgress?.('Đang tạo hooks...');

        const text = response.text?.trim();
        if (!text) return null;

        const jsonStr = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonStr) as HookGeneratorResult;

        return result;
    } catch (error) {
        console.error('Hook Generator Error:', error);
        return null;
    }
};

// --- CUSTOMER JOURNEY MAPPER ---
import { JourneyStage } from '../types';

export interface JourneyMapperInput {
    productBrand: string;
    targetAudience: string;
    conversionGoal: string;
    channels: string;
    // Contextual Intelligence
    involvementLevel: 'low' | 'medium' | 'high';
    competitor?: string;
    // NEW: Deep Dive Context
    usp?: string;                                  // Unique Selling Point
    painPoint?: string;                            // Customer Pain Point
    priceSegment: 'low' | 'mid' | 'high';         // Product Price Segment
}

export const generateCustomerJourney = async (
    input: JourneyMapperInput,
    onProgress?: (step: string) => void
): Promise<JourneyStage[] | null> => {
    // Map price segment to journey characteristics
    const priceConfig = {
        low: {
            considerationLength: 'Rất ngắn (vài giây - phút)',
            trustSignals: 'Social proof, Flash deal, Số lượng bán',
            retentionFocus: 'Repurchase frequency'
        },
        mid: {
            considerationLength: 'Trung bình (1-7 ngày)',
            trustSignals: 'Review, So sánh, Influencer',
            retentionFocus: 'Product satisfaction & support'
        },
        high: {
            considerationLength: 'Dài (1-6 tháng)',
            trustSignals: 'Case study, Demo 1-1, Warranty, Expert consultation',
            retentionFocus: 'Onboarding success & dedicated support'
        }
    };
    const pConfig = priceConfig[input.priceSegment || 'mid'];

    const systemPrompt = `### ROLE & PERSONA
Bạn là **Strategic Marketing Planner** chuyên sâu về Consumer Behavior và CX theo framework 5-giai đoạn chuẩn agency Vietnam.
Triết lý: "Bản đồ hành trình không phải 'content list' mà là 'psychological battle plan' để chiến thắng ở mọi touchpoint."

### THE 5-STAGE MODEL (BẮT BUỘC)
1. **Awareness (Nhận biết)** - Khách biết đến vấn đề/brand
2. **Consideration (Cân nhắc)** - Khách so sánh các lựa chọn
3. **Conversion (Chuyển đổi)** - Khách quyết định mua
4. **Retention (Giữ chân)** - Khách sử dụng thành công, KHÔNG churn
5. **Loyalty (Trung thành)** - Khách trở thành Advocate

### INPUT CONTEXT
- **Sản phẩm:** ${input.productBrand}
- **Target:** ${input.targetAudience}
- **USP:** ${input.usp || 'Chưa xác định'}
- **Pain Point khách hàng:** ${input.painPoint || 'Chưa xác định'}
- **Đối thủ:** ${input.competitor || 'Chưa xác định'}
- **Phân khúc giá:** ${input.priceSegment?.toUpperCase() || 'MID'}
  → Thời gian cân nhắc: ${pConfig.considerationLength}
  → Trust signals cần: ${pConfig.trustSignals}
  → Retention focus: ${pConfig.retentionFocus}

### OUTPUT STRUCTURE PER STAGE
Mỗi stage PHẢI có đầy đủ:

{
  "stage": "1. Awareness (Nhận biết)",
  "stage_goal": "Mục tiêu của giai đoạn này",
  "mindset": {
    "doing": "Hành động vật lý: Lướt TikTok lúc 10h đêm",
    "feeling": "😕 Confused - Cảm xúc hiện tại",
    "thinking": "Câu hỏi/suy nghĩ trong đầu"
  },
  "barriers": ["Rào cản 1", "Rào cản 2"],
  "solutions": ["Giải pháp 1", "Giải pháp 2"],
  "touchpoints": [
    { "channel": "Kênh cụ thể", "format": "Định dạng nội dung", "action": "Hành động triển khai" }
  ],
  "kpis": [
    { "metric": "Tên KPI", "target": "Mục tiêu số", "description": "Ý nghĩa" }
  ],
  "action_items": [
    {
      "touchpoint": "Kênh cụ thể (Group Seeding, Shopee Live...)",
      "trigger_message": "Headline/Hook chính xác sẽ dùng",
      "psychological_driver": "FOMO | Trust | Greed | Pride | Fear | Curiosity",
      "format": "Video Short | Long-form Blog | Infographic | Direct Message"
    }
  ],
  "critical_action": "Hành động quan trọng nhất ở stage này",
  "customer_mindset": "Tóm tắt mindset",
  "emotional_state": "Emoji + Trạng thái",
  "key_message": "Thông điệp chính",
  "content_ideas": ["Ý tưởng 1", "Ý tưởng 2"]
}

### 5-STAGE DETAILED REQUIREMENTS

**Stage 1: AWARENESS**
- Goal: Khách biết đến vấn đề/brand
- Mindset: "Tôi có vấn đề nhưng chưa biết giải pháp"
- Sử dụng Pain Point "${input.painPoint}" để tạo Hook
- Psychological Drivers: Curiosity, Fear (of problem)

**Stage 2: CONSIDERATION**
- Goal: Khách chọn brand trong các lựa chọn
- Mindset: "Brand nào tốt nhất? So với ${input.competitor || 'đối thủ'} thì sao?"
- Sử dụng USP "${input.usp}" để differentiate
- Psychological Drivers: Trust, Logic (comparison)

**Stage 3: CONVERSION**
- Goal: Khách quyết định mua
- Mindset: "Tôi thích nhưng sợ mua hớ/lừa"
- Psychological Drivers: FOMO, Greed (deal), Trust (guarantee)

**Stage 4: RETENTION (QUAN TRỌNG)**
- Goal: Khách sử dụng THÀNH CÔNG, không churn
- Mindset: "Làm sao dùng hiệu quả? Có ai hỗ trợ không?"
- Actions: Onboarding Email, Zalo OA Support, User Manual, Warranty
- KPIs: Active Rate, CSAT, Churn Rate
- Psychological Drivers: Security, Support

**Stage 5: LOYALTY**
- Goal: Khách thành Advocate (Raving Fans)
- Mindset: "Sản phẩm tuyệt vời, muốn khoe với bạn bè"
- Actions: Referral Program, VIP Club, Early Access
- KPIs: NPS, Referral Count, CLV
- Psychological Drivers: Pride, Greed (rewards), Belonging

### CRITICAL RULES
1. Output PHẢI có ĐÚNG 5 stages, không hơn không kém
2. action_items PHẢI có psychological_driver từ list: FOMO, Trust, Greed, Pride, Fear, Curiosity, Security, Belonging
3. trigger_message PHẢI là headline/hook CỤ THỂ có thể dùng ngay
4. barriers và solutions PHẢI cụ thể cho ${input.productBrand}
5. Output là JSON array valid, không markdown`;

    try {
        onProgress?.('Phân tích tâm lý khách hàng...');

        const userPrompt = `SẢN PHẨM / THƯƠNG HIỆU: ${input.productBrand}
TARGET AUDIENCE: ${input.targetAudience}
MỤC TIÊU CHUYỂN ĐỔI: ${input.conversionGoal}
KÊNH CHÍNH: ${input.channels}

=== DEEP DIVE CONTEXT ===
USP (Điểm bán hàng độc đáo): ${input.usp || 'Chưa xác định'}
PAIN POINT KHÁCH HÀNG: ${input.painPoint || 'Chưa xác định'}
ĐỐI THỦ CẠNH TRANH: ${input.competitor || 'Chưa xác định'}
PHÂN KHÚC GIÁ: ${input.priceSegment?.toUpperCase() || 'MID'}

Hãy tạo Customer Journey Map 5 GIAI ĐOẠN (Awareness → Consideration → Conversion → Retention → Loyalty).

YÊU CẦU BẮT BUỘC:
1. PHẢI có ĐÚNG 5 stages: Awareness, Consideration, Conversion, Retention, Loyalty
2. Mỗi stage có: stage_goal, mindset, barriers, solutions, touchpoints, kpis, action_items
3. action_items có: touchpoint, trigger_message (headline cụ thể), psychological_driver, format
4. Sử dụng USP "${input.usp}" trong Consideration để đánh đối thủ "${input.competitor}"
5. Sử dụng Pain Point "${input.painPoint}" trong Awareness để tạo Hook
6. Stage 4 (Retention) focus: Onboarding, Support, Usage success
7. Stage 5 (Loyalty) focus: Referral, VIP, Advocacy`;

        onProgress?.('Xây dựng 5-Stage Psychological Battle Plan...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
                safetySettings: SAFETY_SETTINGS,
            },
        });

        onProgress?.('Hoàn thiện bản đồ 5 giai đoạn...');

        const text = response.text?.trim() || '';
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) return null;

        const data: JourneyStage[] = JSON.parse(jsonMatch[0]);
        return data;
    } catch (error) {
        console.error("Journey Map Error:", error);
        return null;
    }
};

// --- JOURNEY INPUT VALIDATION (Sanity Check) ---
export interface JourneyValidationResult {
    validation_status: 'PASS' | 'FAIL' | 'WARNING';
    reason_code: 'LOGIC_ERROR' | 'GIBBERISH' | 'BRAND_MISMATCH' | 'NEW_BRAND' | 'VALID';
    message_to_user: string;
    corrected_suggestion: string | null;
}

export const validateJourneyInput = async (
    input: JourneyMapperInput
): Promise<JourneyValidationResult> => {
    const systemPrompt = `### ROLE & PERSONA
Bạn là **Senior Marketing Auditor** và Data Validator. Nhiệm vụ của bạn là ngăn chặn "Hallucinations" và đảm bảo tính toàn vẹn dữ liệu trước khi lập kế hoạch chiến lược.
Quy tắc: Bạn đại diện cho thực tế. KHÔNG tạo kế hoạch cho dữ liệu vô nghĩa, ngành nghề không khớp, hoặc gibberish rõ ràng.

### TASK: Sanity Check
Đánh giá dữ liệu đầu vào theo 3 tiêu chí:

**1. Logical Consistency (Tính Logic):**
- Sản phẩm có khớp với ngành không? (VD: Brand "Vinamilk" + Industry "Real Estate" → FAIL)
- Sản phẩm có khớp với brand nổi tiếng không? (VD: Brand "Apple" + Product "Cá đông lạnh" → FAIL)

**2. Data Quality (Chất lượng dữ liệu):**
- Input có phải gibberish không? ("asdf", "test 123", "no name") → FAIL
- Target Audience có thực tế không? ("Trẻ 0-1 tuổi" không thể là BUYER của "Bất động sản") → FAIL

**3. Brand Recognition Status:**
- Đây là thương hiệu nổi tiếng? (Yes/No)
- Nếu Yes: Sản phẩm có thuộc về họ thật không?
- Nếu No (Unknown/Startup): Input có đủ coherent để lập kế hoạch không?

### OUTPUT FORMAT (JSON ONLY)
{
  "validation_status": "PASS" | "FAIL" | "WARNING",
  "reason_code": "LOGIC_ERROR" | "GIBBERISH" | "BRAND_MISMATCH" | "NEW_BRAND" | "VALID",
  "message_to_user": "String bằng tiếng Việt",
  "corrected_suggestion": "String hoặc null"
}

### SCENARIO EXAMPLES

**Case 1 (FAIL - Brand Mismatch):**
Input: Brand "Coca-Cola", Product "Laptop Gaming"
Output: {"validation_status": "FAIL", "reason_code": "BRAND_MISMATCH", "message_to_user": "Phát hiện mâu thuẫn: Thương hiệu Coca-Cola nổi tiếng về đồ uống, không kinh doanh Laptop. Vui lòng kiểm tra lại.", "corrected_suggestion": "Coca-Cola - Nước giải khát"}

**Case 2 (FAIL - Gibberish):**
Input: Brand "Test", Product "abc"
Output: {"validation_status": "FAIL", "reason_code": "GIBBERISH", "message_to_user": "Dữ liệu đầu vào không hợp lệ hoặc vô nghĩa. Vui lòng nhập thông tin thật để có kế hoạch chính xác.", "corrected_suggestion": null}

**Case 3 (WARNING - New Brand):**
Input: Brand "VietBeans", Product "Cà phê organic"
Output: {"validation_status": "WARNING", "reason_code": "NEW_BRAND", "message_to_user": "Thương hiệu này có vẻ mới hoặc chưa phổ biến. Hệ thống sẽ lập kế hoạch cho kịch bản 'Tung sản phẩm mới'. Bạn có muốn tiếp tục?", "corrected_suggestion": null}

**Case 4 (PASS):**
Input: Brand "VinFast", Product "VF3"
Output: {"validation_status": "PASS", "reason_code": "VALID", "message_to_user": "Dữ liệu hợp lệ. Đang tiến hành lập kế hoạch...", "corrected_suggestion": null}

### NOTES
- Với thương hiệu Việt Nam nổi tiếng: Vinamilk, VinFast, FPT, VNG, Thế Giới Di Động, Bách Hóa Xanh, Highland Coffee, Phúc Long, The Coffee House... hãy validate chặt.
- Với thương hiệu quốc tế: Apple, Samsung, Google, Microsoft, Nike, Coca-Cola, Pepsi... hãy validate chặt.
- Với thương hiệu không rõ: cho WARNING với reason_code NEW_BRAND
- Output PHẢI là JSON valid, không markdown`;

    try {
        const userPrompt = `VALIDATE INPUT:
- Brand Name: ${input.productBrand}
- Product/Service: ${input.productBrand}
- Target Audience: ${input.targetAudience}
- Conversion Goal: ${input.conversionGoal}
- USP: ${input.usp || 'Chưa xác định'}
- Competitor: ${input.competitor || 'Chưa xác định'}

Hãy thực hiện Sanity Check và trả về JSON validation result.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.3,
                responseMimeType: 'application/json',
                safetySettings: SAFETY_SETTINGS,
            },
        });

        const text = response.text?.trim() || '';
        const result = JSON.parse(text) as JourneyValidationResult;
        return result;
    } catch (error) {
        console.error("Validation Error:", error);
        // Default to PASS if validation fails (don't block user)
        return {
            validation_status: 'PASS',
            reason_code: 'VALID',
            message_to_user: 'Không thể xác thực. Tiếp tục với dữ liệu hiện tại.',
            corrected_suggestion: null
        };
    }
};
import { BudgetAllocationResult, BudgetAllocatorInput } from '../types';

export const generateBudgetAllocation = async (
    input: BudgetAllocatorInput,
    onProgress?: (step: string) => void
): Promise<BudgetAllocationResult | null> => {
    const systemPrompt = `Bạn là Senior Media Planner với 15 + năm kinh nghiệm hoạch định truyền thông.

=== MA TRẬN ƯU TIÊN(PRIORITY MATRIX) ===

** QUY TẮC 1: Dựa trên KPI **
    - KPI = "sales"(Ra số / Conversion):
  • Google Ads(40 %): High Intent - Khách đã tìm kiếm = sẵn sàng mua
  • Meta Ads(30 %): Retargeting + Lookalike mở rộng
  • TikTok Shop(20 %): Impulse buying, thanh toán nhanh
  • CRM / Email(10 %): Chăm sóc khách cũ, ROI cao

    - KPI = "awareness"(Nhận diện thương hiệu):
  • TikTok(40 %): Viral, reach rộng, giá rẻ
  • KOL / KOC(30 %): Tạo lòng tin, UGC content
  • Meta Reach(20 %): Targetin rộng theo demo
  • Google Display(10 %): Banner hiện diện

    - KPI = "retention"(Giữ chân):
  • CRM / Email / Zalo OA(60 %): Chi phí thấp, hiệu quả cao
  • Meta Retargeting(30 %): Nhắc nhở khách cũ
  • Google Remarketing(10 %): Bám đuổi web visitors

    ** QUY TẮC 2: Budget Threshold(Ngưỡng ngân sách) **
        - <10.000.000 VND: CHỈ tập trung 1 - 2 kênh hiệu quả nhất.KHÔNG chia nhỏ!
  • Ví dụ: Chỉ Meta(100 %) hoặc Meta(70 %) + Google(30 %)
  • Lý do: Tránh loãng tiền, không đủ data để optimize

    - 10M - 50M: Tối đa 2 - 3 kênh chính
        - > 50M: Mới kích hoạt KOL và các kênh branding

            ** QUY TẮC 3: Channel DNA(Đặc tính kênh) **
                - Google Ads: "Harvesting"(Thu hoạch) - khách đã có ý định
                    - Meta Ads: "Retargeting + Discovery" - bám đuổi và tìm khách mới
                        - TikTok: "Viral Seeding" - nội dung lan truyền nhanh
                            - KOL / KOC: "Trust Building" - xây dựng lòng tin(chi phí cao)
                                - CRM: Luôn phân bổ 5 - 10 % (trừ brand mới 100 % chưa có data)

** QUY TẮC 4: Industry Context **
    - B2B(Software, Service): Ưu tiên Google + LinkedIn
        - B2C(Fashion, F & B): Ưu tiên TikTok + Meta
            - E - commerce: Shopee Ads / Lazada Ads quan trọng

                === OUTPUT FORMAT(STRICT JSON) ===
                    {
                        "total_budget": [số tiền input],
                        "strategy_name": "Tên chiến lược VD: Performance-First Strategy",
                        "allocation": [
                            {
                                "channel": "Tên kênh",
                                "percentage": [số từ 0 - 100],
                                "amount": [số tiền VND],
                                "role": "Vai trò kênh VD: Harvesting/Seeding/Retargeting",
                                "rationale": "LÝ DO CỤ THỂ tại sao phân bổ % này cho ngành [Industry] và KPI [KPI]. KHÔNG viết chung chung!"
                            }
                        ],
                        "estimated_result": {
                            "clicks": "Ước tính clicks VD: 5.000 - 7.000",
                            "conversions": "Ước tính conversions VD: 150 - 200 đơn hàng"
                        }
                    }

                    ** LƯU Ý QUAN TRỌNG:**
                        - Tổng % các kênh PHẢI = 100 %
                            - Rationale PHẢI cụ thể cho ngành hàng và KPI, KHÔNG generic
                                - Nếu kênh = 0 %, vẫn liệt kê nhưng giải thích tại sao không phân bổ
                                    - Output PHẢI là JSON thuần, KHÔNG có markdown`;

    try {
        onProgress?.('Phân tích ngân sách và KPI...');

        const budgetInMillions = input.totalBudget / 1000000;
        const kpiLabel = {
            sales: 'Chuyển đổi/Doanh số',
            awareness: 'Nhận diện thương hiệu',
            retention: 'Giữ chân khách hàng'
        }[input.kpi];

        const userPrompt = `NGÂN SÁCH TỔNG: ${input.totalBudget.toLocaleString('vi-VN')} VND(${budgetInMillions.toFixed(1)}M)
KPI: ${kpiLabel}
NGÀNH HÀNG: ${input.industry}

Hãy phân bổ ngân sách dựa trên:
1. Ma trận ưu tiên KPI
2. Ngưỡng ngân sách(nếu < 10M chỉ 1 - 2 kênh)
3. Đặc thù ngành hàng ${input.industry}
4. Channel DNA

Rationale PHẢI cụ thể: "Với ngành ${input.industry} và mục tiêu ${kpiLabel}, kênh X chiếm Y% vì..."`;

        onProgress?.('Tính toán phân bổ tối ưu...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.7,
                safetySettings: SAFETY_SETTINGS,
            },
        });

        onProgress?.('Hoàn thiện chiến lược...');

        const text = response.text?.trim() || '';
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const data: BudgetAllocationResult = JSON.parse(jsonMatch[0]);

        // Verify total percentage = 100%
        const totalPercentage = data.allocation.reduce((sum, ch) => sum + ch.percentage, 0);
        if (Math.abs(totalPercentage - 100) > 0.1) {
            console.warn('Total percentage not 100%:', totalPercentage);
        }

        return data;
    } catch (error) {
        console.error("Budget Allocation Error:", error);
        return null;
    }
};// Append this to the END of geminiService.ts

// --- INSIGHT FINDER ---
import { InsightFinderResult, InsightFinderInput } from '../types';

// Anti-Hallucination: Validate input before generating insights
const validateInsightInput = (input: InsightFinderInput): { isValid: boolean; message?: string } => {
    const minLength = 3;
    const gibberishPattern = /^[a-zA-Z]{1,2}$/; // Single letters like "j", "h", "ab"
    const numericOnlyPattern = /^[0-9\s]+$/;   // Only numbers

    const productIndustry = input.productIndustry?.trim() || '';
    const targetAudience = input.targetAudience?.trim() || '';

    // Check if product/industry is too short or gibberish
    if (!productIndustry || productIndustry.length < minLength) {
        return {
            isValid: false,
            message: `Không thể phân tích tâm lý của "${productIndustry}". Xin cho tôi biết: Khách hàng là ai? Và họ sử dụng sản phẩm khi nào?`
        };
    }

    if (gibberishPattern.test(productIndustry)) {
        return {
            isValid: false,
            message: `Dữ liệu "${productIndustry}" không hợp lệ hoặc quá ngắn. Vui lòng nhập tên ngành hàng hoặc sản phẩm cụ thể (VD: "Skincare cho da dầu", "Cafe sữa đá").`
        };
    }

    if (numericOnlyPattern.test(productIndustry)) {
        return {
            isValid: false,
            message: `"${productIndustry}" chỉ có số, không phải ngành hàng. Vui lòng mô tả sản phẩm bằng chữ.`
        };
    }

    // Check target audience
    if (!targetAudience || targetAudience.length < minLength) {
        return {
            isValid: false,
            message: `Vui lòng mô tả khách hàng mục tiêu chi tiết hơn. VD: "Nữ 25-35, da dầu, hay trang điểm, sống thành thị"`
        };
    }

    return { isValid: true };
};

export const generateDeepInsights = async (
    input: InsightFinderInput,
    onProgress?: (step: string) => void
): Promise<InsightFinderResult | null> => {
    // === ANTI-HALLUCINATION: Validate input first ===
    const validation = validateInsightInput(input);
    if (!validation.isValid) {
        return {
            industry: input.productIndustry || 'Unknown',
            threeHitCombo: {
                truth: { whatTheySay: '', currentBehavior: '' },
                tension: { wantX: '', butAfraid: '', insight: '' },
                discovery: { unspokenMotivation: '', notAbout: '', itsAbout: '' }
            },
            creativeImplications: { coreMessage: '', visualKey: '', triggerWords: [] },
            deep_insights: {
                pain_points: [],
                motivations_jtbd: { functional: '', emotional: '', social: '' },
                barriers: [],
                buying_behavior: { search_channel: '', decision_driver: '', deal_breaker: '' }
            },
            emotional_intensity: { level: 0, description: '' },
            validationStatus: 'NEEDS_CLARIFICATION',
            clarificationMessage: validation.message
        };
    }

    // === NEW PROMPT: Senior Consumer Psychologist Persona ===
    const systemPrompt = `### ROLE & PERSONA
Bạn là **Senior Consumer Psychologist** và **Creative Planner** tại agency hàng đầu thế giới (Ogilvy, Leo Burnett).

**Tài năng của bạn:** Bạn không tìm "facts" - bạn tìm "FRICTIONS" – sự căng thẳng giữa điều người ta MUỐN và điều GIỚI HẠN họ.

**Quy tắc vàng:** "An insight is NOT a stat. An insight is a realization that makes the consumer say: 'How did you know that about me?'"

### CRITICAL THINKING FRAMEWORK
Trước khi trả lời, hãy tự hỏi:
- Input này có đủ CỤ THỂ không? (Nếu quá chung chung như "Youth want to express themselves" → đó là TRUISM, không phải insight)
- Friction thực sự là gì? Điều gì ngăn họ làm điều họ muốn?
- Insight có khiến người đọc "giật mình" vì bị "bắt thóp" tâm lý không?

### OUTPUT FRAMEWORK: 3-HIT COMBO

**Layer 1: THE TRUTH (Sự thật hiển nhiên)**
- What they say: Điều họ nói ra công khai ("Tôi muốn [Sản phẩm] rẻ/tốt hơn")
- Current Behavior: Họ đang làm gì để giải quyết vấn đề hiện tại?

**Layer 2: THE TENSION (Mâu thuẫn tâm lý) - ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT**
- Cấu trúc BẮT BUỘC: "Tôi muốn X, NHƯNG tôi sợ Y"
- VD: "Tôi muốn thể hiện phong cách riêng (X), NHƯNG tôi sợ bị bạn bè nghĩ là 'quái dị' (Y)"
- → ĐÂY là sweet spot để đánh vào tâm lý khách hàng

**Layer 3: THE DISCOVERY (Deep Insight)**
- Động lực thầm kín không nói ra
- Format: "Thực ra, đây không phải về [Tính năng sản phẩm], mà là về [Phần thưởng cảm xúc]"
- VD: "Không phải về cà phê, mà là về 15 phút duy nhất trong ngày được 'là chính mình'"

### CREATIVE IMPLICATIONS (The "So What?")
Sau khi tìm ra insight, hãy chuyển thành chiến lược sáng tạo:

**1. Core Message:** Lời hứa thương hiệu trong 1 câu dựa trên insight
**2. Visual Key:** Hình ảnh biểu tượng cho insight (VD: "Người đứng một mình trong đám đông nhưng đang tỏa sáng")
**3. Trigger Words:** 3-5 từ khóa kích hoạt cảm xúc (VD: "Dám", "Chất", "Riêng", "Thật", "Đủ")

### ENHANCED OUTPUT FORMAT (STRICT JSON)
{
  "industry": "[Tên ngành input]",
  
  "threeHitCombo": {
    "truth": {
      "whatTheySay": "Điều họ nói công khai về mong muốn",
      "currentBehavior": "Cách họ đang giải quyết vấn đề hiện tại"
    },
    "tension": {
      "wantX": "Tôi muốn [X cụ thể]...",
      "butAfraid": "NHƯNG tôi sợ [Y cụ thể]...",
      "insight": "Câu insight đầy đủ kết hợp X và Y"
    },
    "discovery": {
      "unspokenMotivation": "Động lực thầm kín thực sự",
      "notAbout": "Thực ra đây không phải về [Feature]",
      "itsAbout": "Mà là về [Emotional Reward]"
    }
  },
  
  "creativeImplications": {
    "coreMessage": "Lời hứa thương hiệu 1 câu",
    "visualKey": "Mô tả hình ảnh biểu tượng",
    "triggerWords": ["Từ1", "Từ2", "Từ3"]
  },
  
  "deep_insights": {
    "pain_points": [
      { "level": "Surface", "content": "Phàn nàn công khai..." },
      { "level": "Surface", "content": "..." },
      { "level": "Deep", "content": "Insight THẦM KÍN..." },
      { "level": "Deep", "content": "..." }
    ],
    "motivations_jtbd": {
      "functional": "Nhiệm vụ cụ thể",
      "emotional": "Cảm giác muốn đạt được",
      "social": "Cách muốn người khác nhìn"
    },
    "barriers": [
      { "type": "Trust Barrier", "content": "..." },
      { "type": "Effort Barrier", "content": "..." },
      { "type": "Price Barrier", "content": "..." }
    ],
    "buying_behavior": {
      "search_channel": "Kênh cụ thể",
      "decision_driver": "Yếu tố chốt hạ",
      "deal_breaker": "Điều tối kỵ"
    }
  },
  
  "emotional_intensity": {
    "level": 7,
    "description": "Giải thích mức độ cảm xúc"
  }
}

### CRITICAL RULES
1. TENSION phải có CẤU TRÚC "Tôi muốn X, NHƯNG tôi sợ Y" - không được viết chung chung
2. Insight phải gây "ahaa moment" - khách hàng phải cảm thấy bị "bắt thóp"
3. Trigger Words phải là từ TIẾNG VIỆT mạnh mẽ, gợi cảm xúc
4. Visual Key phải là hình ảnh CỤ THỂ, có thể hình dung được
5. Output PHẢI là JSON valid, không markdown`;

    try {
        onProgress?.('Đang phân tích tâm lý khách hàng...');

        // Build context string from new input fields
        const contextParts = [];
        if (input.specificSegment) contextParts.push(`Specific Segment: ${input.specificSegment}`);
        if (input.usageOccasion) contextParts.push(`Bối cảnh sử dụng: ${input.usageOccasion}`);
        if (input.currentHabitCompetitor) contextParts.push(`Thói quen/Đối thủ hiện tại: ${input.currentHabitCompetitor}`);
        if (input.context) contextParts.push(`Context: ${input.context}`);
        const contextString = contextParts.length > 0 ? contextParts.join('\n') : '';

        const userPrompt = `PRODUCT/INDUSTRY: ${input.productIndustry}
TARGET AUDIENCE: ${input.targetAudience}
${contextString}

=== NHIỆM VỤ ===
Hãy áp dụng tư duy Consumer Psychologist để tìm ra "FRICTION" - mâu thuẫn tâm lý thực sự:

1. **Find The Truth:** Họ đang nói gì? Đang làm gì?
2. **Find The Tension:** "Tôi muốn X, NHƯNG sợ Y" - ĐÂY LÀ INSIGHT THỰC SỰ
3. **Find The Discovery:** Thực ra không phải về [Feature], mà về [Emotion]
4. **Create Implications:** Core Message + Visual Key + Trigger Words

QUY TẮC VÀNG:
- Đừng cho tôi truism như "họ muốn sản phẩm tốt" - ai cũng vậy
- Cho tôi FRICTION cụ thể cho ${input.targetAudience} trong bối cảnh ${input.specificSegment || input.productIndustry}
- Tension phải khiến người đọc "giật mình" vì đúng quá`;

        onProgress?.('Đang tìm Friction và Tension...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.85,
                safetySettings: SAFETY_SETTINGS,
                responseMimeType: 'application/json'
            },
        });

        onProgress?.('Đang xây dựng Creative Implications...');

        const text = response.text?.trim();
        if (!text) return null;

        const jsonStr = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonStr) as InsightFinderResult;

        // Mark as valid
        result.validationStatus = 'VALID';

        return result;
    } catch (error) {
        console.error('Insight Finder Error:', error);
        return null;
    }
}

// --- CREATIVE ANGLE EXPLORER ---
export const generateCreativeAngles = async (
    input: any,
    onProgress?: (step: string) => void
): Promise<any> => {
    const {
        productName,
        keyFeatures,
        painPoints,
        targetAudience,
        brandVibe,
        desiredFormat,
        desiredAngleCount
    } = input;
    const count = Math.min(Math.max(desiredAngleCount || 8, 5), 15);

    // Map brand vibe to Vietnamese description
    const brandVibeMap: Record<string, string> = {
        'fun': 'Vui vẻ, trẻ trung, năng động',
        'premium': 'Sang trọng, cao cấp, đẳng cấp',
        'meme': 'Bựa, hài hước, viral',
        'minimalist': 'Tối giản, thanh lịch, nhã nhặn',
        'professional': 'Chuyên nghiệp, đáng tin cậy'
    };

    // Map format to Vietnamese description
    const formatMap: Record<string, string> = {
        'video_short': 'Video ngắn dạng TikTok/Reels (9:16, 15-60s)',
        'carousel': 'Carousel Ads (nhiều slide)',
        'static': 'Ảnh tĩnh single image',
        'meme': 'Ảnh chế/Meme format',
        'mixed': 'Đa dạng format'
    };

    const brandVibeDesc = brandVibeMap[brandVibe] || brandVibeMap['fun'];
    const formatDesc = formatMap[desiredFormat] || formatMap['video_short'];

    onProgress?.('Khởi động Creative Strategist (Performance Creative)...');

    const systemPrompt = `### ROLE & CONTEXT:
Bạn là Creative Strategist & Content Director (Chiến lược gia Sáng tạo & Giám đốc Nội dung) với tư duy "Performance Creative".
Bạn am hiểu sâu sắc tâm lý hành vi Gen Z và văn hóa các nền tảng (TikTok, Reels, Facebook Ads).
Nhiệm vụ: Biến thông tin sản phẩm thành các ý tưởng quảng cáo (Creative Angles) có khả năng THUMB-STOP.

### QUY TẮC AN TOÀN (ANTI-HALLUCINATION - BẮT BUỘC TUÂN THỦ):

1. **TRUNG THỰC TUYỆT ĐỐI**: 
   - Chỉ được phát triển ý tưởng DỰA TRÊN các tính năng được cung cấp trong Input
   - KHÔNG ĐƯỢC tự bịa thêm tính năng không có trong USP
   - Ví dụ: Nếu input không nói "thấm hút mồ hôi" thì KHÔNG ĐƯỢC đề cập tính năng đó

2. **TRÁNH SÁO RỖNG**:
   - KHÔNG dùng: "Sản phẩm hàng đầu", "Chất lượng tuyệt vời", "Giá cả hợp lý"
   - PHẢI dùng: Ngôn ngữ đời thường, slang Gen Z, văn nói tự nhiên
   - Ví dụ tốt: "Đỉnh của chóp", "Xịn xò", "Real 100%", "Chuẩn cơm mẹ nấu"

3. **TÍNH THỰC THI (Production-Ready)**:
   - Visual Direction phải ĐỦ CHI TIẾT để Editor/Cameraman hiểu cần quay gì
   - Bao gồm: Góc máy, ánh sáng, đạo cụ, biểu cảm diễn viên, filter nếu cần

### INPUT DATA:
- **Sản phẩm**: ${productName}
- **Tính năng cốt lõi (USP)**: ${typeof keyFeatures === 'string' ? keyFeatures : (keyFeatures || []).join(', ')}
- **Nỗi đau khách hàng**: ${painPoints || 'Chưa xác định'}
- **Đối tượng mục tiêu**: ${targetAudience || 'Gen Z, 18-30 tuổi'}
- **Phong cách thương hiệu**: ${brandVibeDesc}
- **Định dạng mong muốn**: ${formatDesc}

### OUTPUT FORMAT (Concept Card):
Trả về JSON với ${count} concept cards. Mỗi card có cấu trúc:

{
  "product_context": "string (tóm tắt hiểu biết về sản phẩm)",
  "total_angles": ${count},
  "angles": [
    {
      "id": number,
      "angle_name": "string (Tên hấp dẫn, VD: 'Thí nghiệm tàn bạo', 'POV Crush')",
      "hook_type": "Negative Hook|ASMR|Story-telling|Challenge|POV|Before-After|Unboxing|Tutorial|Reaction|Meme",
      "headline_overlay": "string (Text xuất hiện 3 giây đầu để giật tít, dưới 10 từ)",
      "script_outline": {
        "opening_0_3s": "string (Mô tả hành động gây chú ý trong 3 giây đầu)",
        "body": "string (Cách lồng ghép sản phẩm giải quyết vấn đề)",
        "cta": "string (Lời kêu gọi hành động cụ thể)"
      },
      "visual_direction": "string (Mô tả CỰC KỲ CỤ THỂ: bối cảnh, đạo cụ, góc máy, ánh sáng, diễn xuất, filter)",
      "emotion_trigger": "FOMO|Vanity|Greed|Laziness|Curiosity|Fear|Joy|Surprise",
      "suggested_format": "${formatDesc}"
    }
  ]
}

### HOOK TYPES REFERENCE:
- **Negative Hook**: "Đừng mua X nếu bạn không muốn Y" / "Sai lầm khi mua X"
- **POV**: "POV: Crush thấy bạn mặc áo này..."
- **Challenge**: "Thử thách giặt 50 lần xem có phai màu không"
- **ASMR**: Tiếng unboxing, tiếng vải, tiếng bấm nút
- **Before-After**: So sánh trước/sau khi dùng sản phẩm
- **Story-telling**: Kể chuyện cá nhân liên quan đến nỗi đau

### QUAN TRỌNG:
- Headline Overlay phải GIẬT TÍT, gây tò mò, dưới 10 từ
- Script Outline phải thực thi được ngay, không mơ hồ
- Visual Direction phải như brief cho production team`;

    const userPrompt = `Tạo ${count} Concept Cards cho sản phẩm "${productName}" với các góc tiếp cận ĐỘC ĐÁO, phù hợp Gen Z và văn hóa ${formatDesc}.`;

    onProgress?.('Đang phân tích tâm lý khách hàng...');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.85, // High creativity
                maxOutputTokens: 8000,
                responseMimeType: 'application/json',
                safetySettings: SAFETY_SETTINGS,
            },
        });

        onProgress?.('Đang tạo Concept Cards...');

        const text = response.text?.trim();
        if (!text) return null;

        const rawData = JSON.parse(text);

        // Map snake_case from AI to camelCase for frontend
        const mappedAngles = rawData.angles?.map((angle: any) => ({
            id: angle.id,
            framework: angle.hook_type, // Map hook_type -> framework for filter compatibility
            angleName: angle.angle_name,
            hookType: angle.hook_type,
            headlineOverlay: angle.headline_overlay,
            scriptOutline: angle.script_outline,
            hookText: angle.headline_overlay, // For backward compatibility
            adCopyOutline: `🎬 Mở đầu (0-3s): ${angle.script_outline?.opening_0_3s || ''}\n\n📝 Nội dung: ${angle.script_outline?.body || ''}\n\n👆 CTA: ${angle.script_outline?.cta || ''}`,
            visualDirection: angle.visual_direction,
            suggestedFormat: angle.suggested_format,
            emotionTag: angle.emotion_trigger
        })) || [];

        const data = {
            productContext: rawData.product_context,
            totalAngles: rawData.total_angles,
            angles: mappedAngles
        };

        onProgress?.('Hoàn thành!');

        return data;
    } catch (error) {
        console.error('Creative Angle Explorer Error:', error);
        return null;
    }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADS HEALTH CHECKER - Performance Marketing Auditor V2
// Role: Senior Performance Marketing Auditor with 10 years experience
// Style: Skeptical, Data-driven, Straight-talking
// ═══════════════════════════════════════════════════════════════════════════════

// BENCHMARK DATABASE (Source of Truth)
const ADS_HEALTH_BENCHMARKS: Record<string, {
    ctr: { min: number; avg: number; good: number };
    cpc_max_vnd?: number;
    cpl_warning_vnd?: number;
    cr_target?: number;
    advice: string;
}> = {
    'thoi_trang': {
        ctr: { min: 1.5, avg: 2.2, good: 3.5 },
        cpc_max_vnd: 8000,
        advice: 'Ưu tiên Visual. Nếu CTR thấp, thay đổi hình ảnh ngay.'
    },
    'my_pham': {
        ctr: { min: 1.2, avg: 1.8, good: 3.0 },
        cpc_max_vnd: 12000,
        advice: 'Cạnh tranh cao. Chú ý CPM, nếu >150k cần mở rộng tệp.'
    },
    'bat_dong_san': {
        ctr: { min: 0.7, avg: 1.1, good: 2.0 },
        cpl_warning_vnd: 400000,
        advice: 'Quan trọng là CPL. CTR thấp là bình thường.'
    },
    'gia_dung': {
        ctr: { min: 1.5, avg: 2.0, good: 3.0 },
        cr_target: 4.0,
        advice: 'Sản phẩm dễ mua. CR phải cao mới có lãi.'
    },
    'fnb': {
        ctr: { min: 2.0, avg: 3.0, good: 5.0 },
        advice: 'Hình ảnh món ăn quyết định 80%.'
    },
    'giao_duc': {
        ctr: { min: 0.8, avg: 1.5, good: 2.5 },
        cpl_warning_vnd: 200000,
        advice: 'Lead quality quan trọng hơn số lượng. Chú ý CR từ lead sang học viên.'
    },
    'cong_nghe': {
        ctr: { min: 1.0, avg: 1.8, good: 3.0 },
        cpc_max_vnd: 15000,
        advice: 'Target chính xác là chìa khóa. B2B thì CTR thấp hơn B2C.'
    },
    'default': {
        ctr: { min: 1.5, avg: 2.0, good: 3.0 },
        advice: 'Benchmark trung bình ngành. Cần data cụ thể hơn để phân tích chính xác.'
    }
};

// Normalize industry name to match benchmark keys
const normalizeIndustry = (industry: string): string => {
    const lower = industry.toLowerCase().trim();
    if (lower.includes('thời trang') || lower.includes('thoi trang') || lower.includes('fashion')) return 'thoi_trang';
    if (lower.includes('mỹ phẩm') || lower.includes('my pham') || lower.includes('cosmetic') || lower.includes('beauty')) return 'my_pham';
    if (lower.includes('bất động sản') || lower.includes('bat dong san') || lower.includes('real estate')) return 'bat_dong_san';
    if (lower.includes('gia dụng') || lower.includes('gia dung') || lower.includes('home')) return 'gia_dung';
    if (lower.includes('f&b') || lower.includes('fnb') || lower.includes('đồ ăn') || lower.includes('food') || lower.includes('nhà hàng')) return 'fnb';
    if (lower.includes('giáo dục') || lower.includes('giao duc') || lower.includes('education') || lower.includes('học')) return 'giao_duc';
    if (lower.includes('công nghệ') || lower.includes('cong nghe') || lower.includes('tech') || lower.includes('software')) return 'cong_nghe';
    return 'default';
};

// Data Sanity Check Types
interface SanityCheckResult {
    isValid: boolean;
    calculatedMetrics: {
        ctr: number;
        cpm: number;
        cpc: number;
        cr: number;
        cpa: number;
    };
    anomalies: Array<{
        type: 'error' | 'warning';
        message: string;
    }>;
}

// Pre-AI validation function
const performDataSanityCheck = (spend: number, impressions: number, clicks: number, conversions: number): SanityCheckResult => {
    const anomalies: SanityCheckResult['anomalies'] = [];

    // Calculate metrics using strict formulas
    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const cpm = impressions > 0 ? (spend / impressions) * 1000 : 0;
    const cpc = clicks > 0 ? spend / clicks : 0;
    const cr = clicks > 0 ? (conversions / clicks) * 100 : 0;
    const cpa = conversions > 0 ? spend / conversions : 0;

    // Anomaly Detection Rules
    // Rule 1: Clicks > Impressions = Impossible
    if (clicks > impressions) {
        anomalies.push({
            type: 'error',
            message: `❌ DỮ LIỆU PHI LOGIC: Clicks (${clicks.toLocaleString()}) > Impressions (${impressions.toLocaleString()}). Không thể có nhiều click hơn số lần hiển thị.`
        });
    }

    // Rule 2: Conversions > Clicks = Impossible (usually)
    if (conversions > clicks) {
        anomalies.push({
            type: 'error',
            message: `❌ DỮ LIỆU PHI LOGIC: Conversions (${conversions.toLocaleString()}) > Clicks (${clicks.toLocaleString()}). Kiểm tra lại tracking hoặc attribution.`
        });
    }

    // Rule 3: CTR > 15% = Suspicious (possible click fraud)
    if (ctr > 15) {
        anomalies.push({
            type: 'warning',
            message: `⚠️ CTR CAO BẤT THƯỜNG (${ctr.toFixed(2)}%): Nghi ngờ Click ảo hoặc Bot. Kiểm tra kỹ nguồn traffic.`
        });
    }

    // Rule 4: CR > 100% = Tracking Error
    if (cr > 100) {
        anomalies.push({
            type: 'error',
            message: `❌ LỖI TRACKING: CR = ${cr.toFixed(2)}% (>100%). Kiểm tra lại Pixel/Conversion API.`
        });
    }

    // Rule 5: Zero data warnings
    if (impressions === 0) {
        anomalies.push({
            type: 'warning',
            message: '⚠️ Chưa có Impressions. Chiến dịch chưa chạy hoặc data chưa cập nhật.'
        });
    }

    // Rule 6: Currency Detection - Suspiciously low CPC (VND context)
    if (cpc > 0 && cpc < 100) {
        anomalies.push({
            type: 'warning',
            message: `⚠️ CPC RẤT THẤP (${cpc.toFixed(2)} VNĐ): Giá thầu có thể quá thấp để phân phối. Kiểm tra lại đơn vị tiền tệ hoặc dữ liệu nhập vào.`
        });
    }

    // Rule 7: CPM sanity check (too low = suspicious)
    if (cpm > 0 && cpm < 1000) {
        anomalies.push({
            type: 'warning',
            message: `⚠️ CPM RẤT THẤP (${cpm.toFixed(0)} VNĐ): CPM thường từ 5,000-200,000đ. Kiểm tra lại dữ liệu hoặc đơn vị.`
        });
    }

    const hasErrors = anomalies.some(a => a.type === 'error');

    return {
        isValid: !hasErrors,
        calculatedMetrics: { ctr, cpm, cpc, cr, cpa },
        anomalies
    };
};

export const checkAdsHealth = async (
    input: AdsHealthInput,
    onProgress?: (step: string) => void
): Promise<AdsHealthResult | null> => {
    onProgress?.('Khởi động Senior Media Buyer & Strategist (Profit-First)...');

    // Extract core metrics
    let spend = 0, impressions = 0, clicks = 0, conversions = 0;
    // V3 Business Metrics
    let revenue = 0, duration = 1, frequency = 0, reach = 0;

    if (input.dataMode === 'manual' && input.manualMetrics) {
        spend = input.manualMetrics.spend || 0;
        impressions = input.manualMetrics.impressions || 0;
        clicks = input.manualMetrics.clicks || 0;
        conversions = input.manualMetrics.conversions || 0;
        // V3 fields
        revenue = input.manualMetrics.revenue || 0;
        duration = input.manualMetrics.duration || 1;
        frequency = input.manualMetrics.frequency || 0;
        reach = input.manualMetrics.reach || 0;
    } else if (input.rawText) {
        // Parse from raw text - extract numbers
        const numbers = input.rawText.replace(/[đ,]/g, '').match(/[\d.]+/g)?.map(Number) || [];
        if (numbers.length >= 4) {
            spend = numbers[0] || 0;
            impressions = numbers[1] || 0;
            clicks = numbers[2] || 0;
            conversions = numbers[3] || 0;
            revenue = numbers[4] || 0;
        }
    }

    // Auto-calculate Frequency from Reach if not provided
    if (frequency === 0 && reach > 0 && impressions > 0) {
        frequency = impressions / reach;
    }

    // Step 1: Data Sanity Check (Pre-AI validation)
    onProgress?.('Kiểm tra tính logic dữ liệu (Data Sanity Check)...');
    const sanityCheck = performDataSanityCheck(spend, impressions, clicks, conversions);

    // Step 2: Calculate V3 Business Metrics
    const roas = spend > 0 ? revenue / spend : 0;
    const aov = conversions > 0 ? revenue / conversions : 0;
    const cpa = sanityCheck.calculatedMetrics.cpa;
    const ctr = sanityCheck.calculatedMetrics.ctr;
    const dailySpend = duration > 0 ? spend / duration : spend;

    // Get industry benchmark
    const industryKey = normalizeIndustry(input.industry);
    const benchmark = ADS_HEALTH_BENCHMARKS[industryKey];

    // Build anomaly report for AI
    const anomalyReport = sanityCheck.anomalies.length > 0
        ? sanityCheck.anomalies.map(a => a.message).join('\n')
        : 'Không phát hiện bất thường.';

    // Step 3: Build Diagnostic Matrix Analysis
    let diagnosticInsights = '';

    // Content vs Audience Analysis (using CTR + Frequency)
    if (ctr < 1 && frequency < 1.2) {
        diagnosticInsights += `\n🎨 [CREATIVE ISSUE] CTR thấp (${ctr.toFixed(2)}%) + Frequency thấp (${frequency.toFixed(2)}): Nội dung không hấp dẫn. Khách chưa xem nhiều nhưng đã không muốn click.`;
    } else if (ctr < 1 && frequency > 2.5) {
        diagnosticInsights += `\n😫 [AD FATIGUE] CTR thấp + Frequency cao (${frequency.toFixed(2)}): Bão hòa tệp! Khách đã xem quá nhiều lần và chán. Cần thay đổi tệp hoặc làm mới Creative.`;
    }

    // Profitability Analysis (using CPA + ROAS)
    if (revenue > 0) {
        if (cpa > 0 && roas >= 3.0) {
            diagnosticInsights += `\n💰 [HIGH VALUE] CPA cao nhưng ROAS ${roas.toFixed(2)}x: Trạng thái TỐT! Sản phẩm giá trị cao. Tiếp tục Scale.`;
        } else if (cpa > 0 && cpa < aov * 0.3 && roas < 1.5) {
            diagnosticInsights += `\n⚠️ [THIN MARGIN] CPA thấp nhưng ROAS chỉ ${roas.toFixed(2)}x: NGUY HIỂM! Bán được nhiều nhưng lỗ hoặc biên lãi mỏng. Cần tăng AOV hoặc cắt giảm chi phí.`;
        } else if (roas < 1.0) {
            diagnosticInsights += `\n🔥 [LOSING MONEY] ROAS ${roas.toFixed(2)}x < 1.0: Đang ĐỐT TIỀN! Mỗi 1đ chi ra chỉ thu về ${roas.toFixed(2)}đ. Dừng ngay hoặc tối ưu urgently.`;
        }
    }

    // Scale opportunity check
    if (roas >= 2.5 && ctr >= benchmark.ctr.avg && frequency < 2.0) {
        diagnosticInsights += `\n🚀 [SCALE OPPORTUNITY] ROAS ${roas.toFixed(2)}x, CTR tốt, Frequency còn thấp: CƠ HỘI SCALE! Có thể tăng 20-50% ngân sách.`;
    }

    // Step 4: Prepare AI Prompt with Profit-First persona
    onProgress?.('Đang phân tích với tư duy Profit-First...');

    const systemPrompt = `### ROLE & CONTEXT:
Bạn là Senior Media Buyer & Marketing Strategist với tư duy "Profit-First" (Lợi nhuận là trên hết).
Phong cách: Thẳng thắn, tập trung vào lợi nhuận cuối cùng (ROAS), không chỉ nhìn CTR/CPC.

### THÔNG TIN ĐẦU VÀO:
- Nền tảng: ${input.platform}
- Ngành hàng: ${input.industry} (Key: ${industryKey})
- Thời gian chạy: ${duration} ngày
- Chi tiêu/ngày: ${dailySpend.toLocaleString()} VNĐ

### HIỆU SUẤT PHỄU (Funnel Metrics):
- Chi tiêu (Spend): ${spend.toLocaleString()} VNĐ
- Hiển thị (Impressions): ${impressions.toLocaleString()}
- Lượt nhấp (Clicks): ${clicks.toLocaleString()}
- Tần suất (Frequency): ${frequency.toFixed(2)}
- Chuyển đổi (Conversions): ${conversions.toLocaleString()}

### HIỆU QUẢ KINH DOANH (Business Metrics):
- Doanh thu (Revenue): ${revenue.toLocaleString()} VNĐ
- ROAS (Return on Ad Spend): ${roas.toFixed(2)}x
- AOV (Average Order Value): ${aov.toLocaleString()} VNĐ
- CPA (Cost Per Action): ${cpa.toLocaleString()} VNĐ

### CHỈ SỐ ĐÃ TÍNH TOÁN:
- CTR = ${sanityCheck.calculatedMetrics.ctr.toFixed(4)}%
- CPM = ${sanityCheck.calculatedMetrics.cpm.toLocaleString()} VNĐ
- CPC = ${sanityCheck.calculatedMetrics.cpc.toLocaleString()} VNĐ
- CR = ${sanityCheck.calculatedMetrics.cr.toFixed(4)}%

### ANOMALY DETECTION:
${anomalyReport}

### DIAGNOSTIC MATRIX ANALYSIS:
${diagnosticInsights || 'Chưa có insight đặc biệt từ ma trận chẩn đoán.'}

### BENCHMARK NGÀNH (${industryKey.toUpperCase()}):
${JSON.stringify(benchmark, null, 2)}

### MA TRẬN CHẨN ĐOÁN (PHẢI TUÂN THỦ):
1. Về Nội dung & Tệp:
   - CTR thấp (<1%) + Frequency thấp (<1.2): Lỗi do Creative kém
   - CTR thấp + Frequency cao (>2.5): Lỗi do Bão hòa tệp (Ad Fatigue)
2. Về Hiệu quả Kinh doanh:
   - CPA cao + ROAS cao (>3.0): TỐT - Tiếp tục Scale
   - CPA thấp + ROAS thấp (<1.5): NGUY HIỂM - Bán nhiều nhưng lỗ

### OUTPUT FORMAT (Strict JSON):
{
  "health_score": number (0-100, dựa trên ROAS và khả năng mở rộng),
  "status": "Tốt" | "Cần theo dõi" | "Nguy kịch",
  "metrics_analysis": {
    "cpm": { "value": number, "assessment": "string" },
    "ctr": { "value": number, "assessment": "string", "benchmark": "string" },
    "cpc": { "value": number, "assessment": "string" },
    "cr": { "value": number, "assessment": "string" },
    "cpa": { "value": number, "assessment": "string" },
    "roas": { "value": ${roas.toFixed(2)}, "assessment": "string (so với break-even 2.0x)" },
    "aov": { "value": ${aov.toFixed(0)}, "assessment": "string" },
    "frequency": { "value": ${frequency.toFixed(2)}, "assessment": "string (lý tưởng 1.5-2.5)" }
  },
  "diagnosis": {
    "primary_issue": "string (Tiêu đề vấn đề chính)",
    "explanation": "string (Phân tích gốc rễ sử dụng Frequency để phân biệt Creative Issue vs Ad Fatigue, và ROAS để đánh giá thay vì chỉ CPA)",
    "root_cause": "creative_fatigue|audience_exhaustion|low_profitability|scale_opportunity|tracking_issue"
  },
  "actionable_steps": [
    { "action": "string", "detail": "string (cụ thể, có con số)", "priority": "urgent|high|medium|low" }
  ],
  "break_even_roas": 2.5
}`;

    const userPrompt = `Phân tích dữ liệu ads này với tư duy Profit-First. Tập trung vào ROAS và Frequency để chỉ ra lỗ hổng đốt tiền hoặc cơ hội Scale.`;

    onProgress?.('Đang lập phác đồ điều trị Profit-First...');

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                temperature: 0.4,
                responseMimeType: 'application/json',
                safetySettings: SAFETY_SETTINGS,
            },
        });

        onProgress?.('Hoàn tất chẩn đoán!');

        const text = response.text?.trim();
        if (!text) return null;

        // Clean markdown if present
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonStr) as AdsHealthResult;

        // Inject anomalies into the result for UI display
        if (sanityCheck.anomalies.length > 0) {
            result.diagnosis.explanation = `[CẢNH BÁO TỪ SANITY CHECK]\n${anomalyReport}\n\n${result.diagnosis.explanation}`;
        }

        return result;
    } catch (error) {
        console.error('Ads Health Check Error:', error);
        return null;
    }
};

// --- BRAND POSITIONING BUILDER ---
export const buildBrandPositioning = async (
    input: BrandPositioningInput,
    onProgress?: (step: string) => void
): Promise<BrandPositioningResult | null> => {
    onProgress?.('Đang phân tích thương hiệu...');

    const systemPrompt = `Bạn là Chief Brand Officer (CBO) với 20 năm kinh nghiệm xây dựng thương hiệu cho các Startup và tập đoàn lớn.

NHIỆM VỤ: Xây dựng Brand Strategy Deck hoàn chỉnh cho thương hiệu dựa trên thông tin đầu vào.

THÔNG TIN ĐẦU VÀO:
- Tên thương hiệu: ${input.brandName}
- Sản phẩm/Dịch vụ: ${input.products}
- Khách hàng mục tiêu: ${input.targetCustomers}
- Đối thủ cạnh tranh: ${input.competitors}
- Tầm nhìn/Sứ mệnh: ${input.visionMission || 'Chưa xác định'}

QUY TẮC TƯ DUY CHIẾN LƯỢC (PHẢI TUÂN THỦ NGHIÊM NGẶT):

1. PHÂN BIỆT USP vs UVP:
   - USP (Unique Selling Proposition): SỰ KHÁC BIỆT so với đối thủ.
     Công thức: "Duy nhất tại Việt Nam..." hoặc "The Only... that..."
     Ví dụ: "Duy nhất tích hợp AI vào quy trình pháp lý tại VN."
   
   - UVP (Unique Value Proposition): GIÁ TRỊ mang lại cho khách hàng.
     Công thức: "Giúp bạn [lợi ích cụ thể] + [con số/thời gian]"
     Ví dụ: "Giúp Startup soạn hợp đồng chuẩn luật trong 5 phút, tiết kiệm 90% chi phí."

2. BRAND ARCHETYPE (12 Hình mẫu Carl Jung):
   Chọn ĐÚNG 1 archetype phù hợp nhất:
   - The Innocent (Hồn nhiên): Tối giản, lạc quan, đáng tin. VD: Coca-Cola
   - The Sage (Nhà hiền triết): Thông thái, dẫn dắt, tri thức. VD: Google, TED
   - The Explorer (Nhà thám hiểm): Tự do, khám phá, phiêu lưu. VD: Jeep, REI
   - The Outlaw (Kẻ nổi loạn): Phá vỡ lề lối, táo bạo. VD: Harley-Davidson
   - The Magician (Nhà ảo thuật): Biến ước mơ thành hiện thực. VD: Apple, Disney
   - The Hero (Anh hùng): Dũng cảm, chiến thắng, vượt qua thử thách. VD: Nike
   - The Lover (Người tình): Đam mê, gợi cảm, kết nối. VD: Victoria's Secret
   - The Jester (Chú hề): Vui vẻ, hài hước, sống trọn từng khoảnh khắc. VD: M&M's
   - The Everyman (Người bình dân): Gần gũi, thực tế, đồng cảm. VD: IKEA
   - The Caregiver (Người chăm sóc): Bảo vệ, nuôi dưỡng, công bằng. VD: Volvo, Johnson & Johnson
   - The Ruler (Nhà cầm quyền): Quyền lực, đẳng cấp, kiểm soát. VD: Mercedes-Benz, Rolex
   - The Creator (Nhà sáng tạo): Sáng tạo, đổi mới, tự thể hiện. VD: Lego, Adobe

3. RTB (Reason to Believe) - BẰNG CHỨNG:
   RTB KHÔNG ĐƯỢC là lời hứa suông! Phải là:
   - Tính năng cụ thể (Feature): "Tích hợp 50+ template chuẩn MBA"
   - Công nghệ độc quyền (Technology): "Công nghệ NLP xử lý ngôn ngữ tự nhiên"
   - Chứng nhận/Giải thưởng (Certification): "ISO 27001, Top 10 Startup Vietnam"
   - Con số ấn tượng: "10,000+ khách hàng tin dùng"

4. POSITIONING STATEMENT (Template chuẩn MBA):
   "Đối với [Khách hàng mục tiêu], những người [Nhu cầu/Pain point], [Tên Brand] là [Định nghĩa Category] giúp [Lợi ích chính] nhờ vào [RTB nổi bật nhất]."

ĐẦU RA (JSON NGHIÊM NGẶT):
{
  "brand_identity": {
    "archetype": "Tên Archetype (Tên Tiếng Việt)", // VD: "The Magician (Nhà ảo thuật)"
    "archetype_desc": "Mô tả ngắn về archetype này phù hợp với brand như thế nào",
    "tone_of_voice": ["Từ khóa 1", "Từ khóa 2", "Từ khóa 3"] // VD: ["Visionary", "Charismatic", "Bold"]
  },
  "strategic_pillars": {
    "usp": "USP theo công thức 'Duy nhất...' hoặc 'The Only...'",
    "uvp": "UVP theo công thức 'Giúp bạn...' với con số cụ thể",
    "rtb": ["RTB 1 - Feature/Tech/Cert", "RTB 2", "RTB 3"]
  },
  "messaging_pillars": [
    {
      "pillar_name": "Tên trụ cột thông điệp 1",
      "key_message": "Thông điệp chính cho trụ cột này"
    },
    {
      "pillar_name": "Tên trụ cột thông điệp 2",
      "key_message": "Thông điệp chính cho trụ cột này"
    }
  ],
  "positioning_statement": "Câu định vị hoàn chỉnh theo template MBA"
}

CHỈ TRẢ VỀ JSON, KHÔNG CÓ TEXT THÊM.`;

    try {
        onProgress?.('Đang xây dựng Brand Canvas...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            config: {
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.8,
                maxOutputTokens: 4096,
            },
        });

        onProgress?.('Đang hoàn thiện Brand Strategy...');

        const text = response.text?.trim();
        if (!text) return null;

        // Clean markdown if present
        const jsonStr = text.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr) as BrandPositioningResult;
    } catch (error) {
        console.error('Brand Positioning Builder Error:', error);
        return null;
    }
};

// Pricing Analyzer - Pricing Strategy Analysis
export const analyzePricingStrategy = async (
    input: PricingAnalyzerInput,
    onProgress?: (message: string) => void
): Promise<PricingAnalyzerResult | null> => {
    try {
        onProgress?.('Đang phân tích chiến lược giá...');

        // PILLAR 1: Financial Analysis (Local Calculation)
        const grossMargin = ((input.targetPrice - input.cogs) / input.targetPrice) * 100;

        let financialAssessment = '';
        if (grossMargin < 20) {
            financialAssessment = 'Biên lợi nhuận Rất thấp (Critical). Nguy cơ thua lỗ cao.';
        } else if (grossMargin < 30) {
            financialAssessment = 'Biên lợi nhuận Mỏng (Thin Margin). Rất rủi ro nếu chạy Ads.';
        } else if (grossMargin < 50) {
            financialAssessment = 'Biên lợi nhuận Trung bình (Moderate). Đủ để vận hành nhưng cần tối ưu.';
        } else {
            financialAssessment = 'Biên lợi nhuận Tốt (Healthy). Đủ không gian để tái đầu tư.';
        }

        const estimatedFixedCosts = 10000000; // 10M VND assumption
        const breakEvenUnits = Math.ceil(estimatedFixedCosts / (input.targetPrice - input.cogs));

        // PILLAR 2: Competitive Indexing (Local Calculation)
        const marketAvg = (input.competitorMin + input.competitorMax) / 2;
        const priceIndex = input.targetPrice / marketAvg;

        let marketComment = '';
        const priceDiff = ((input.targetPrice - marketAvg) / marketAvg) * 100;

        if (priceIndex < 0.85) {
            marketComment = `Bạn đang rẻ hơn thị trường ${Math.abs(priceDiff).toFixed(0)}%. Điều này tốt cho việc chiếm thị phần nhưng có thể làm giảm giá trị thương hiệu.`;
        } else if (priceIndex > 1.15) {
            marketComment = `Bạn đang đắt hơn thị trường ${priceDiff.toFixed(0)}%. Để bán được giá này, Brand của bạn phải thuộc Top 10% thị trường về niềm tin.`;
        } else {
            marketComment = `Giá của bạn nằm trong khoảng trung bình thị trường (±15%). Đây là vùng an toàn.`;
        }

        // PILLAR 3: Positioning Match Logic
        let positioningWarning = '';
        if (input.positioning === 'premium' && priceIndex < 1.0) {
            positioningWarning = 'CẢNH BÁO: Bạn định vị Premium nhưng giá thấp hơn thị trường. Điều này gây ra Brand Dilution (làm loãng thương hiệu).';
        } else if (input.positioning === 'budget' && priceIndex > 1.0) {
            positioningWarning = 'CẢNH BÁO: Bạn định vị Budget nhưng giá cao hơn thị trường. Điều này không thể cạnh tranh được.';
        }

        // Calculate Verdict Score (0-100)
        let score = 50; // Base score

        // Financial health impact (max ±20)
        if (grossMargin >= 50) score += 20;
        else if (grossMargin >= 30) score += 10;
        else if (grossMargin < 20) score -= 20;
        else score -= 10;

        // Market positioning impact (max ±20)
        if (priceIndex >= 0.85 && priceIndex <= 1.15) score += 20;
        else if (priceIndex < 0.7 || priceIndex > 1.5) score -= 20;
        else score -= 10;

        // Positioning match impact (max ±10)
        if (positioningWarning) score -= 10;
        else score += 10;

        score = Math.max(0, Math.min(100, score)); // Clamp to 0-100

        let verdictStatus: 'Optimal' | 'Warning' | 'Critical';
        if (score >= 70) verdictStatus = 'Optimal';
        else if (score >= 40) verdictStatus = 'Warning';
        else verdictStatus = 'Critical';

        let verdictSummary = '';
        if (verdictStatus === 'Optimal') {
            verdictSummary = 'Mức giá này hợp lý và cân bằng tốt giữa lợi nhuận và khả năng cạnh tranh.';
        } else if (verdictStatus === 'Warning') {
            verdictSummary = 'Mức giá này cần điều chỉnh. ';
            if (grossMargin < 30) verdictSummary += 'Biên lợi nhuận thấp. ';
            if (positioningWarning) verdictSummary += 'Không khớp với định vị thương hiệu. ';
            if (priceIndex > 1.2) verdictSummary += 'Giá cao hơn đối thủ đáng kể.';
        } else {
            verdictSummary = 'Mức giá này có vấn đề nghiêm trọng và cần xem xét lại toàn bộ chiến lược.';
        }

        // Use Gemini for Strategic Solutions
        onProgress?.('Đang tạo giải pháp chiến lược...');

        const industryContext = input.industry ? `Ngành: ${input.industry}` : 'Ngành: Chưa xác định';

        const systemPrompt = `Bạn là Senior Pricing Strategist và Financial Analyst.

NHIỆM VỤ: Đưa ra 3-5 lời khuyên chiến lược để tối ưu giá bán.

DỮ LIỆU PHÂN TÍCH:
${industryContext}
- Giá vốn (COGS): ${input.cogs.toLocaleString('vi-VN')}đ
- Giá bán mục tiêu: ${input.targetPrice.toLocaleString('vi-VN')}đ
- Biên lợi nhuận: ${grossMargin.toFixed(1)}%
- Giá đối thủ: ${input.competitorMin.toLocaleString('vi-VN')}đ - ${input.competitorMax.toLocaleString('vi-VN')}đ
- Giá trung bình thị trường: ${marketAvg.toLocaleString('vi-VN')}đ
- Price Index: ${priceIndex.toFixed(2)} (${priceIndex > 1 ? 'Cao hơn' : 'Thấp hơn'} thị trường ${Math.abs(priceDiff).toFixed(0)}%)
- Định vị: ${input.positioning === 'budget' ? 'Budget (Giá rẻ)' : input.positioning === 'premium' ? 'Premium (Cao cấp)' : 'Mainstream (Phổ thông)'}

VẤN ĐỀ CHÍNH:
${positioningWarning || 'Không có vấn đề định vị'}
${grossMargin < 30 ? '- Biên lợi nhuận quá thấp' : ''}
${priceIndex > 1.2 ? '- Giá cao hơn đối thủ đáng kể' : ''}

YÊU CẦU:
Đưa ra 3-5 strategic solutions (giải pháp chiến lược) cụ thể, khả thi. Mỗi solution phải có:
- type: Loại giải pháp (Psychological Pricing, Value Addition, Cost Optimization, Positioning Strategy, Competitive Response)
- advice: Lời khuyên chi tiết, cụ thể cho ngành hàng này

Ví dụ về các loại advice:
- Psychological Pricing: "Giảm giá từ 500k xuống 499k để tạo Left-digit effect"
- Value Addition: "Thêm bảo hành 12 tháng để justify giá cao hơn"
- Cost Optimization: "Đàm phán với nhà cung cấp để giảm COGS 10%"
- Positioning Strategy: "Nâng cấp packaging để match với định vị Premium"
- Competitive Response: "Bundle với sản phẩm bổ sung để tạo differentiation"

TRẢ VỀ JSON (chỉ JSON, không markdown):
{
  "strategic_solutions": [
    {
      "type": "string",
      "advice": "string"
    }
  ]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            config: {
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.8,
                responseMimeType: 'application/json'
            }
        });

        const text = response.text?.trim();
        let strategicSolutions: StrategicSolution[] = [];

        if (text) {
            const jsonStr = text.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            strategicSolutions = parsed.strategic_solutions || [];
        }

        return {
            verdict: {
                status: verdictStatus,
                score: Math.round(score),
                summary: verdictSummary
            },
            financial_analysis: {
                gross_margin_percent: Math.round(grossMargin * 10) / 10,
                break_even_point: `Bạn cần bán ít nhất ${breakEvenUnits} đơn/tháng để hòa vốn cố định (ước tính).`,
                assessment: financialAssessment
            },
            market_position_analysis: {
                your_price: input.targetPrice,
                market_avg: Math.round(marketAvg),
                price_index: Math.round(priceIndex * 100) / 100,
                comment: marketComment + (positioningWarning ? ` ${positioningWarning}` : '')
            },
            strategic_solutions: strategicSolutions
        };
    } catch (error) {
        console.error('Pricing Analyzer Error:', error);
        return null;
    }
};

// Audience Emotion Map - Consumer Psychology Analysis
export const analyzeEmotionalJourney = async (
    input: AudienceEmotionMapInput,
    onProgress?: (message: string) => void
): Promise<AudienceEmotionMapResult | null> => {
    try {
        onProgress?.('🧠 Đang phân tích tâm lý khách hàng (Tiếng Việt)...');

        const systemPrompt = `Bạn là Senior Consumer Psychologist chuyên về Plutchik's Wheel of Emotions và Content Strategist người Việt Nam.

NHIỆM VỤ: Phân tích hành trình cảm xúc của khách hàng qua 4 giai đoạn mua hàng.

ĐẦU VÀO (INPUT):
- Ngành hàng: ${input.industry}
${input.productCategory ? `- Danh mục sản phẩm: ${input.productCategory}` : ''}
${input.targetAudience ? `- Đối tượng khách hàng: ${input.targetAudience}` : ''}
- Nỗi đau/Vấn đề chính (Pain Point): ${input.painPoint}
${input.positioning ? `- Định vị thương hiệu: ${input.positioning}` : ''}

QUY ĐỊNH NGÔN NGỮ (LANGUAGE RULES) - QUAN TRỌNG NHẤT:
1. TOÀN BỘ KẾT QUẢ TRẢ VỀ PHẢI LÀ TIẾNG VIỆT (VIETNAMESE).
2. Tên cảm xúc (Dominant Emotion) bắt buộc format: "Tên Tiếng Việt (Tên Tiếng Anh)". VD: "Lo âu (Anxiety)".
3. Trigger, Monologue, Tone, Hook, Keywords... TẤT CẢ phải viết bằng Tiếng Việt tự nhiên, không dịch word-by-word.

LOGIC PHÂN TÍCH (CHAIN OF THOUGHT):
- Awareness (Nhận biết): Bắt đầu từ "${input.painPoint}". Nếu đau đớn/nghiêm trọng -> Lo âu/Sợ hãi. Nếu nhu cầu mới -> Tò mò/Hào hứng.
- Journey (Cân nhắc): Quá tải thông tin -> Bối rối. So sánh giá/tính năng -> Nghi ngờ.
- Buy (Mua hàng): ${input.positioning === 'premium' ? 'Giá cao -> Căng thẳng nhưng Hy vọng.' : input.positioning === 'budget' ? 'Giá rẻ -> An tâm, Hài lòng.' : 'Thời điểm xuống tiền -> Căng thẳng vs Hào hứng.'}
- Loyal (Trung thành): Sau mua phải là tích cực -> Tự hào, Tin tưởng, Vui vẻ.

4 GIAI ĐOẠN TRẢ VỀ:
1. AWARENESS (Nhận biết) - Emoji: 🤔
2. JOURNEY (Cân nhắc) - Emoji: 🤯
3. BUY (Mua hàng) - Emoji: 😬
4. LOYAL (Trung thành) - Emoji: 😎

OUTPUT JSON FORMAT (STRICT JSON, NO MARKDOWN):
{
  "industry": "${input.industry}",
  "emotion_journey": [
    {
      "stage": "Awareness",
      "dominant_emotion": "Lo âu (Anxiety)",
      "intensity_score": 7,
      "trigger": "Viết bằng Tiếng Việt...",
      "internal_monologue": "Tôi cảm thấy... (Viết bằng Tiếng Việt)",
      "recommended_tone": "Đồng cảm, Thấu hiểu (Viết bằng Tiếng Việt)",
      "content_hook": "Viết bằng Tiếng Việt...",
      "emoji": "🤔",
      "keywords_to_use": ["Từ khóa 1", "Từ khóa 2"],
      "keywords_to_avoid": ["Từ khóa tránh 1"]
    }
  ]
}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-exp',
            contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
            config: {
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.8,
                responseMimeType: "application/json"
            },
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonStr) as AudienceEmotionMapResult;

        // Validation fallback
        if (!result.emotion_journey || result.emotion_journey.length < 4) {
            // Basic retry or fallback if strictly needed, but throwing creates error state
            console.warn("Insufficient stages generated");
        }

        return result;
    } catch (error) {
        console.error("Emotion Map Error:", error);
        return null;
    }
};



// --- PESTEL BUILDER ---
import { PESTELBuilderInput, PESTELBuilderResult } from '../types';

/** Remove ```json fences some models still emit despite responseMimeType. */
function stripMarkdownJsonFence(input: string): string {
    let s = input.trim();
    if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    }
    return s.trim();
}

/**
 * First complete `{ ... }` slice, respecting JSON string rules (handles `}` inside html_report).
 * `lastIndexOf('}')` breaks when HTML/CSS contains `}` outside of a broken string.
 */
function extractBalancedJsonObject(raw: string): string | null {
    const cleaned = stripMarkdownJsonFence(raw);
    const start = cleaned.indexOf('{');
    if (start === -1) return null;
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (inString) {
            if (escape) {
                escape = false;
            } else if (ch === '\\') {
                escape = true;
            } else if (ch === '"') {
                inString = false;
            }
            continue;
        }
        if (ch === '"') {
            inString = true;
            continue;
        }
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) return cleaned.slice(start, i + 1);
        }
    }
    return null;
}

function parsePESTELBuilderJsonText(text: string): PESTELBuilderResult {
    let jsonStr = extractBalancedJsonObject(text);
    if (!jsonStr) {
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
            jsonStr = text.slice(startIdx, endIdx + 1);
        } else {
            throw new SyntaxError('PESTEL: no JSON object found in model output');
        }
    }

    jsonStr = jsonStr.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    const tryParse = (s: string) => JSON.parse(s) as PESTELBuilderResult;

    try {
        return tryParse(jsonStr);
    } catch (e) {
        // Attempt fallback for unescaped double quotes inside HTML attributes (very common)
        // If we see ="something" or class="foo", we try to turn it into ='something'
        const fixedQuotes = jsonStr.replace(/=([\"'])(.*?)\1/g, "='$2'");
        const noTrailingCommas = fixedQuotes.replace(/,\s*([}\]])/g, '$1');
        try {
            return tryParse(noTrailingCommas);
        } catch {
            throw e; // throw original error if recovery fails
        }
    }
}

export const generatePESTELAnalysis = async (
    input: PESTELBuilderInput,
    onProgress?: (step: string) => void
): Promise<PESTELBuilderResult | null> => {
    const systemPrompt = `Bạn là Giám đốc Marketing cấp cao với 15 năm kinh nghiệm phân tích môi trường vĩ mô và xây dựng chiến lược kinh doanh tại Việt Nam và Đông Nam Á.

NGUYÊN TẮC TUYỆT ĐỐI — ĐỌC TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ:
• Chỉ phân tích dựa trên dữ liệu user cung cấp + kiến thức nền về ngành/thị trường
• NGHIÊM CẤM bịa số liệu GDP, lạm phát, chính sách, hay sự kiện cụ thể
• Nếu thiếu thông tin để phân tích một yếu tố → ghi rõ: "Phân tích dựa trên bối cảnh ngành chung — cần xác nhận với dữ liệu thực tế"
• Mỗi yếu tố PESTEL phải kết nối trực tiếp với ngành và quy mô doanh nghiệp được cung cấp
• PESTEL phải phục vụ quyết định — không phải bài viết học thuật

═══════════════════════════════════════
HÌNH THỨC TRÌNH BÀY (Editorial Minimalism):
═══════════════════════════════════════
Bạn phải sử dụng chính xác các class và cấu trúc HTML sau để tạo ra báo cáo. Wrapper ngoài cùng phải là <div class="pestel-report">.

1. HEADER:
<div class="doc-header">
    <div>
        <div class="doc-eyebrow">Radar Vĩ Mô · PESTEL Analysis</div>
        <div class="doc-title">\${input.industry} × <em>\${input.location}</em></div>
    </div>
    <div class="doc-meta">
        <span class="doc-date">Q2 · 2026</span>
        <span class="doc-tag">\${input.businessScale}</span>
    </div>
</div>

2. KEY TAKEAWAYS (Summary):
<div class="pestel-summary">
    <div class="ps-label">Chiến lược trọng tâm (Key Insights)</div>
    <div class="ps-grid">
        <div class="ps-item">
            <div class="ps-num">01</div>
            <div class="ps-text">[Insight 1: Tác động mạnh nhất hiện tại]</div>
        </div>
        <div class="ps-item">
            <div class="ps-num">02</div>
            <div class="ps-text">[Insight 2: Rủi ro cần phòng vệ]</div>
        </div>
        <div class="ps-item">
            <div class="ps-num">03</div>
            <div class="ps-text">[Insight 3: Cơ hội từ chính sách/thị trường]</div>
        </div>
    </div>
</div>

2b. TIÊU ĐỀ MỤC — NGAY SAU pestel-summary (trước 6 thẻ factor đầu tiên), chèn đúng một khối:
<div class='pestel-factors-intro'><div class='sh'><div class='sh-dot' style='background:var(--p-color)'></div><span class='sh-title'>Phân tích 6 yếu tố PESTEL</span></div></div>

3. CHI TIẾT 6 YẾU TỐ — BẮT BUỘC dùng layout Editorial (ảnh mẫu): thẻ factor + factor-head + factor-body. TUYỆT ĐỐI KHÔNG dùng pestel-factor-card, pf-header, pf-icon, pf-tree, tree-item.

Thứ tự 6 yếu tố và chữ cái trong factor-letter (Environmental vẫn dùng chữ E, phân biệt bằng màu var(--env-color)):
1) Political — P — Tiêu đề: Political <span>Chính trị & Chính sách</span> (hoặc mô tả tương đương ngắn)
2) Economic — E — Economic <span>Kinh tế vĩ mô</span>
3) Social — S — Social <span>Xã hội & Văn hóa</span>
4) Technological — T — Technological <span>Công nghệ & Số hóa</span>
5) Environmental — E — Environmental <span>Môi trường & ESG</span> (màu var(--env-color), không nhầm với Economic)
6) Legal — L — Legal <span>Pháp lý & Tuân thủ</span>

Mỗi yếu tố là một thẻ (sao chép cấu trúc, đổi nội dung và màu inline cho đúng hàng):

<div class='factor' data-pestel='Political'>
  <div class='factor-head'>
    <div class='factor-letter' style='color:var(--p-color)'>P</div>
    <div class='factor-name'>Political <span>Chính trị & Chính sách</span></div>
    <div class='factor-badges'>
      <span class='impact-badge' style='background:rgba(26,58,92,.1);color:var(--p-color)'>Tác động [X]/10</span>
      <span class='timeline-badge'>[Khung thời gian, VD: Ngắn hạn 0–6 tháng]</span>
      <span class='level-badge lh'>Ưu tiên CAO</span>
    </div>
  </div>
  <div class='factor-body'>
    <div class='fb-col'><div class='fb-label'>Hiện trạng</div>[Nội dung]</div>
    <div class='fb-col'><div class='fb-label'>Tác động</div>[Nội dung]</div>
    <div class='fb-col'><div class='fb-label'>Phân loại</div>[opp-tag / mô tả cơ hội & rủi ro]</div>
    <div class='fb-col'><div class='fb-label'>Hành động</div><div class='action-item'><div class='action-dot'></div>[Gợi ý 1]</div><div class='action-item'><div class='action-dot'></div>[Gợi ý 2]</div></div>
  </div>
</div>

Bảng màu inline (factor-letter + impact-badge — áp dụng cho đúng yếu tố):
• Political: color var(--p-color); impact-badge background rgba(26,58,92,.1)
• Economic: var(--e-color); rgba(26,92,58,.1)
• Social: var(--s-color); rgba(193,127,42,.1)
• Technological: var(--t-color); rgba(92,26,92,.1)
• Environmental: var(--env-color); rgba(42,127,58,.1)
• Legal: var(--l-color); rgba(138,26,26,.1)

Ưu tiên (level-badge): CAO → class thêm lh; TRUNG BÌNH → lm; THẤP → ll (VD: <span class='level-badge lm'>Ưu tiên TB</span>).

*Lưu ý: Mọi thẻ HTML (class, style...) trong html_report đều dùng dấu nháy đơn ' để không xung đột JSON. Không emoji trong tiêu đề factor.*

4. HIỆN THỰC HÓA CHIẾN LƯỢC (Top 3 Ops & Risks):
<div class="pestel-matrix-v2">
    <div class="ps-label">Ma trận ưu tiên cơ hội & rủi ro</div>
    <div class="or-grid">
        <div class="or-card">
            <div class="or-label ops">Top 3 Cơ hội bứt phá</div>
            <div class="or-list">
                [Lặp lại 3 items]
                <div class="or-item">
                    <div class="or-title">[Tên cơ hội]</div>
                    <div class="or-origin">Nguồn: [Yếu tố PESTEL nào]</div>
                    <div class="or-action">Hành động cụ thể trong 90 ngày: [Mô tả chi tiết]</div>
                </div>
            </div>
        </div>
        <div class="or-card">
            <div class="or-label risks">Top 3 Rủi ro nguy hiểm</div>
            <div class="or-list">
                [Lặp lại 3 items]
                <div class="or-item">
                    <div class="or-title">[Tên rủi ro]</div>
                    <div class="or-origin">Nguồn: [Yếu tố PESTEL nào]</div>
                    <div class="or-action">Kế hoạch phòng thủ: [Hậu quả cụ thể + Cách xử lý]</div>
                </div>
            </div>
        </div>
    </div>
</div>

5. MATRIX PESTEL SUMMARY:
<div class="pestel-matrix">
    <div class="section-head"><span class="section-title">Ma trận Ưu tiên Chiến lược</span></div>
    <table class="matrix-table">
        <thead>
            <tr>
                <th>Yếu tố</th>
                <th>Tác động chính</th>
                <th>Mức độ</th>
                <th>Ưu tiên</th>
            </tr>
        </thead>
        <tbody>
            [6 hàng cho 6 yếu tố]
            <tr>
                <td>[Factor Name]</td>
                <td>[Tóm tắt 1 câu]</td>
                <td>[X]/10</td>
                <td><span class="prio-tag [high/med/low]">[Cấp độ]</span></td>
            </tr>
        </tbody>
    </table>
</div>

5. LỜI KHUYÊN CMO:
<div class="cmo-advice-box">
    <div class="cmo-head">
        <div class="cmo-label">Chiến lược hành động từ CMO</div>
        <div class="cmo-sig">Expert Verdict</div>
    </div>
    <div class="cmo-content">
        <div class="advice-item">
            <div class="advice-num">I</div>
            <div class="advice-text"><strong>Nút thắt cần gỡ:</strong> [Mô tả vấn đề cấp bách nhất]</div>
        </div>
        <div class="advice-item">
            <div class="advice-num">II</div>
            <div class="advice-text"><strong>Lợi thế vĩ mô:</strong> [Cách tận dụng bối cảnh để bứt phá]</div>
        </div>
        <div class="advice-item">
            <div class="advice-num">III</div>
            <div class="advice-text"><strong>Phòng vệ rủi ro:</strong> [Giải pháp dự phòng cho 12 tháng tới]</div>
        </div>
    </div>
</div>

6. AI UNKNOWNS (MANDATORY):
<div class="unknowns-box">
    <div class="uk-label">Những điều AI không đủ dữ liệu / Cần xác thực thực tế</div>
    <div class="uk-list">
        [Liệt kê ít nhất 3 điểm số liệu cụ thể cần xác nhận lại với GSO/VCCI/Báo cáo ngành]
        <div class="uk-item">
            <span class="uk-dash">—</span>
            [Thông tin thiếu: GDP/Số liệu ngành Q2/2026 cụ thể hoặc chính sách chưa công bố] — <em>[Gợi ý nguồn xác thực: GSO, VCCI, báo cáo chuyên ngành...]</em>
        </div>
    </div>
</div>

ĐỊNH DẠNG ĐẦU RA (JSON FORMAT):
{
  "pestel_context": "${input.industry} tại ${input.location}",
  "html_report": "<div class='pestel-report'>...Nội dung phân tích...</div>",
  "pestel_factors": [Cấu trúc JSON mảng cũ cho 6 category để đảm bảo tính tương thích lịch sử]
}

QUAN TRỌNG — JSON HỢP LỆ (DÀNH CHO CEO):
• Toàn bộ phản hồi là MỘT object JSON duy nhất, không markdown, không text thừa.
• Trong html_report MỌI thuộc tính HTML đều PHẢI dùng dấu nháy đơn ' (ví dụ: <div class='card'>) thay cho dấu nháy kép.
• Phần 6 yếu tố PESTEL trong html_report PHẢI dùng class factor / factor-head / factor-body như mục 3 (không dùng pestel-factor-card hay pf-tree).
• Không bao giờ dùng dấu nháy kép " bên trong chuỗi giá trị JSON trừ khi nó là phân cách key-value của JSON.
• Không chèn ký tự xuống dòng thô (raw newline) trong chuỗi JSON; dùng \\n nếu cần.
`;

    try {
        onProgress?.('🔍 Đang quét radar vĩ mô...');
        await new Promise(r => setTimeout(r, 500));
        onProgress?.('📜 Đang tra cứu chính sách & luật định...');
        await new Promise(r => setTimeout(r, 600));
        onProgress?.('📊 Đang tổng hợp số liệu kinh tế...');
        await new Promise(r => setTimeout(r, 600));
        onProgress?.('🤝 Đang phân tích tác động doanh nghiệp...');
        await new Promise(r => setTimeout(r, 500));
        onProgress?.('🎯 Đang viết báo cáo Editorial Minimalism...');

        const userPrompt = `PHÂN TÍCH PESTEL CHI TIẾT:
- Ngành hàng: \${input.industry}
- Thị trường: \${input.location}
- Quy mô: \${input.businessScale}
- Mô hình kinh doanh: \${input.businessModel}
- Sản phẩm / Dịch vụ chính: \${input.mainProductService}
- Mối lo ngại lớn nhất: \${input.currentConcern}
- Kế hoạch tiếp theo: \${input.futurePlan}
\${input.knownEventsPolicies ? \`- Sự kiện đã biết: \${input.knownEventsPolicies}\` : ''}

Hãy tạo báo cáo PESTEL chuyên sâu, sắc sảo và đầy đủ theo cấu trúc HTML yêu cầu.`;

        const response = await ai.models.generateContent({
            model: GEMINI_REST_MODEL,
            contents: userPrompt,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.45,
                maxOutputTokens: 16384
            },
        });

        const text = response.text || "{}";
        const result = parsePESTELBuilderJsonText(text);

        if (!Array.isArray(result.pestel_factors)) {
            result.pestel_factors = [];
        }
        result.context = result.context || result.pestel_context || '';

        // Add metadata if missing
        result.generated_at = new Date().toISOString();
        result.data_freshness = "Cập nhật Q2/2026";
        
        return result;
    } catch (error) {
        console.error("PESTEL Analysis Error:", error);
        return null;
    }
};



// --- PORTER'S FIVE FORCES ANALYZER ---
import { PorterAnalysisInput, PorterAnalysisResult, IndustryVerdict } from '../types';

export const generatePorterAnalysis = async (
    input: PorterAnalysisInput,
    onProgress?: (step: string) => void
): Promise<PorterAnalysisResult | null> => {
    // User Position Strategy Config
    const positionConfig: Record<string, { strategy: string; focus: string; actionStyle: string }> = {
        'New Entrant': {
            strategy: 'GUERILLA (Du kích)',
            focus: 'Đánh vào ngách hẹp (Niche) để né đối thủ lớn',
            actionStyle: 'Tấn công điểm yếu của đối thủ lớn, tận dụng sự nhanh nhẹn'
        },
        'Market Leader': {
            strategy: 'DEFENSIVE (Phòng thủ)',
            focus: 'Tăng chi phí chuyển đổi (Switching Cost) để giữ khách',
            actionStyle: 'Bảo vệ thị phần, tăng loyalty, xây dựng ecosystem'
        },
        'Challenger': {
            strategy: 'FLANKING (Tấn công sườn)',
            focus: 'Tấn công vào phân khúc mà leader bỏ ngỏ',
            actionStyle: 'Tìm điểm yếu của leader, đầu tư R&D sáng tạo'
        },
        'Niche Player': {
            strategy: 'FOCUS (Tập trung)',
            focus: 'Chuyên sâu vào một phân khúc nhỏ',
            actionStyle: 'Tối ưu hóa trải nghiệm cho niche, xây dựng community'
        }
    };

    const currentPosition = positionConfig[input.userPosition] || positionConfig['New Entrant'];

    const systemPrompt = `### VAI TRÒ
Bạn là **Senior Strategy Consultant** chuyên về **Porter's Five Forces Framework**.

### VỊ THẾ NGƯỜI DÙNG: ${input.userPosition}
**Chiến lược**: ${currentPosition.strategy}
**Focus**: ${currentPosition.focus}
→ TẤT CẢ Strategic Action PHẢI phù hợp với vị thế này!

### DỮ LIỆU ĐẦU VÀO
- **Ngành**: ${input.industry}${input.niche ? ` - ${input.niche}` : ''}
- **Địa điểm**: ${input.location}
- **Mô hình**: ${input.businessModel}
${input.competitors && input.competitors.length > 0 ? `- **Đối thủ**: ${input.competitors.join(', ')}` : ''}

### RULE: SPECIFIC EVIDENCE (Bằng chứng CỤ THỂ)
❌ BAD: "Nhiều đối thủ cạnh tranh"
✅ GOOD: "Cạnh tranh gay gắt từ Traveloka, Agoda và Vietravel tại ${input.location}"

❌ BAD: "Nhà cung cấp có quyền lực"
✅ GOOD: "Phụ thuộc vào khách sạn 5 sao hạn chế tại ${input.location} và vé Vietnam Airlines giờ vàng"

→ Mỗi determinant PHẢI nêu TÊN công ty, sản phẩm, số liệu CỤ THỂ!

### SCORING (1-10, cao = ngành khó làm)
- Low (1-3), Medium (4-6), High (7-8), Extreme (9-10)

### TREND PREDICTION (1-3 năm)
- **Increasing**: Lực lượng TĂNG (tệ hơn)
- **Stable**: Giữ nguyên
- **Decreasing**: Lực lượng GIẢM (tốt hơn)

Phân tích PESTEL để dự đoán trend. VD: AI phát triển → Substitutes Increasing

### OUTPUT JSON
{
  "industry_context": "${input.industry} tại ${input.location}",
  "overall_verdict": "Blue Ocean | Attractive | Moderate | Unattractive | Red Ocean",
  "verdict_description": "Mô tả ngắn",
  "total_threat_score": 1-50,
  "forces": [
    {
      "name": "Competitive Rivalry",
      "name_vi": "Cạnh tranh đối thủ hiện tại",
      "score": 1-10,
      "status": "Low | Medium | High | Extreme",
      "determinants": ["TÊN CỤ THỂ: công ty, sản phẩm tại ${input.location}"],
      "strategic_action": "Hành động PHÙ HỢP vị thế ${input.userPosition}",
      "trend": "Increasing | Stable | Decreasing",
      "trend_reason": "Lý do dự báo từ PESTEL",
      "data_source": "Based on Market Data"
    }
  ],
  "generated_at": "${new Date().toISOString()}"
}

### STRATEGIC ACTION BY POSITION
- New Entrant: Guerilla - Đánh ngách hẹp, né leader
- Market Leader: Defensive - Tăng switching cost, membership
- Challenger: Flanking - Tấn công điểm yếu leader
- Niche Player: Focus - Chuyên sâu 1 phân khúc`;

    try {
        onProgress?.('🎯 Đang phân tích ngành ' + input.industry + '...');
        await new Promise(r => setTimeout(r, 500));

        onProgress?.('👤 Áp dụng chiến lược ' + currentPosition.strategy + '...');
        await new Promise(r => setTimeout(r, 500));

        onProgress?.('⚔️ Đang đánh giá 5 lực lượng cạnh tranh...');
        await new Promise(r => setTimeout(r, 500));

        onProgress?.('🔮 Đang dự báo xu hướng 1-3 năm...');
        await new Promise(r => setTimeout(r, 500));

        onProgress?.('📊 Đang tính toán verdict...');

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Phân tích Porter's Five Forces cho "${input.industry}" tại "${input.location}".
Vị thế: ${input.userPosition} → Chiến lược ${currentPosition.strategy}.
${input.competitors?.length ? `Đối thủ: ${input.competitors.join(', ')}.` : ''}

YÊU CẦU:
1. Determinants: TÊN CỤ THỂ công ty, sản phẩm, số liệu tại ${input.location}
2. Strategic Action: Phù hợp vị thế "${input.userPosition}"
3. Trend + trend_reason cho mỗi force`,
            config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.5
            },
        });

        const text = response.text || "{}";
        const jsonStr = text.replace(/```json|```/g, '').trim();
        const result = JSON.parse(jsonStr) as PorterAnalysisResult;

        if (result.forces && result.forces.length === 5) {
            const totalScore = result.forces.reduce((sum, f) => sum + f.score, 0);
            result.total_threat_score = totalScore;

            if (totalScore <= 20) result.overall_verdict = 'Blue Ocean';
            else if (totalScore <= 28) result.overall_verdict = 'Attractive';
            else if (totalScore <= 35) result.overall_verdict = 'Moderate';
            else if (totalScore <= 42) result.overall_verdict = 'Unattractive';
            else result.overall_verdict = 'Red Ocean';

            result.forces.forEach(f => { if (!f.trend) f.trend = 'Stable'; });
        }

        return result;
    } catch (error) {
        console.error("Porter Analysis Error:", error);
        return null;
    }
};

// --- STP MODEL GENERATOR ---
import { STPInput, STPPosition, STPResult, STPSegment, STPTarget, CMOAdvice } from "../types";

/** Gemini occasionally wraps JSON in fences despite responseMimeType. */
function stripJsonFences(text: string): string {
    let t = text.trim();
    const fenced = /^```(?:json)?\s*([\s\S]*?)```$/im.exec(t);
    if (fenced) return fenced[1].trim();
    return t.replace(/```json|```/g, "").trim();
}

function coerceMarketFitScore(v: unknown): number {
    if (typeof v === "number" && Number.isFinite(v)) {
        return Math.min(100, Math.max(0, Math.round(v)));
    }
    if (typeof v === "string") {
        const n = parseInt(String(v).replace(/%/g, "").trim(), 10);
        return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
    }
    return 0;
}

/** Fill missing targeting from segments / matrix when the model omits fields. */
function normalizeSTPResult(raw: Record<string, unknown>): STPResult {
    const segBlock = raw.segmentation as STPResult["segmentation"] | undefined;
    const segments: STPSegment[] = Array.isArray(segBlock?.segments) ? segBlock!.segments : [];
    const analysisApproach =
        typeof segBlock?.analysis_approach === "string" ? segBlock.analysis_approach : "";

    const tgt = (raw.targeting as Partial<STPTarget> | undefined) || {};
    const matrix = Array.isArray(tgt.targeting_matrix) ? tgt.targeting_matrix : [];

    let primary = typeof tgt.primary_segment === "string" ? tgt.primary_segment.trim() : "";
    let rationale =
        typeof tgt.selection_rationale === "string" ? tgt.selection_rationale.trim() : "";
    let growth =
        typeof tgt.growth_potential === "string" ? tgt.growth_potential.trim() : "";
    let marketFit = coerceMarketFitScore(tgt.market_fit_score);

    if (!primary && segments[0]?.name) {
        primary = segments[0].name;
    }

    if (matrix.length > 0) {
        const best = matrix.reduce((a, b) =>
            (b.total_score ?? 0) > (a.total_score ?? 0) ? b : a
        );
        if (!primary && best.segment_name) {
            primary = String(best.segment_name);
        }
        if (marketFit === 0 && typeof best.total_score === "number" && best.total_score > 0) {
            marketFit = Math.min(100, Math.round((best.total_score / 20) * 100));
        }
        if (!rationale && best.rationale) {
            rationale = String(best.rationale);
        }
        if (!growth && best.rationale) {
            growth = `Dựa trên ma trận targeting: ${best.rationale}`;
        }
    }

    if (!rationale && primary) {
        rationale = `Ưu tiên phân khúc "${primary}" theo dữ liệu phân khúc và mục tiêu STP đã phân tích.`;
    }
    if (!growth) {
        growth =
            primary || segments.length
                ? "Cần thêm số liệu thị trường (CAGR, quy mô) để định lượng chính xác — xem Segmentation và đối thủ."
                : "";
    }

    const pos = (raw.positioning as Partial<STPPosition> | undefined) || {};
    const positioning: STPPosition = {
        positioning_statement: String(pos.positioning_statement ?? ""),
        unique_value_proposition: String(pos.unique_value_proposition ?? ""),
        key_differentiators: Array.isArray(pos.key_differentiators)
            ? pos.key_differentiators.map(String)
            : [],
        brand_essence: String(pos.brand_essence ?? ""),
        competitive_frame: String(pos.competitive_frame ?? ""),
        reasons_to_believe: Array.isArray(pos.reasons_to_believe)
            ? pos.reasons_to_believe.map(String)
            : [],
        matrix_2x2: pos.matrix_2x2,
        channel_messages: pos.channel_messages,
        perceptual_map_text: pos.perceptual_map_text,
    };

    const ap = raw.actionPlan as STPResult["actionPlan"] | undefined;
    const actionPlan: STPResult["actionPlan"] = {
        immediate_actions: Array.isArray(ap?.immediate_actions)
            ? ap!.immediate_actions.map(String)
            : [],
        marketing_channels: Array.isArray(ap?.marketing_channels)
            ? ap!.marketing_channels.map(String)
            : [],
        messaging_hooks: Array.isArray(ap?.messaging_hooks) ? ap!.messaging_hooks.map(String) : [],
    };

    const st = raw.strategy as STPResult["strategy"] | undefined;
    const strategy: STPResult["strategy"] | undefined = st
        ? {
              top_insights: Array.isArray(st.top_insights) ? st.top_insights.map(String) : [],
              strategic_risks: Array.isArray(st.strategic_risks)
                  ? st.strategic_risks.map((r) => ({
                        issue: String((r as { issue?: string }).issue ?? ""),
                        mitigation: String((r as { mitigation?: string }).mitigation ?? ""),
                    }))
                  : [],
              opportunities: Array.isArray(st.opportunities)
                  ? st.opportunities.map(String)
                  : [],
              ai_knowledge_gaps: Array.isArray(st.ai_knowledge_gaps)
                  ? st.ai_knowledge_gaps.map(String)
                  : [],
          }
        : undefined;

    // ── CMO ADVICE ────────────────────────────────────────────────────────────
    const rawCmo = raw.cmo_advice as Record<string, unknown> | undefined;
    let cmo_advice: STPResult["cmo_advice"] | undefined;

    if (rawCmo && typeof rawCmo === "object") {
        const r = (k: string) => (rawCmo as Record<string, unknown>)[k];

        const rk = (obj: unknown, k: string): string =>
            typeof (obj as Record<string, unknown>)?.[k] === "string"
                ? String((obj as Record<string, unknown>)[k])
                : "";

        const mostImp = r("most_important") as Record<string, unknown> | undefined;
        const pitfall = r("biggest_pitfall") as Record<string, unknown> | undefined;
        const opp = r("missed_opportunity") as Record<string, unknown> | undefined;
        const oneThing = r("one_thing") as Record<string, unknown> | undefined;
        const a306090 = r("action_30_60_90") as Record<string, unknown> | undefined;

        const m1 = a306090?.month1 as Record<string, unknown> | undefined;
        const m2 = a306090?.month2 as Record<string, unknown> | undefined;
        const m3 = a306090?.month3 as Record<string, unknown> | undefined;

        cmo_advice = {
            most_important: {
                factor: rk(mostImp, "factor"),
                why_matters: rk(mostImp, "why_matters"),
                evidence: rk(mostImp, "evidence"),
            },
            biggest_pitfall: {
                mistake: rk(pitfall, "mistake"),
                consequence: rk(pitfall, "consequence"),
                instead_do: rk(pitfall, "instead_do"),
            },
            missed_opportunity: {
                gap: rk(opp, "gap"),
                evidence: rk(opp, "evidence"),
                how_to_exploit_90days: rk(opp, "how_to_exploit_90days"),
            },
            one_thing: {
                action: rk(oneThing, "action"),
                why_leverage: rk(oneThing, "why_leverage"),
                kpi_year1: rk(oneThing, "kpi_year1"),
            },
            action_30_60_90: {
                month1: {
                    phase: rk(m1, "phase") || "Xây nền",
                    items: Array.isArray(m1?.items) ? (m1!.items as unknown[]).map(String) : [],
                    reason: rk(m1, "reason"),
                },
                month2: {
                    phase: rk(m2, "phase") || "Kiểm chứng",
                    items: Array.isArray(m2?.items) ? (m2!.items as unknown[]).map(String) : [],
                    kpis: Array.isArray(m2?.kpis) ? (m2!.kpis as unknown[]).map(String) : [],
                },
                month3: {
                    phase: rk(m3, "phase") || "Mở rộng",
                    items: Array.isArray(m3?.items) ? (m3!.items as unknown[]).map(String) : [],
                    goals: Array.isArray(m3?.goals) ? (m3!.goals as unknown[]).map(String) : [],
                },
            },
            ai_unknowns: Array.isArray(rawCmo.ai_unknowns)
                ? (rawCmo.ai_unknowns as unknown[]).map(String)
                : [],
            final_positioning_quote: rk(rawCmo, "final_positioning_quote"),
        };
    }

    const validationStatus =
        raw.validationStatus === "FAIL" || raw.validationStatus === "WARNING"
            ? raw.validationStatus
            : raw.validationStatus === "PASS"
              ? "PASS"
              : "PASS";

    return {
        validationStatus,
        clarificationMessage:
            typeof raw.clarificationMessage === "string" ? raw.clarificationMessage : undefined,
        segmentation: { analysis_approach: analysisApproach, segments },
        targeting: {
            primary_segment: primary,
            selection_rationale: rationale,
            market_fit_score: marketFit,
            growth_potential: growth,
            accessibility:
                typeof tgt.accessibility === "string" && tgt.accessibility.trim()
                    ? tgt.accessibility
                    : "—",
            risks: Array.isArray(tgt.risks) ? tgt.risks.map(String) : [],
            secondary_segments: tgt.secondary_segments,
            segments_to_avoid: tgt.segments_to_avoid,
            targeting_matrix: tgt.targeting_matrix,
        },
        positioning,
        actionPlan,
        strategy,
        cmo_advice,
    };
}

export const generateSTPAnalysis = async (
    input: STPInput,
    onProgress?: (step: string) => void
): Promise<STPResult | null> => {

    // Phase 1: Input Sanity Check (không gọi onProgress — tránh hiển thị trạng thái kiểm tra trên UI STP)

    const sanityPrompt = `### ROLE: Senior Marketing Auditor
Bạn là một Senior Marketing Auditor có nhiệm vụ kiểm tra tính hợp lệ của input trước khi tiến hành phân tích STP.

### INPUT DATA:
- Sản phẩm/Thương hiệu: "${input.productBrand}"
- Ngành hàng: "${input.industry}"
- Mô tả sản phẩm: "${input.productDescription}"
- Khoảng giá: "${input.priceRange}"
- Thị trường địa lý: "${input.targetMarket}"
- Đối thủ trực tiếp: "${input.competitorNames || 'Không có'}"
- Khách hàng hiện tại (mô tả): "${input.currentCustomers || 'Không có'}"
- Lý do khách mua: "${input.purchaseReason || 'Không có'}"
- Lý do khách không mua: "${input.nonPurchaseReason || 'Không có'}"
- Mục tiêu STP: "${input.stpGoal || 'Không nêu'}"
- USP / điểm mạnh thực sự: "${input.uspStrength || 'Không có'}"

### KIỂM TRA (Trả về JSON):
1. **Kiểm tra chi tiết**: Input có đủ CHI TIẾT để phân tích không?
   - SAI: "sản phẩm tốt", "khách hàng trẻ", "giá hợp lý"
   - ĐÚNG: "Cà phê rang xay Highlands", "nữ 25-35 tuổi TP.HCM", "40.000-80.000 VNĐ"

2. **Kiểm tra logic**: Sản phẩm có khớp với ngành hàng không?

3. **Kiểm tra thực tế**: Thông tin có hợp lý, không mâu thuẫn?

### OUTPUT FORMAT (STRICT JSON):
{
  "status": "PASS" | "FAIL" | "WARNING",
  "message": "Lý do cụ thể nếu FAIL/WARNING, hoặc xác nhận nếu PASS",
  "missing_fields": ["field1", "field2"] // Nếu có
}`;

    try {
        const sanityResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'Validate this STP input',
            config: {
                systemInstruction: sanityPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.2
            },
        });

        const sanityText = sanityResponse.text || "{}";
        const sanityResult = JSON.parse(stripJsonFences(sanityText)) as {
            status?: string;
            message?: string;
        };

        if (sanityResult.status === 'FAIL') {
            return {
                validationStatus: 'FAIL',
                clarificationMessage: sanityResult.message,
                segmentation: { analysis_approach: '', segments: [] },
                targeting: { primary_segment: '', selection_rationale: '', market_fit_score: 0, growth_potential: '', accessibility: '', risks: [] },
                positioning: { positioning_statement: '', unique_value_proposition: '', key_differentiators: [], brand_essence: '', competitive_frame: '', reasons_to_believe: [] },
                actionPlan: { immediate_actions: [], marketing_channels: [], messaging_hooks: [] }
            };
        }

        // Phase 2: STP Analysis (không gọi onProgress / không delay — UI chỉ dùng nút "Đang phân tích...")
        const stpPrompt = `Bạn là Giám đốc Marketing cấp cao với 15 năm kinh nghiệm phân tích thị trường và xây dựng chiến lược STP tại Việt Nam.

NGUYÊN TẮC TUYỆT ĐỐI — ĐỌC TRƯỚC KHI LÀM BẤT CỨ ĐIỀU GÌ:
• Chỉ phân tích dựa trên dữ liệu user đã cung cấp bên dưới
• Nếu thiếu dữ liệu để kết luận → ghi rõ "Không đủ dữ liệu: cần thêm [X]" vào mục tương ứng
• NGHIÊM CẤM bịa đặt số liệu, phân khúc, hay hành vi khách hàng
• Mọi Positioning Statement phải dựa trên USP có thật trong input

═══════════════════════════════════════
INPUT — DỮ LIỆU DO USER CUNG CẤP
═══════════════════════════════════════

▌ THÔNG TIN SẢN PHẨM
• Tên thương hiệu / Sản phẩm : ${input.productBrand}
• Ngành hàng                  : ${input.industry}
• Mô tả sản phẩm              : ${input.productDescription}
• Khoảng giá bán              : ${input.priceRange}
• Thị trường địa lý           : ${input.targetMarket}

▌ DỮ LIỆU KHÁCH HÀNG THỰC TẾ
• Khách hàng hiện đang mua    : ${input.currentCustomers || 'Không có'}
• Lý do mua                   : ${input.purchaseReason || 'Không có'}
• Lý do KHÔNG mua             : ${input.nonPurchaseReason || 'Không có'}

▌ BỐI CẢNH CẠNH TRANH
• Đối thủ trực tiếp           : ${input.competitorNames || 'Không có'}
• USP / Điểm mạnh thực sự     : ${input.uspStrength || 'Không có'}
• Mục tiêu STP                : ${input.stpGoal || 'Không có'}

═══════════════════════════════════════
YÊU CẦU PHÂN TÍCH (TIẾNG VIỆT, CHUYÊN NGHIỆP, 1500-2000 CHỮ)
═══════════════════════════════════════

1. SEGMENTATION (Phân khúc thị trường): Xác định 3–4 phân khúc thị trường dựa HOÀN TOÀN vào dữ liệu trên.
2. TARGETING (Chọn thị trường mục tiêu): Đánh giá theo ma trận 4 tiêu chí (Quy mô, Tiếp cận, Cạnh tranh, Phù hợp USP) và chọn phân khúc ưu tiên.
3. POSITIONING (Định vị thương hiệu): Xây dựng Statement chuẩn, ma trận 2x2 và thông điệp theo kênh.
4. CHIẾN LƯỢC & CẢNH BÁO: Rút ra insights, rủi ro, cơ hội và những gì AI không biết.

═══════════════════════════════════════
PHẦN 5 — LỜI KHUYÊN CHIẾN LƯỢC CMO (BẮT BUỘC)
═══════════════════════════════════════

Sau khi hoàn thành S-T-P, xuất ra phần lời khuyên với 4 mục sau.
QUAN TRỌNG: Mọi lời khuyên phải cụ thể cho thương hiệu/ngành này
— NGHIÊM CẤM viết lời khuyên chung chung áp dụng được cho mọi thương hiệu.

5.1 Điều quan trọng nhất phải làm đúng
    • 1 yếu tố quyết định thành bại của chiến lược STP này
    • Tại sao nó quan trọng hơn tất cả những thứ khác
    • Dẫn chứng từ đặc thù ngành / phân khúc đã phân tích

5.2 Cạm bẫy lớn nhất cần tránh
    • 1 sai lầm phổ biến nhất với loại positioning này
    • Hậu quả cụ thể nếu mắc phải
    • Thay vào đó nên làm gì

5.3 Cơ hội đang bị bỏ ngỏ
    • 1 góc định vị hoặc phân khúc mà đối thủ chưa khai thác
    • Phải rút ra từ dữ liệu đối thủ và khoảng trắng đã phân tích
    • Cách khai thác cụ thể trong 90 ngày tới

5.4 Action Priority — 30 · 60 · 90 ngày
    Tháng 1 (Xây nền): 4 việc ưu tiên + lý do làm trước
    Tháng 2 (Kiểm chứng): 4 việc ưu tiên + KPI cần đạt
    Tháng 3 (Mở rộng): 4 việc ưu tiên + mục tiêu cụ thể

5.5 Nếu chỉ được làm 1 điều
    • 1 hành động quan trọng nhất trong 30 ngày đầu
    • Tại sao đây là leverage point cao nhất
    • KPI đề xuất theo dõi cho năm đầu tiên

5.6 Những gì AI KHÔNG BIẾT (BẮT BUỘC — không được bỏ qua)
    • Liệt kê ít nhất 4 điều không thể kết luận vì thiếu dữ liệu
    • Với mỗi điều: ghi rõ cần nghiên cứu thêm bằng phương pháp nào
    • Mục này thể hiện tính trung thực — không được bỏ qua dù output có vẻ đã đầy đủ

─────────────────────────────
Kết thúc toàn bộ output bằng:
1 câu Positioning Statement súc tích nhất (dạng quote)
theo công thức: "Dành cho [target], [thương hiệu] là [category] duy nhất [điểm khác biệt] — [cam kết cụ thể]."

### OUTPUT FORMAT (STRICT JSON, TIẾNG VIỆT):
{
  "validationStatus": "PASS",
  "segmentation": {
    "analysis_approach": "Mô tả ngắn phương pháp phân khúc (Demographics, Psychographics...)",
    "segments": [
      {
        "name": "Tên ngắn gọn, dễ nhớ",
        "description": "Mô tả chi tiết phân khúc",
        "demographics": "Nhân khẩu học (tuổi, giới tính, thu nhập, địa lý)",
        "psychographics": "Tâm lý học (giá trị, thái độ, phong cách sống)",
        "size_estimate": "Ước tính quy mô (hoặc ghi Không đủ dữ liệu)",
        "needs": ["Lý do mua 1", "Lý do mua 2"],
        "behaviors": ["Tần suất", "Kênh mua", "Yếu tố quyết định"],
        "barriers": ["Rào cản 1", "Rào cản 2"]
      }
    ]
  },
  "targeting": {
    "primary_segment": "Tên phân khúc được chọn",
    "selection_rationale": "Lý do chọn dựa trên dẫn chứng cụ thể từ input",
    "market_fit_score": 1-100,
    "growth_potential": "Dựa trên dữ liệu cung cấp",
    "accessibility": "Khả năng tiếp cận phân khúc này",
    "risks": ["Cảnh báo rủi ro cụ thể"],
    "secondary_segments": ["Tên các phân khúc thứ cấp"],
    "segments_to_avoid": ["Tên và lý do cụ thể"],
    "targeting_matrix": [
      {
        "segment_name": "Tên PK",
        "size_score": 1-5,
        "accessibility_score": 1-5,
        "competition_score": 1-5,
        "usp_fit_score": 1-5,
        "total_score": 4-20,
        "rationale": "Giải thích lý do chấm điểm"
      }
    ]
  },
  "positioning": {
    "positioning_statement": "Công thức: Dành cho [target], [tên thương hiệu] là [category] duy nhất [USP] bởi vì [RTB]",
    "unique_value_proposition": "Giá trị độc nhất thực sự",
    "key_differentiators": ["Điểm khác biệt 1", "Điểm khác biệt 2"],
    "brand_essence": "Tinh chất thương hiệu",
    "competitive_frame": "Khung cạnh tranh (so với ai)",
    "reasons_to_believe": ["Bằng chứng 1", "Bằng chứng 2"],
    "matrix_2x2": {
      "x_axis": "Tên trục X (VD: Giá)",
      "y_axis": "Tên trục Y (VD: Chất lượng)",
      "brand_position": { "x": 0-100, "y": 0-100 },
      "competitors": [{ "name": "Đối thủ A", "x": 0-100, "y": 0-100 }]
    },
    "channel_messages": [{ "channel": "Kênh X", "message": "Thông điệp cho kênh X" }],
    "perceptual_map_text": "Mô tả bằng text vị trí tương đối"
  },
  "actionPlan": {
    "immediate_actions": ["Hành động 1", "Hành động 2"],
    "marketing_channels": ["Kênh 1", "Kênh 2"],
    "messaging_hooks": ["Hook 1", "Hook 2"]
  },
  "strategy": {
    "top_insights": ["Insight 1 + dẫn chứng", "Insight 2 + dẫn chứng"],
    "strategic_risks": [{ "issue": "Rủi ro lớn nhất", "mitigation": "Cách giảm thiểu" }],
    "opportunities": ["Cơ hội chưa khai thác"],
    "ai_knowledge_gaps": ["Những gì AI KHÔNG BIẾT vì thiếu dữ liệu"]
  },
  "cmo_advice": {
    "most_important": {
      "factor": "1 yếu tố quyết định thành bại",
      "why_matters": "Tại sao nó quan trọng hơn tất cả",
      "evidence": "Dẫn chứng từ đặc thù ngành / phân khúc"
    },
    "biggest_pitfall": {
      "mistake": "1 sai lầm phổ biến nhất",
      "consequence": "Hậu quả cụ thể nếu mắc phải",
      "instead_do": "Thay vào đó nên làm gì"
    },
    "missed_opportunity": {
      "gap": "1 góc định vị / phân khúc đối thủ chưa khai thác",
      "evidence": "Từ dữ liệu đối thủ và khoảng trắng đã phân tích",
      "how_to_exploit_90days": "Cách khai thác cụ thể trong 90 ngày"
    },
    "one_thing": {
      "action": "1 hành động quan trọng nhất trong 30 ngày đầu",
      "why_leverage": "Tại sao đây là leverage point cao nhất",
      "kpi_year1": "KPI đề xuất theo dõi cho năm đầu tiên"
    },
    "action_30_60_90": {
      "month1": {
        "phase": "Xây nền",
        "items": ["Việc ưu tiên 1", "Việc ưu tiên 2", "Việc ưu tiên 3", "Việc ưu tiên 4"],
        "reason": "Lý do làm trước"
      },
      "month2": {
        "phase": "Kiểm chứng",
        "items": ["Việc ưu tiên 1", "Việc ưu tiên 2", "Việc ưu tiên 3", "Việc ưu tiên 4"],
        "kpis": ["KPI 1", "KPI 2"]
      },
      "month3": {
        "phase": "Mở rộng",
        "items": ["Việc ưu tiên 1", "Việc ưu tiên 2", "Việc ưu tiên 3", "Việc ưu tiên 4"],
        "goals": ["Mục tiêu 1", "Mục tiêu 2"]
      }
    },
    "ai_unknowns": ["Điều 1 không thể kết luận + cần phương pháp nghiên cứu", "Điều 2...", "Điều 3...", "Điều 4..."],
    "final_positioning_quote": "Dành cho [target], [thương hiệu] là [category] duy nhất [điểm khác biệt] — [cam kết cụ thể]."
  }
}

⚠️ QUAN TRỌNG:
• Phần 'Những gì AI không biết' trong strategy là BẮT BUỘC.
• Phần cmo_advice là BẮT BUỘC — viết càng cụ thể cho ngành/thương hiệu này càng tốt.
• Positioning statement cuối cùng phải thật súc tích, 1 câu duy nhất.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Phân tích STP cho "${input.productBrand}" trong ngành "${input.industry}"`,
            config: {
                systemInstruction: stpPrompt,
                responseMimeType: "application/json",
                safetySettings: SAFETY_SETTINGS,
                temperature: 0.6
            },
        });

        const text = response.text || "{}";
        const parsed = JSON.parse(stripJsonFences(text)) as Record<string, unknown>;
        const result = normalizeSTPResult(parsed);

        // Add warning status if sanity check returned warning
        if (sanityResult.status === "WARNING") {
            result.validationStatus = "WARNING";
            result.clarificationMessage = sanityResult.message;
        }

        return result;
    } catch (error) {
        console.error("STP Analysis Error:", error);
        return null;
    }
};

