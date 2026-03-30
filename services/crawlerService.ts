/**
 * Crawler Service
 * Uses a CORS Proxy to fetch website HTML and parse metadata.
 */

export interface ScanResult {
    name: string;
    description: string;
    logoUrl: string;
    brandColor: string;
}

export const scanWebsite = async (urlInput: string): Promise<ScanResult> => {
    // Normalize URL
    let url = urlInput.trim();
    if (!url.startsWith('http')) {
        url = 'https://' + url;
    }

    // Helper to try fetching with a proxy
    const fetchWithProxy = async (proxyUrl: string) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout per proxy

        try {
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (!response.ok) throw new Error(`Proxy error: ${response.status}`);
            
            // Handle different proxy response formats
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                const data = await response.json();
                return data.contents || data.html || data.data || ""; // Adapts to allorigins or others
            } else {
                return await response.text(); // Direct text return (corsproxy.io, codetabs)
            }
        } catch (e) {
            clearTimeout(timeoutId);
            throw e;
        }
    };

    try {
        let htmlContent = "";
        
        // PROXY CHAIN STRATEGY
        const proxies = [
            `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
            `https://corsproxy.io/?${encodeURIComponent(url)}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
            // `https://thingproxy.freeboard.io/fetch/${url}` // Often reliable but sometimes slow
        ];

        let success = false;
        for (const proxy of proxies) {
            try {
                console.log(`Trying proxy: ${proxy}`);
                htmlContent = await fetchWithProxy(proxy);
                if (htmlContent && htmlContent.length > 100) { // Basic validation
                    success = true;
                    break; 
                }
            } catch (e) {
                console.warn(`Proxy failed: ${proxy}`, e);
                continue; // Try next proxy
            }
        }

        if (!success || !htmlContent) {
             throw new Error("All proxies failed to retrieve content");
        }

        // 2. Parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");

        // 3. Extract Metadata helpers
        const getMeta = (prop: string) => {
            return doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') || 
                   doc.querySelector(`meta[name="${prop}"]`)?.getAttribute('content') || "";
        };

        const resolveUrl = (relativeUrl: string | null | undefined) => {
            if (!relativeUrl) return "";
            if (relativeUrl.startsWith('http')) return relativeUrl;
            if (relativeUrl.startsWith('//')) return `https:${relativeUrl}`;
            try {
                return new URL(relativeUrl, url).href;
            } catch (e) {
                return relativeUrl;
            }
        };

        // 4. Extraction Logic
        
        // NAME
        let name = getMeta('og:site_name');
        if (!name) {
            const title = doc.querySelector('title')?.textContent || "";
            // Try to clean title (e.g. "Shopee Việt Nam | Mua và Bán..." -> "Shopee Việt Nam")
            const separators = ['|', '-', '–', '—', ':'];
            let cleanName = title;
            for (const sep of separators) {
                if (cleanName.includes(sep)) {
                    cleanName = cleanName.split(sep)[0];
                    break; // Take first part only
                }
            }
            name = cleanName.trim();
        }

        // DESCRIPTION / USP
        const description = getMeta('description') || getMeta('og:description');

        // LOGO
        let logoUrl = getMeta('og:image');
        // If og:image is generic or missing, try icons
        const iconLink = doc.querySelector('link[rel="icon"]') || doc.querySelector('link[rel="shortcut icon"]') || doc.querySelector('link[rel="apple-touch-icon"]');
        
        // Prefer favicon if available and og:image is not found, or if we want to show logo specifically (og:image is often a banner)
        // For this "Logo" field, a favicon is often safer than a random banner image
        if (iconLink) {
             // But if we have og:image, maybe use it as backup? 
             // Actually for a "Company Logo" field, Clearbit is usually best.
             // Let's try Clearbit first as primary source for clean logos if possible.
             logoUrl = ""; // Reset to force fallback logic below unless specifically strong signal
        }
        
        if (iconLink && !logoUrl) {
            logoUrl = iconLink.getAttribute('href') || "";
        }

        // Resolve relative URLs
        logoUrl = resolveUrl(logoUrl);

        // Fallback to Clearbit if no logo found on page OR to get a cleaner logo
        // Note: We intentionally prioritize Clearbit for logos as og:image is often a marketing banner
        try {
            const domain = new URL(url).hostname;
            // Create a promise to check clearbit availability
            const clearbitUrl = `https://logo.clearbit.com/${domain}`;
            const checkImg = new Image();
            checkImg.src = clearbitUrl;
            await new Promise((resolve, reject) => {
                checkImg.onload = resolve;
                checkImg.onerror = reject;
            });
            logoUrl = clearbitUrl; // If load successful, use it
        } catch(e) {
            // Keep original logoUrl if Clearbit fails
        }

        // BRAND COLOR (Basic heuristic: find most common color or theme color meta)
        let brandColor = getMeta('theme-color');
        if (!brandColor) {
            brandColor = "#000000"; // Default
        }

        return {
            name: name || urlInput,
            description: description || "Chưa tìm thấy mô tả.",
            logoUrl: logoUrl,
            brandColor: brandColor
        };

    } catch (error) {
        console.error("Scan Failed:", error);
        // Fallback if scan fails completely
        return {
            name: urlInput,
            description: "Không thể quét tự động (Lỗi mạng hoặc CORS). Vui lòng nhập thủ công.",
            logoUrl: "",
            brandColor: "#000000"
        };
    }
};