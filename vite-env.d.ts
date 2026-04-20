/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** Thiếu trong .env → undefined tại runtime */
    readonly VITE_GEMINI_API_KEY?: string
    /** Tùy chọn: cùng key Gemini, không cần tiền tố VITE_ (cần envPrefix trong vite.config) */
    readonly GEMINI_API_KEY?: string
    readonly VITE_OPENAI_API_KEY?: string
    readonly OPENAI_API_KEY?: string
    readonly VITE_OPENAI_MODEL?: string
    readonly VITE_BACKEND_URL?: string
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
