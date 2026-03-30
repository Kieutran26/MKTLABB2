/**
 * Outscraper API Service
 * Fetches REAL Facebook page data from any public page
 */

interface OutscraperPost {
    post_id: string;
    post_text: string;
    post_time: string;
    reactions?: number;
    comments?: number;
    shares?: number;
    post_url?: string;
    media_url?: string;
    media_type?: string;
}

interface OutscraperPageData {
    page_id: string;
    name: string;
    category?: string;
    followers?: number;
    likes?: number;
    website?: string;
    email?: string;
    phone?: string;
    about?: string;
    posts?: OutscraperPost[];
}

export class OutscraperService {
    private static readonly API_BASE = 'https://api.app.outscraper.com';

    private static getApiKey(): string {
        const key = import.meta.env.VITE_OUTSCRAPER_API_KEY;
        if (!key) {
            throw new Error('Missing VITE_OUTSCRAPER_API_KEY in .env.local');
        }
        return key;
    }

    /**
     * Scrape Facebook Page data including posts
     * Works for ANY public page!
     */
    static async scrapeFacebookPage(
        pageUrl: string,
        options: {
            postsCount?: number;
        } = {}
    ): Promise<OutscraperPageData | null> {
        try {
            const { postsCount = 30 } = options;
            const apiKey = this.getApiKey();

            console.log('🔍 Outscraper: Fetching page data for:', pageUrl);

            // Outscraper Facebook Pages Scraper endpoint
            const params = new URLSearchParams({
                query: pageUrl,
                posts: postsCount.toString(),
                async: 'false' // Synchronous request
            });

            const url = `${this.API_BASE}/facebook-pages?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Outscraper API Error:', errorText);

                if (response.status === 401) {
                    throw new Error('API key không hợp lệ. Kiểm tra VITE_OUTSCRAPER_API_KEY.');
                }

                if (response.status === 429) {
                    throw new Error('Đã hết quota API. Upgrade plan hoặc đợi reset.');
                }

                throw new Error(`Outscraper API error: ${response.status}`);
            }

            const result = await response.json();

            // Outscraper returns array of results
            if (!result || !result.data || result.data.length === 0) {
                console.warn('No data returned from Outscraper');
                return null;
            }

            const pageData = result.data[0];
            console.log(`✅ Got page: ${pageData.name} with ${pageData.posts?.length || 0} posts`);

            return pageData;

        } catch (error: any) {
            console.error('Error scraping with Outscraper:', error);
            throw error;
        }
    }

    /**
     * Check if API key is valid
     */
    static async validateApiKey(): Promise<boolean> {
        try {
            const apiKey = this.getApiKey();

            // Try a minimal request to check quota/validity
            const response = await fetch(`${this.API_BASE}/profile`, {
                headers: { 'X-API-KEY': apiKey }
            });

            return response.ok;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }

    /**
     * Get remaining quota
     */
    static async getQuota(): Promise<{ remaining: number; limit: number } | null> {
        try {
            const apiKey = this.getApiKey();

            const response = await fetch(`${this.API_BASE}/profile`, {
                headers: { 'X-API-KEY': apiKey }
            });

            if (!response.ok) return null;

            const data = await response.json();
            return {
                remaining: data.credits_left || 0,
                limit: data.credits_limit || 0
            };
        } catch (error) {
            console.error('Error getting quota:', error);
            return null;
        }
    }
}
