import path from 'path';
import type { ClientRequest } from 'http';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Key Gemini đọc trên Node (giống loadEnv) — dùng cho dev proxy, không phụ thuộc bundle client. */
function readGeminiKeyForProxy(e: Record<string, string>): string {
  const raw = e.VITE_GEMINI_API_KEY || e.GEMINI_API_KEY || '';
  return String(raw)
    .trim()
    .replace(/^\uFEFF/, '')
    .replace(/^["']|['"]$/g, '');
}

export default defineConfig(({ mode }) => {
  // cwd = thư mục gốc project — luôn đọc .env / .env.local đúng chỗ (kể cả khi chạy vite từ thư mục khác)
  const env = loadEnv(mode, process.cwd(), '');
  const geminiProxyKey = readGeminiKeyForProxy(env);

  if (mode === 'development' && !geminiProxyKey) {
    console.warn(
      '[vite] Chưa có VITE_GEMINI_API_KEY / GEMINI_API_KEY trong .env hoặc .env.local — proxy Gemini không gắn được key.'
    );
  }

  return {
    /** Cho phép import.meta.env.GEMINI_API_KEY (không bắt buộc tiền tố VITE_) */
    envPrefix: ['VITE_', 'GEMINI_'],
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        // Dev: browser gọi same-origin → Vite proxy chèn x-goog-api-key từ .env (tránh client không nhận được import.meta.env)
        '/gemini-api': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          secure: true,
          // AI generation can take 30-90s on free tier — timeout phải đủ lớn.
          timeout: 120000,      // 120s — thời gian chờ response từ Google
          proxyTimeout: 120000, // 120s — thời gian proxy giữ kết nối
          rewrite: (p) => p.replace(/^\/gemini-api/, ''),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq: ClientRequest) => {
              if (geminiProxyKey) {
                proxyReq.setHeader('x-goog-api-key', geminiProxyKey);

                const maskedKey = `${geminiProxyKey.slice(0, 4)}...${geminiProxyKey.slice(-4)}`;
                console.info(`[Gemini Proxy] Attaching API Key: ${maskedKey}`);
              } else {
                console.error('[Gemini Proxy] No API Key found in .env / .env.local!');
              }
            });
            // Log proxy errors to help debug connectivity
            proxy.on('error', (err, _req, res) => {
              console.error('[Gemini Proxy] Error:', err.message);
            });
          },
        },
      },
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
