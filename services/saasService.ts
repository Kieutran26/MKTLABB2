import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  subscription_tier: 'free' | 'pro' | 'promax';
  is_lifetime: boolean;
}

export interface UserQuota {
  plan_creation_count: number;
  plan_limit: number;
}

export const saasService = {
  /**
   * Đảm bảo Profile và Quota tồn tại (Dùng cho cả Firebase Auth)
   */
  async ensureUserData(userId: string, email: string = '', fullName: string = '') {
    // 1. Check xem profile đã có chưa
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      console.log('User chưa có profile, đang tạo mới...');

      // Tạo profile
      await supabase.from('profiles').insert({
        id: userId,
        email: email,
        full_name: fullName,
        subscription_tier: 'free'
      });

      // Tạo quota mặc định
      await supabase.from('user_quotas').insert({
        user_id: userId,
        plan_limit: 5,
        plan_creation_count: 0
      });
    }
  },

  /**
   * Lấy thông tin profile
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Lấy quota
   */
  async getUserQuota(userId: string): Promise<UserQuota | null> {
    const { data, error } = await supabase
      .from('user_quotas')
      .select('plan_creation_count, plan_limit')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Check feature unlocked
   */
  async isFeatureUnlocked(userId: string, featureId: string, tier: string): Promise<boolean> {
    if (tier === 'pro' || tier === 'promax') return true;

    const { data } = await supabase
      .from('user_unlocked_features')
      .select('id')
      .eq('user_id', userId)
      .eq('feature_id', featureId)
      .single();

    return !!data;
  },

  /**
   * Lưu Plan & Tăng lượt dùng (Unified)
   */
  async saveMarketingPlan(userId: string, type: string, name: string, input: any, output: any, brandId?: string, userEmail?: string) {
    try {
      // 1. Đảm bảo user có dòng data trong DB đã
      await this.ensureUserData(userId, userEmail || '');

      // 2. Chạy RPC để tăng số lượt dùng (có check limit bên trong SQL)
      // TẠM THỜI COMMENT ĐỂ DEBUG AI
      /*
      const { error: quotaError } = await supabase.rpc('increment_plan_count', { user_uuid: userId });
      
      if (quotaError) {
        throw new Error('QUOTA_EXCEEDED');
      }
      */

      // 3. Tiến hành lưu Plan
      const { data, error } = await supabase
        .from('marketing_plans')
        .insert({
          user_id: userId,
          brand_id: brandId,
          type,
          name,
          input_data: input,
          generated_output: output
        })
        .select()
        .single();

      if (error) throw error;
      return data;

    } catch (e: any) {
      console.error('SaaS Service Error:', e);
      if (e.message === 'QUOTA_EXCEEDED' || e.details?.includes('QUOTA_EXCEEDED')) {
        return null; // Frontend sẽ biết là hết lượt
      }
      throw e;
    }
  },

  /**
   * SePay QR Integration
   */
  generatePaymentQR(amount: number, description: string) {
    const sepayBaseUrl = "https://qr.sepay.vn/img";
    const bankAccount = "4029048755658053504";
    const bankName = "MBBank";

    return `${sepayBaseUrl}?acc=${bankAccount}&bank=${bankName}&amount=${amount}&des=${encodeURIComponent(description)}`;
  }
};
