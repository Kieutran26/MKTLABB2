import { supabase } from '../lib/supabase';
import { Plan } from '../types';

export const PlanService = {
    async getPlans(): Promise<Plan[]> {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('next_payment_date', { ascending: true });

            if (error) {
                console.error('Error fetching plans:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                website: item.website,
                price: Number(item.price),
                currency: item.currency,
                email: item.email || '',
                paymentDate: item.payment_date || '',
                nextPaymentDate: item.next_payment_date,
                cardInfo: item.card_info || '',
                billingCycle: item.billing_cycle as 'monthly' | 'yearly',
                icon: item.icon || 'global'
            }));
        } catch (error) {
            console.error('Error in getPlans:', error);
            return [];
        }
    },

    async savePlan(plan: Plan): Promise<boolean> {
        try {
            const dbPlan = {
                id: plan.id,
                website: plan.website,
                price: plan.price,
                currency: plan.currency,
                email: plan.email,
                payment_date: plan.paymentDate || null,
                next_payment_date: plan.nextPaymentDate,
                card_info: plan.cardInfo,
                billing_cycle: plan.billingCycle,
                icon: plan.icon
            };

            const { error } = await supabase
                .from('plans')
                .upsert(dbPlan, { onConflict: 'id' });

            if (error) {
                console.error('Error saving plan:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in savePlan:', error);
            return false;
        }
    },

    async deletePlan(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('plans')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting plan:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deletePlan:', error);
            return false;
        }
    }
};
