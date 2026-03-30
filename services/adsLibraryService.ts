/**
 * Facebook Ads Library API Service
 * Allows searching ads from ANY page (public data, no special permissions needed)
 */

interface AdsLibraryAd {
    id: string;
    ad_creation_time: string;
    ad_creative_bodies?: string[];
    ad_creative_link_captions?: string[];
    ad_creative_link_titles?: string[];
    ad_delivery_start_time: string;
    ad_delivery_stop_time?: string;
    ad_snapshot_url: string;
    currency?: string;
    funding_entity?: string;
    page_id: string;
    page_name: string;
    publisher_platforms: string[];
    impressions?: {
        lower_bound: string;
        upper_bound: string;
    };
    spend?: {
        lower_bound: string;
        upper_bound: string;
    };
}

interface AdsLibraryResponse {
    data: AdsLibraryAd[];
    paging?: {
        cursors: {
            before: string;
            after: string;
        };
        next?: string;
    };
}

export class AdsLibraryService {
    private static readonly GRAPH_API_VERSION = 'v18.0';
    private static readonly BASE_URL = `https://graph.facebook.com/${this.GRAPH_API_VERSION}`;

    private static getAccessToken(): string {
        // Ads Library chỉ cần App Token (App ID + App Secret)
        const appId = import.meta.env.VITE_FB_APP_ID;
        const appSecret = import.meta.env.VITE_FB_APP_SECRET;

        if (!appId || !appSecret) {
            throw new Error('Missing VITE_FB_APP_ID or VITE_FB_APP_SECRET in .env.local');
        }

        return `${appId}|${appSecret}`;
    }

    /**
     * Search ads by Page ID or Page Name
     * Public API - works for ANY page!
     */
    static async searchAdsByPage(
        pageIdentifier: string,
        options: {
            country?: string;
            limit?: number;
            isActive?: boolean;
        } = {}
    ): Promise<AdsLibraryAd[]> {
        try {
            const {
                country = 'VN', // Default Vietnam
                limit = 50,
                isActive = true
            } = options;

            const token = this.getAccessToken();

            // Build query params
            const params = new URLSearchParams({
                access_token: token,
                ad_reached_countries: `["${country}"]`,
                fields: [
                    'id',
                    'ad_creation_time',
                    'ad_creative_bodies',
                    'ad_creative_link_captions',
                    'ad_creative_link_titles',
                    'ad_delivery_start_time',
                    'ad_delivery_stop_time',
                    'ad_snapshot_url',
                    'currency',
                    'funding_entity',
                    'page_id',
                    'page_name',
                    'publisher_platforms',
                    'impressions',
                    'spend'
                ].join(','),
                limit: limit.toString(),
                ad_active_status: isActive ? 'ACTIVE' : 'ALL'
            });

            // Try to search by page ID first, then by search term
            let url: string;
            if (/^\d+$/.test(pageIdentifier)) {
                // Numeric ID - search by page ID
                params.append('search_page_ids', `["${pageIdentifier}"]`);
                url = `${this.BASE_URL}/ads_archive?${params.toString()}`;
            } else {
                // Name or keyword - search by term
                params.append('search_terms', `"${pageIdentifier}"`);
                url = `${this.BASE_URL}/ads_archive?${params.toString()}`;
            }

            console.log('🔍 Searching Ads Library for:', pageIdentifier);

            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                console.error('Ads Library API Error:', error);

                if (error.error?.code === 100) {
                    throw new Error('Token không hợp lệ. Kiểm tra VITE_FB_APP_ID và VITE_FB_APP_SECRET.');
                }

                throw new Error(error.error?.message || 'Failed to fetch ads');
            }

            const result: AdsLibraryResponse = await response.json();

            console.log(`✅ Found ${result.data?.length || 0} ads`);

            return result.data || [];
        } catch (error: any) {
            console.error('Error searching ads:', error);
            throw error;
        }
    }

    /**
     * Get Page Info from first ad (approximation, since we can't access page directly)
     */
    static async getPageInfoFromAds(
        pageIdentifier: string
    ): Promise<{ pageId: string; pageName: string; totalActiveAds: number } | null> {
        try {
            const ads = await this.searchAdsByPage(pageIdentifier, { limit: 1, isActive: true });

            if (ads.length === 0) {
                // Try inactive ads
                const inactiveAds = await this.searchAdsByPage(pageIdentifier, { limit: 1, isActive: false });
                if (inactiveAds.length === 0) {
                    return null;
                }

                return {
                    pageId: inactiveAds[0].page_id,
                    pageName: inactiveAds[0].page_name,
                    totalActiveAds: 0
                };
            }

            // Count total active ads
            const allActiveAds = await this.searchAdsByPage(pageIdentifier, { limit: 100, isActive: true });

            return {
                pageId: ads[0].page_id,
                pageName: ads[0].page_name,
                totalActiveAds: allActiveAds.length
            };
        } catch (error) {
            console.error('Error getting page info:', error);
            return null;
        }
    }

    /**
     * Analyze ads for insights
     */
    static analyzeAds(ads: AdsLibraryAd[]) {
        const platforms = new Set<string>();
        const ctaTypes = new Map<string, number>();
        const activeCount = ads.filter(ad => !ad.ad_delivery_stop_time).length;

        ads.forEach(ad => {
            ad.publisher_platforms?.forEach(p => platforms.add(p));

            // Infer CTA from titles/captions
            const title = ad.ad_creative_link_titles?.[0] || '';
            const caption = ad.ad_creative_link_captions?.[0] || '';

            if (title.toLowerCase().includes('shop') || caption.toLowerCase().includes('mua')) {
                ctaTypes.set('Shop Now', (ctaTypes.get('Shop Now') || 0) + 1);
            } else if (title.toLowerCase().includes('learn') || caption.toLowerCase().includes('tìm hiểu')) {
                ctaTypes.set('Learn More', (ctaTypes.get('Learn More') || 0) + 1);
            } else if (title.toLowerCase().includes('sign') || caption.toLowerCase().includes('đăng ký')) {
                ctaTypes.set('Sign Up', (ctaTypes.get('Sign Up') || 0) + 1);
            } else {
                ctaTypes.set('Other', (ctaTypes.get('Other') || 0) + 1);
            }
        });

        return {
            totalAds: ads.length,
            activeAds: activeCount,
            platforms: Array.from(platforms),
            ctaDistribution: Object.fromEntries(ctaTypes),
            avgImpressionsRange: ads.length > 0
                ? {
                    lower: Math.round(ads.reduce((sum, ad) => sum + parseInt(ad.impressions?.lower_bound || '0'), 0) / ads.length),
                    upper: Math.round(ads.reduce((sum, ad) => sum + parseInt(ad.impressions?.upper_bound || '0'), 0) / ads.length)
                }
                : null
        };
    }
}
