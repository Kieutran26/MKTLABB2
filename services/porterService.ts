import { PorterAnalysisInput, PorterAnalysisResult } from '../types';

export interface SavedPorterAnalysis {
    id: string;
    input: PorterAnalysisInput;
    data: PorterAnalysisResult;
    timestamp: number;
}

const STORAGE_KEY = 'porter_analyses';

export const PorterService = {
    // Get all saved Porter analyses from localStorage
    async getAnalyses(): Promise<SavedPorterAnalysis[]> {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return [];
            const analyses = JSON.parse(stored) as SavedPorterAnalysis[];
            return analyses.sort((a, b) => b.timestamp - a.timestamp);
        } catch (error) {
            console.error('Error loading Porter analyses:', error);
            return [];
        }
    },

    // Save a Porter analysis to localStorage
    async saveAnalysis(analysis: SavedPorterAnalysis): Promise<boolean> {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            const analyses: SavedPorterAnalysis[] = stored ? JSON.parse(stored) : [];
            
            // Check if exists, update or add
            const existingIndex = analyses.findIndex(a => a.id === analysis.id);
            if (existingIndex >= 0) {
                analyses[existingIndex] = analysis;
            } else {
                analyses.unshift(analysis);
            }
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses));
            return true;
        } catch (error) {
            console.error('Error saving Porter analysis:', error);
            return false;
        }
    },

    // Delete a Porter analysis from localStorage
    async deleteAnalysis(id: string): Promise<boolean> {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) return true;
            const analyses: SavedPorterAnalysis[] = JSON.parse(stored);
            const filtered = analyses.filter(a => a.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting Porter analysis:', error);
            return false;
        }
    }
};
