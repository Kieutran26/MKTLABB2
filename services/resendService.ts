// Email service that calls the backend API (server.js)

export interface SendEmailParams {
    to: string | string[];
    subject: string;
    html: string;
    from?: string;
    replyTo?: string;
}

export interface SendEmailResult {
    success: boolean;
    id?: string;
    error?: string;
    email?: string;
}

// Use relative path - Vite proxy (local) or Netlify redirects (prod) will handle routing
const API_BASE = '';

export const resendService = {
    /**
     * Send a single email via API
     */
    async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
        try {
            const response = await fetch(`${API_BASE}/api/email/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            const data = await response.json();
            return data;
        } catch (err: any) {
            console.error('Failed to send email:', err);
            return { success: false, error: err.message || 'Network error' };
        }
    },

    /**
     * Send campaign to a list of subscribers via API
     */
    async sendCampaign(params: {
        campaignId?: string;
        subject: string;
        html: string;
        fromName: string;
        fromEmail: string;
        replyTo?: string;
        subscribers: Array<{ id?: string; email: string; firstName?: string; lastName?: string }>;
    }): Promise<{
        success: boolean;
        sentCount: number;
        failedCount: number;
        results: SendEmailResult[];
    }> {
        try {
            const response = await fetch(`${API_BASE}/api/email/campaign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            const data = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    sentCount: 0,
                    failedCount: params.subscribers.length,
                    results: [{ success: false, error: data.error || 'API error' }]
                };
            }

            return data;
        } catch (err: any) {
            console.error('Failed to send campaign:', err);
            return {
                success: false,
                sentCount: 0,
                failedCount: params.subscribers.length,
                results: [{ success: false, error: err.message || 'Network error' }]
            };
        }
    }
};
