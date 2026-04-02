// Brand Service - Supabase Implementation
// Replaces localStorage with Supabase database

import { supabase } from '../lib/supabase';
import { Brand } from '../types';

// Helper to convert Brand to database format
const toDbFormat = (brand: Brand) => ({
    id: brand.id,
    name: brand.identity.name,
    logo_url: brand.identity.logoMain || brand.identity.logos?.[0]?.url || null,
    colors: brand.identity.colors,
    font_family: brand.identity.fontFamily,
    vision: brand.strategy?.vision,
    mission: brand.strategy?.mission,
    core_values: brand.strategy?.coreValues,
    tone_of_voice: brand.strategy?.toneOfVoice,
    short_term_goals: brand.strategy?.shortTermGoals,
    long_term_goals: brand.strategy?.longTermGoals,
    target_objectives: brand.strategy?.targetObjectives,
    demographics: brand.audience?.demographics,
    psychographics: brand.audience?.psychographics,
    pain_points: brand.audience?.painPoints,
    logos: brand.identity.logos,
    created_at: brand.createdAt ? new Date(brand.createdAt).toISOString() : new Date().toISOString(),
});

// Helper to convert database format to Brand
const fromDbFormat = (row: any): Brand => ({
    id: row.id,
    identity: {
        name: row.name || 'Unnamed Brand',
        logoMain: row.logo_url,
        logoIcon: null,
        logos: row.logos || [],
        colors: row.colors || [],
        fontFamily: row.font_family || 'Inter',
    },
    strategy: {
        vision: row.vision || '',
        mission: row.mission || '',
        coreValues: row.core_values || [],
        toneOfVoice: row.tone_of_voice || '',
        shortTermGoals: row.short_term_goals || [],
        longTermGoals: row.long_term_goals || [],
        targetObjectives: row.target_objectives || [],
    },
    audience: {
        demographics: row.demographics || [],
        psychographics: row.psychographics || [],
        painPoints: row.pain_points || [],
    },
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
});

export const BrandService = {
    // Get all brands
    async getBrands(): Promise<Brand[]> {
        const { data, error } = await supabase
            .from('brands')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching brands:', error);
            return [];
        }

        return (data || []).map(fromDbFormat);
    },

    // Save or update a brand
    async saveBrand(brand: Brand): Promise<boolean> {
        const dbData = toDbFormat(brand);

        const { error } = await supabase
            .from('brands')
            .upsert(dbData, { onConflict: 'id' });

        if (error) {
            console.error('Error saving brand:', error);
            return false;
        }

        return true;
    },

    // Delete a brand
    async deleteBrand(id: string): Promise<boolean> {
        const { error } = await supabase
            .from('brands')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting brand:', error);
            return false;
        }

        return true;
    },

    // Get active brand ID (still uses localStorage for quick access)
    getActiveBrandId(): string | null {
        return localStorage.getItem('active_brand_id');
    },

    // Set active brand ID
    setActiveBrandId(id: string): void {
        localStorage.setItem('active_brand_id', id);
    },

    // Clear active brand ID
    clearActiveBrandId(): void {
        localStorage.removeItem('active_brand_id');
    }
};
