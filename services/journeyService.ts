import { supabase } from '../lib/supabase';
import { JourneyStage } from '../types';
import { JourneyMapperInput } from './geminiService';

export interface SavedJourney {
    id: string;
    input: JourneyMapperInput;
    data: JourneyStage[];
    timestamp: number;
}

export const JourneyService = {
    // Get all saved journeys
    async getJourneys(): Promise<SavedJourney[]> {
        try {
            const { data, error } = await supabase
                .from('customer_journeys')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching journeys:', error);
                return [];
            }

            // Convert from DB format to app format
            return (data || []).map(item => ({
                id: item.id,
                input: item.input,
                data: item.journey_data,
                timestamp: new Date(item.created_at).getTime()
            }));
        } catch (error) {
            console.error('Error in getJourneys:', error);
            return [];
        }
    },

    // Save a journey (insert or update)
    async saveJourney(journey: SavedJourney): Promise<boolean> {
        try {
            const dbJourney = {
                id: journey.id,
                input: journey.input,
                journey_data: journey.data,
                created_at: new Date(journey.timestamp).toISOString()
            };

            const { error } = await supabase
                .from('customer_journeys')
                .upsert(dbJourney, { onConflict: 'id' });

            if (error) {
                console.error('Error saving journey:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in saveJourney:', error);
            return false;
        }
    },

    // Delete a journey
    async deleteJourney(id: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from('customer_journeys')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting journey:', error);
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error in deleteJourney:', error);
            return false;
        }
    }
};
