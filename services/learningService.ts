import { supabase } from '../lib/supabase';
import { TranslationRecord, Plan } from '../types';

export interface SavedTranslation {
    id: string;
    sourceText: string;
    translatedText: string;
    sourceLang: string;
    targetLang: string;
    createdAt: number;
}

export interface SavedPlan {
    id: string;
    title: string;
    description?: string;
    startDate: string;
    endDate?: string;
    completed: boolean;
    createdAt: number;
}

export const LearningService = {
    // ===== TRANSLATION HISTORY =====
    async getTranslationHistory(): Promise<SavedTranslation[]> {
        try {
            const { data, error } = await supabase
                .from('translation_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error fetching translation history:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                sourceText: item.source_text,
                translatedText: item.translated_text,
                sourceLang: item.source_lang,
                targetLang: item.target_lang,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getTranslationHistory:', error);
            return [];
        }
    },

    async addTranslation(translation: SavedTranslation): Promise<boolean> {
        try {
            const dbTranslation = {
                id: translation.id,
                source_text: translation.sourceText,
                translated_text: translation.translatedText,
                source_lang: translation.sourceLang,
                target_lang: translation.targetLang,
                created_at: new Date(translation.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('translation_history')
                .insert(dbTranslation);

            if (error) {
                console.error('Error adding translation:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in addTranslation:', error);
            return false;
        }
    },

    // ===== LEARNING PLANS =====
    async getLearningPlans(): Promise<SavedPlan[]> {
        try {
            const { data, error } = await supabase
                .from('learning_plans')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching learning plans:', error);
                return [];
            }

            return (data || []).map(item => ({
                id: item.id,
                title: item.title,
                description: item.description,
                startDate: item.start_date,
                endDate: item.end_date,
                completed: item.completed,
                createdAt: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getLearningPlans:', error);
            return [];
        }
    },

    async saveLearningPlan(plan: SavedPlan): Promise<boolean> {
        try {
            const dbPlan = {
                id: plan.id,
                title: plan.title,
                description: plan.description,
                start_date: plan.startDate,
                end_date: plan.endDate,
                completed: plan.completed,
                created_at: new Date(plan.createdAt).toISOString()
            };

            const { error } = await supabase
                .from('learning_plans')
                .upsert(dbPlan, { onConflict: 'id' });

            if (error) {
                console.error('Error saving learning plan:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveLearningPlan:', error);
            return false;
        }
    },

    async deleteLearningPlan(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('learning_plans')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting learning plan:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteLearningPlan:', error);
            return false;
        }
    },

    async togglePlanCompletion(id: string, completed: boolean): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('learning_plans')
                .update({ completed: !completed })
                .eq('id', id);

            if (error) {
                console.error('Error toggling plan completion:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in togglePlanCompletion:', error);
            return false;
        }
    }
};
