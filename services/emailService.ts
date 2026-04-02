
import { supabase } from '../lib/supabase';

// Mock function for local development / testing if Edge Function is not available
// In production, this would be replaced by the direct Supabase Function call
const sendEmailMock = async (to: string, subject: string, html: string) => {
    console.log('Mock email sending:', { to, subject });
    return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 1000));
};

export const EmailService = {
    sendTestEmail: async (to: string, html: string, subject: string) => {
        try {
            // Direct integration with Resend using user provided API Key (Client-side, temporary)
            // NOTE: This is NOT secure for production. This is only for the requested "Send Test" feature in this dev environment.
            // Ideally, we will migrate this to Supabase Edge Function.

            // For now, let's try the Supabase Function first.
            const { data, error } = await supabase.functions.invoke('send-email', {
                body: { to, subject, html },
            });

            if (error) {
                console.error('Supabase Function Error:', error);
                // Fallback to client-side fetch if function is not deployed (for dev purpose only)
                // Or throw error to UI
                throw error;
            }

            return data;
        } catch (error) {
            console.error('EmailService Error:', error);
            throw error;
        }
    }
};
