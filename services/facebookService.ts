interface FBPageData {
    id: string;
    name: string;
    category: string;
    fan_count: number;
    followers_count: number;
    website?: string;
    emails?: string[];
    phone?: string;
    about?: string;
}

interface FBPost {
    id: string;
    message?: string;
    created_time: string;
    likes?: { summary: { total_count: number } };
    comments?: { summary: { total_count: number } };
    permalink_url: string;
    attachments?: {
        data: Array<{
            type: string;
            media?: { image?: { src: string } };
            media_type?: string;
        }>;
    };
}

interface FBAdData {
    id: string;
    creative?: {
        body?: string;
        call_to_action_type?: string;
        image_url?: string;
    };
    status: string;
}

export class FacebookService {
    private static readonly GRAPH_API_VERSION = 'v18.0';
    private static readonly BASE_URL = `https://graph.facebook.com/${this.GRAPH_API_VERSION}`;

    private static getAccessToken(): string {
        const token = import.meta.env.VITE_FB_PAGE_ACCESS_TOKEN;
        if (!token) {
            throw new Error('Facebook Page Access Token not found in environment variables');
        }
        return token;
    }

    /**
     * Extract Page ID from Facebook URL
     * Supports: facebook.com/pagename, facebook.com/pages/123456, fb.me/pagename
     */
    static extractPageId(url: string): string {
        // Remove protocol and www
        let cleaned = url.replace(/^https?:\/\/(www\.)?/, '');

        // Remove facebook.com/ or fb.me/
        cleaned = cleaned.replace(/^(facebook\.com|fb\.me)\//, '');

        // Remove trailing slash and query params
        cleaned = cleaned.split('?')[0].split('/')[0];

        return cleaned;
    }

    /**
     * Fetch Page Profile Data
     */
    static async fetchPageProfile(pageIdOrUrl: string): Promise<FBPageData | null> {
        try {
            const pageId = this.extractPageId(pageIdOrUrl);
            const token = this.getAccessToken();

            const fields = [
                'id',
                'name',
                'category',
                'fan_count',
                'followers_count',
                'website',
                'emails',
                'phone',
                'about'
            ].join(',');

            const url = `${this.BASE_URL}/${pageId}?fields=${fields}&access_token=${token}`;

            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                console.error('Facebook API Error:', error);

                // Provide specific error messages
                if (error.error?.code === 10) {
                    throw new Error(
                        'Token thiếu quyền "pages_read_engagement". ' +
                        'Hãy vào Graph API Explorer → Generate Token → Tick permission này → Generate lại token.'
                    );
                }

                if (error.error?.code === 190) {
                    throw new Error('Access Token không hợp lệ hoặc đã hết hạn. Hãy lấy token mới.');
                }

                if (error.error?.message?.includes('Unsupported get request')) {
                    throw new Error(
                        `Page ID "${pageId}" không tồn tại hoặc token không có quyền truy cập page này. ` +
                        'Đảm bảo bạn là admin của page.'
                    );
                }

                throw new Error(error.error?.message || 'Failed to fetch page data');
            }

            const data: FBPageData = await response.json();
            return data;
        } catch (error: any) {
            console.error('Error fetching page profile:', error);
            throw error; // Re-throw to show in UI
        }
    }

    /**
     * Fetch Page Posts (last 30 posts)
     */
    static async fetchPagePosts(pageIdOrUrl: string, limit: number = 30): Promise<FBPost[]> {
        try {
            const pageId = this.extractPageId(pageIdOrUrl);
            const token = this.getAccessToken();

            const fields = [
                'id',
                'message',
                'created_time',
                'permalink_url',
                'attachments{media,media_type,type}',
                'likes.summary(true)',
                'comments.summary(true)'
            ].join(',');

            const url = `${this.BASE_URL}/${pageId}/posts?fields=${fields}&limit=${limit}&access_token=${token}`;

            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                console.error('Facebook API Error:', error);
                throw new Error(error.error?.message || 'Failed to fetch posts');
            }

            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.error('Error fetching posts:', error);
            return [];
        }
    }

    /**
     * Fetch Ads from Ads Library (Public Data - No special permissions needed)
     * Note: This uses the Ad Library API which is publicly accessible
     */
    static async fetchPageAds(pageIdOrUrl: string, limit: number = 15): Promise<any[]> {
        try {
            const pageId = this.extractPageId(pageIdOrUrl);
            const token = this.getAccessToken();

            // Use Ad Library API for public ads data
            const fields = [
                'id',
                'ad_creative_bodies',
                'ad_creative_link_captions',
                'ad_delivery_start_time',
                'ad_snapshot_url',
                'page_name'
            ].join(',');

            const url = `${this.BASE_URL}/ads_archive?search_page_ids=${pageId}&ad_reached_countries=['VN']&fields=${fields}&access_token=${token}&limit=${limit}`;

            const response = await fetch(url);

            if (!response.ok) {
                console.warn('Could not fetch ads - may need special permissions or page has no ads');
                return [];
            }

            const result = await response.json();
            return result.data || [];
        } catch (error) {
            console.warn('Error fetching ads (this is optional):', error);
            return [];
        }
    }

    /**
     * Check if Page Access Token is valid
     */
    static async validateToken(): Promise<boolean> {
        try {
            const token = this.getAccessToken();
            const url = `${this.BASE_URL}/me?access_token=${token}`;

            const response = await fetch(url);
            return response.ok;
        } catch (error) {
            console.error('Token validation failed:', error);
            return false;
        }
    }

    /**
     * Get Token Info (for debugging)
     */
    static async getTokenInfo(): Promise<any> {
        try {
            const token = this.getAccessToken();
            const appId = import.meta.env.VITE_FB_APP_ID;
            const url = `${this.BASE_URL}/debug_token?input_token=${token}&access_token=${appId}|${import.meta.env.VITE_FB_APP_SECRET}`;

            const response = await fetch(url);
            const result = await response.json();
            return result.data;
        } catch (error) {
            console.error('Error getting token info:', error);
            return null;
        }
    }
}
