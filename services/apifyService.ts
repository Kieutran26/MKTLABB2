/**
 * Apify API Service
 * Uses Apify's Facebook Page Scraper actor to get REAL data from any page
 * Docs: https://apify.com/apify/facebook-pages-scraper
 */

interface ApifyPageResult {
    pageId: string;
    name: string;
    verified?: boolean;
    category?: string;
    likes?: number;
    followers?: number;
    about?: string;
    website?: string;
    email?: string;
    phone?: string;
    posts?: Array<{
        postId: string;
        text: string;
        type: string;
        url: string;
        time: string;
        shares?: number;
        comments?: number;
        likes?: number;
        reactions?: number;
        images?: string[];
        video?: string;
    }>;
}

export class ApifyService {
    private static readonly APIFY_API_BASE = 'https://api.apify.com/v2';
    // private static readonly ACTOR_ID = 'apify/facebook-pages-scraper'; // Deprecated
    private static readonly ACTOR_ID = 'apify/facebook-posts-scraper';

    private static getApiToken(): string {
        const token = import.meta.env.VITE_APIFY_API_TOKEN;
        if (!token) {
            throw new Error('Missing VITE_APIFY_API_TOKEN in .env.local');
        }
        return token;
    }

    /**
     * Scrape Facebook Page using direct Apify REST API (No Backend Required)
     */
    static async scrapeFacebookPage(
        pageUrl: string,
        options: {
            maxPosts?: number;
        } = {}
    ): Promise<ApifyPageResult | null> {
        try {
            const { maxPosts = 30 } = options;
            const token = this.getApiToken();

            console.log(`🔍 Starting Apify Actor for: ${pageUrl} (Limit: ${maxPosts} posts)`);

            // 1. Start the Actor Run (apify/facebook-posts-scraper)
            // We use posts scraper as it's faster and we can extract page info from it
            const startUrl = `${this.APIFY_API_BASE}/acts/apify~facebook-posts-scraper/runs?token=${token}`;

            const runResponse = await fetch(startUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startUrls: [{ url: pageUrl }],
                    resultsLimit: maxPosts,
                    view: 'Detailed' // Request detailed view for better metadata
                })
            });

            if (!runResponse.ok) {
                const err = await runResponse.json();
                // Handle credit limits or other API errors
                throw new Error(`Failed to start Apify run: ${err.error?.message || runResponse.statusText}`);
            }

            const runData = await runResponse.json();
            const runId = runData.data.id;
            const defaultDatasetId = runData.data.defaultDatasetId;

            console.log(`🚀 Apify Run Started. ID: ${runId}`);

            // 2. Poll for completion
            // We'll check every 3 seconds
            let isRunning = true;
            let attempts = 0;
            const MAX_ATTEMPTS = 100; // 5 minutes max (3s interval)

            while (isRunning && attempts < MAX_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3s
                attempts++;

                const statusUrl = `${this.APIFY_API_BASE}/actor-runs/${runId}?token=${token}`;
                const statusRes = await fetch(statusUrl);
                if (!statusRes.ok) continue; // Skip error in polling

                const statusData = await statusRes.json();
                const status = statusData.data.status;

                console.log(`⏳ Run Status (${attempts}/${MAX_ATTEMPTS}): ${status}`);

                if (status === 'SUCCEEDED') {
                    isRunning = false;
                } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
                    throw new Error(`Apify run failed with status: ${status}`);
                }
            }

            if (isRunning) {
                throw new Error('Apify run timed out after 5 minutes');
            }

            console.log('✅ Run Succeeded. Fetching dataset...');

            // 3. Fetch Results from Dataset
            const datasetUrl = `${this.APIFY_API_BASE}/datasets/${defaultDatasetId}/items?token=${token}`;
            const datasetRes = await fetch(datasetUrl);
            const items = await datasetRes.json();

            if (!Array.isArray(items) || items.length === 0) {
                console.warn('⚠️ No items returned from Apify');
                return null;
            }

            // --- DATA MAPPING (Same logic as before) ---

            // Try to find the Page Info object (usually has 'categories' or 'followers' at top level)
            // If not found, fall back to extracting from the first post
            let pageInfo = items.find(i => i.categories || i.username || (i.likes && !i.postId)) || items[0];

            // Handle case where items[0] is a Post and we need to extract author info
            const isPost = !!(pageInfo.postId || pageInfo.text);
            if (isPost) {
                console.log('⚠️ Page info missing, extracting from post metadata');
                // Common Apify post structures:
                // 1. user: { name: '...', ... }
                // 2. pageName: '...'
                // 3. author: { name: '...', ... }
                const authorName = pageInfo.user?.name || pageInfo.pageName || pageInfo.author?.name || pageInfo.name;
                const authorUrl = pageInfo.user?.profileUrl || pageInfo.url || pageInfo.pageUrl;

                // Construct a partial page info from post data
                pageInfo = {
                    ...pageInfo, // keep other props just in case
                    name: authorName, // Critical fix for "Unknown Page"
                    url: authorUrl,
                    category: 'Brand Page', // Fallback since posts don't show category
                    followers: pageInfo.user?.followers || 0,
                    verified: pageInfo.user?.verified || false
                };
            }

            console.log(`✅ Mapping data for Page: ${pageInfo.name}`);

            return {
                pageId: pageInfo.id || pageInfo.pageId || pageInfo.user?.id, // Try user.id if post
                name: pageInfo.name,
                verified: pageInfo.verified,
                category: pageInfo.categories?.[0] || pageInfo.category || 'Page',
                likes: pageInfo.likes,
                followers: pageInfo.followers,
                about: pageInfo.about || pageInfo.intro,
                website: pageInfo.website,
                email: pageInfo.email,
                phone: pageInfo.phone,
                // The items array IS the list of posts (filter out the page object if present)
                posts: items.filter(i => !!i.postId || !!i.text)
            };

        } catch (error: any) {
            console.error('Apify direct API error:', error);
            throw error;
        }
    }

    /**
     * Scrape TikTok Profile using clockworks/tiktok-scraper
     */
    static async scrapeTikTokProfile(
        usernameOrUrl: string,
        options: {
            maxPosts?: number;
        } = {}
    ): Promise<any | null> {
        try {
            const { maxPosts = 30 } = options;
            const token = this.getApiToken();

            // Clean username (remove @/url)
            // If URL is provided, extract username
            let username = usernameOrUrl;
            if (usernameOrUrl.includes('tiktok.com')) {
                const match = usernameOrUrl.match(/@([a-zA-Z0-9_.-]+)/);
                if (match) username = match[1];
            }
            username = username.replace('@', '');

            console.log(`🔍 Starting TikTok Scraper for: ${username} (Limit: ${maxPosts} posts)`);

            // 1. Start the Actor Run (clockworks/tiktok-scraper)
            // https://apify.com/clockworks/tiktok-scraper
            const startUrl = `${this.APIFY_API_BASE}/acts/clockworks~tiktok-scraper/runs?token=${token}`;

            const runResponse = await fetch(startUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    profiles: [username],
                    resultsPerPage: maxPosts,
                    shouldDownloadVideos: false,
                    shouldDownloadCovers: true,
                })
            });

            if (!runResponse.ok) {
                const err = await runResponse.json();
                throw new Error(`Failed to start Apify run: ${err.error?.message || runResponse.statusText}`);
            }

            const runData = await runResponse.json();
            const runId = runData.data.id;
            const defaultDatasetId = runData.data.defaultDatasetId;

            console.log(`🚀 TikTok Run Started. ID: ${runId}`);

            // 2. Poll for completion
            // We'll check every 3 seconds
            let isRunning = true;
            let attempts = 0;
            const MAX_ATTEMPTS = 100;

            while (isRunning && attempts < MAX_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;

                const statusUrl = `${this.APIFY_API_BASE}/actor-runs/${runId}?token=${token}`;
                const statusRes = await fetch(statusUrl);
                if (!statusRes.ok) continue;

                const statusData = await statusRes.json();
                const status = statusData.data.status;

                console.log(`⏳ TikTok Run Status (${attempts}/${MAX_ATTEMPTS}): ${status}`);

                if (status === 'SUCCEEDED') {
                    isRunning = false;
                } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
                    throw new Error(`Apify tiktok run failed with status: ${status}`);
                }
            }

            if (isRunning) {
                throw new Error('TikTok run timed out after 5 minutes');
            }

            console.log('✅ TikTok Run Succeeded. Fetching dataset...');

            // 3. Fetch Results from Dataset
            const datasetUrl = `${this.APIFY_API_BASE}/datasets/${defaultDatasetId}/items?token=${token}`;
            const datasetRes = await fetch(datasetUrl);
            const items = await datasetRes.json();

            // clockworks/tiktok-scraper usually returns items where type="profile" or type="video"
            // We need to separate them

            if (!Array.isArray(items) || items.length === 0) {
                console.warn('⚠️ No items returned from TikTok scraper');
                return null;
            }

            return items;

        } catch (error: any) {
            console.error('Apify TikTok API error:', error);
            throw error;
        }
    }

    /**
     * Scrape Google Search Results using apify/google-search-scraper
     * Focus on extracting Ads (Paid Results)
     */
    static async scrapeGoogleSearch(
        queries: string[],
        options: {
            maxResults?: number;
            countryCode?: string;
        } = {}
    ): Promise<any | null> {
        try {
            const { maxResults = 20, countryCode = 'vn' } = options;
            const token = this.getApiToken();

            console.log(`🔍 Starting Google Search Scraper for: ${queries.join(', ')}`);

            // 1. Start the Actor Run (apify/google-search-scraper)
            const startUrl = `${this.APIFY_API_BASE}/acts/apify~google-search-scraper/runs?token=${token}`;

            const runResponse = await fetch(startUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    queries: queries.join('\n'), // Actor expects queries separated by newlines
                    resultsPerPage: maxResults,
                    countryCode: countryCode,
                    languageCode: 'vi', // Default to Vietnamese
                    maxPagesPerQuery: 1, // Only need first page for ads usually
                    saveHtml: false,
                    saveHtmlToKeyValueStore: false
                })
            });

            if (!runResponse.ok) {
                const err = await runResponse.json();
                throw new Error(`Failed to start Apify run: ${err.error?.message || runResponse.statusText}`);
            }

            const runData = await runResponse.json();
            const runId = runData.data.id;
            const defaultDatasetId = runData.data.defaultDatasetId;

            console.log(`🚀 Google Search Run Started. ID: ${runId}`);

            // 2. Poll for completion
            let isRunning = true;
            let attempts = 0;
            const MAX_ATTEMPTS = 100;

            while (isRunning && attempts < MAX_ATTEMPTS) {
                await new Promise(resolve => setTimeout(resolve, 3000));
                attempts++;

                const statusUrl = `${this.APIFY_API_BASE}/actor-runs/${runId}?token=${token}`;
                const statusRes = await fetch(statusUrl);
                if (!statusRes.ok) continue;

                const statusData = await statusRes.json();
                const status = statusData.data.status;

                console.log(`⏳ Google Run Status (${attempts}/${MAX_ATTEMPTS}): ${status}`);

                if (status === 'SUCCEEDED') {
                    isRunning = false;
                } else if (status === 'FAILED' || status === 'ABORTED' || status === 'TIMED-OUT') {
                    throw new Error(`Apify google run failed with status: ${status}`);
                }
            }

            if (isRunning) {
                throw new Error('Google run timed out after 5 minutes');
            }

            console.log('✅ Google Run Succeeded. Fetching dataset...');

            // 3. Fetch Results from Dataset
            const datasetUrl = `${this.APIFY_API_BASE}/datasets/${defaultDatasetId}/items?token=${token}`;
            const datasetRes = await fetch(datasetUrl);
            const items = await datasetRes.json();

            if (!Array.isArray(items) || items.length === 0) {
                console.warn('⚠️ No items returned from Google scraper');
                return null;
            }

            return items;

        } catch (error: any) {
            console.error('Apify Google Search API error:', error);
            throw error;
        }
    }

    /**
     * Get account info (credits remaining)
     */
    static async getAccountInfo(): Promise<{ credits: number } | null> {
        try {
            const token = this.getApiToken();

            const response = await fetch(
                `${this.APIFY_API_BASE}/users/me?token=${token}`
            );

            if (!response.ok) return null;

            const data = await response.json();
            return {
                credits: data.data.usageCycle?.availableCredits || 0
            };
        } catch (error) {
            console.error('Error getting Apify account info:', error);
            return null;
        }
    }
}
