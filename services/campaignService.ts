import { supabase } from '../lib/supabase';

// Types
export interface EmailCampaign {
    id: string;
    name: string;
    subject: string;
    preheader?: string;
    sender_name: string;
    sender_email: string;
    reply_to?: string;
    cc?: string;
    bcc?: string;
    template_id?: string;
    list_id?: string;
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'cancelled';
    scheduled_at?: string;
    sent_at?: string;
    created_at: string;
    updated_at: string;
}

export interface CampaignAnalytics {
    id: string;
    campaign_id: string;
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    total_bounced: number;
    total_unsubscribed: number;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
    updated_at: string;
}

export interface EmailEvent {
    id: string;
    campaign_id: string;
    subscriber_id: string;
    event_type: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'unsubscribed';
    link_url?: string;
    user_agent?: string;
    ip_address?: string;
    created_at: string;
}

export const campaignService = {
    // ================== CAMPAIGNS ==================

    async getAllCampaigns(): Promise<EmailCampaign[]> {
        const { data, error } = await supabase
            .from('email_campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching campaigns:', error);
            return [];
        }
        return data || [];
    },

    async getCampaign(id: string): Promise<EmailCampaign | null> {
        const { data, error } = await supabase
            .from('email_campaigns')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching campaign:', error);
            return null;
        }
        return data;
    },

    async createCampaign(campaign: Omit<EmailCampaign, 'id' | 'status' | 'created_at' | 'updated_at'>): Promise<EmailCampaign | null> {
        const { data, error } = await supabase
            .from('email_campaigns')
            .insert({
                ...campaign,
                status: campaign.scheduled_at ? 'scheduled' : 'draft'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating campaign:', error);
            return null;
        }

        // Create analytics record
        await supabase.from('campaign_analytics').insert({ campaign_id: data.id });

        return data;
    },

    async updateCampaign(id: string, updates: Partial<EmailCampaign>): Promise<boolean> {
        const { error } = await supabase
            .from('email_campaigns')
            .update({ ...updates, updated_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error updating campaign:', error);
            return false;
        }
        return true;
    },

    async deleteCampaign(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('email_campaigns')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting campaign:', error);
            return false;
        }
        return true;
    },

    // ================== SCHEDULING ==================

    async scheduleCampaign(id: string, scheduledAt: Date): Promise<boolean> {
        const { error } = await supabase
            .from('email_campaigns')
            .update({
                status: 'scheduled',
                scheduled_at: scheduledAt.toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error scheduling campaign:', error);
            return false;
        }
        return true;
    },

    async cancelSchedule(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('email_campaigns')
            .update({
                status: 'draft',
                scheduled_at: null,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error cancelling schedule:', error);
            return false;
        }
        return true;
    },

    async markAsSent(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('email_campaigns')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            console.error('Error marking as sent:', error);
            return false;
        }
        return true;
    },

    // ================== ANALYTICS ==================

    async getAnalytics(campaignId: string): Promise<CampaignAnalytics | null> {
        const { data, error } = await supabase
            .from('campaign_analytics')
            .select('*')
            .eq('campaign_id', campaignId)
            .single();

        if (error) {
            console.error('Error fetching analytics:', error);
            return null;
        }
        return data;
    },

    async getOverallStats(days: number = 30): Promise<{
        totalCampaigns: number;
        totalSent: number;
        avgOpenRate: number;
        avgClickRate: number;
        sent: number;
        opened: number;
        clicked: number;
        failed: number;
    }> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        // Get campaigns in date range
        const { data: campaigns } = await supabase
            .from('email_campaigns')
            .select('id')
            .gte('created_at', cutoffDate.toISOString());

        const campaignIds = campaigns?.map(c => c.id) || [];

        if (campaignIds.length === 0) {
            return {
                totalCampaigns: 0,
                totalSent: 0,
                avgOpenRate: 0,
                avgClickRate: 0,
                sent: 0,
                opened: 0,
                clicked: 0,
                failed: 0
            };
        }

        // Get aggregated analytics
        const { data: analytics } = await supabase
            .from('campaign_analytics')
            .select('*')
            .in('campaign_id', campaignIds);

        const stats = (analytics || []).reduce((acc, a) => ({
            totalSent: acc.totalSent + (a.total_sent || 0),
            totalOpened: acc.totalOpened + (a.total_opened || 0),
            totalClicked: acc.totalClicked + (a.total_clicked || 0),
            totalBounced: acc.totalBounced + (a.total_bounced || 0),
            openRateSum: acc.openRateSum + (a.open_rate || 0),
            clickRateSum: acc.clickRateSum + (a.click_rate || 0),
        }), { totalSent: 0, totalOpened: 0, totalClicked: 0, totalBounced: 0, openRateSum: 0, clickRateSum: 0 });

        const count = analytics?.length || 1;

        return {
            totalCampaigns: campaignIds.length,
            totalSent: stats.totalSent,
            avgOpenRate: Math.round(stats.openRateSum / count * 100) / 100,
            avgClickRate: Math.round(stats.clickRateSum / count * 100) / 100,
            sent: stats.totalSent,
            opened: stats.totalOpened,
            clicked: stats.totalClicked,
            failed: stats.totalBounced
        };
    },

    // ================== TRACKING ==================

    async trackEvent(event: Omit<EmailEvent, 'id' | 'created_at'>): Promise<boolean> {
        const { error } = await supabase
            .from('email_events')
            .insert(event);

        if (error) {
            console.error('Error tracking event:', error);
            return false;
        }

        // Update analytics
        await this.updateAnalytics(event.campaign_id);
        return true;
    },

    async updateAnalytics(campaignId: string): Promise<void> {
        // Count events by type
        const { data: events } = await supabase
            .from('email_events')
            .select('event_type')
            .eq('campaign_id', campaignId);

        if (!events) return;

        const counts = events.reduce((acc, e) => {
            acc[e.event_type] = (acc[e.event_type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const sent = counts.sent || 0;
        const delivered = counts.delivered || 0;
        const opened = counts.opened || 0;
        const clicked = counts.clicked || 0;
        const bounced = counts.bounced || 0;
        const unsubs = counts.unsubscribed || 0;

        const openRate = sent > 0 ? (opened / sent) * 100 : 0;
        const clickRate = opened > 0 ? (clicked / opened) * 100 : 0;
        const bounceRate = sent > 0 ? (bounced / sent) * 100 : 0;

        await supabase
            .from('campaign_analytics')
            .update({
                total_sent: sent,
                total_delivered: delivered,
                total_opened: opened,
                total_clicked: clicked,
                total_bounced: bounced,
                total_unsubscribed: unsubs,
                open_rate: Math.round(openRate * 100) / 100,
                click_rate: Math.round(clickRate * 100) / 100,
                bounce_rate: Math.round(bounceRate * 100) / 100,
                updated_at: new Date().toISOString()
            })
            .eq('campaign_id', campaignId);
    },

    // ================== UNSUBSCRIBE ==================

    async unsubscribe(email: string, campaignId?: string, subscriberId?: string, reason?: string): Promise<boolean> {
        // Record unsubscribe
        const { error: insertError } = await supabase
            .from('unsubscribes')
            .insert({
                email,
                campaign_id: campaignId,
                subscriber_id: subscriberId,
                reason
            });

        if (insertError) {
            console.error('Error recording unsubscribe:', insertError);
            return false;
        }

        // Update subscriber status if we have ID
        if (subscriberId) {
            await supabase
                .from('subscribers')
                .update({ status: 'unsubscribed' })
                .eq('id', subscriberId);
        }

        // Track event if campaign
        if (campaignId && subscriberId) {
            await this.trackEvent({
                campaign_id: campaignId,
                subscriber_id: subscriberId,
                event_type: 'unsubscribed'
            });
        }

        return true;
    }
};
