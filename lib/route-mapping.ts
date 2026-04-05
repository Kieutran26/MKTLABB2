import { ViewState } from '../types';

export const VIEW_TO_SLUG: Record<ViewState, string> = {
    'HOME_DASHBOARD': '/dashboard',
    'LANDING_INTRO': '/welcome',
    'FEATURES_GUIDE': '/guide',
    'HOME': '/translate',
    'LEARN_SELECT': '/learn',
    'LEARN_SESSION': '/session',
    'VOCAB_MANAGER': '/vocab',
    'STARRED': '/favorites',
    'PLAN_LIST': '/subscriptions',
    'PLAN_CALENDAR': '/billing-calendar',
    'PROMPTS': '/prompts',
    'TODO': '/tasks',
    'CONTENT_WRITER': '/content-generator',
    'VISUAL_EMAIL': '/email-builder',
    'KEY_VISUALS_LIST': '/key-visuals',
    'KEY_VISUALS_CREATE': '/key-visuals/new',
    'FRAME_VISUAL': '/storyboard',
    'UTM_BUILDER': '/utm-builder',
    'MOCKUP_GENERATOR': '/mockups',
    'AB_TESTING': '/ab-testing',
    'ROAS_FORECASTER': '/roas-forecaster',
    'BRAND_VAULT': '/brand-vault',
    'RIVAL_RADAR': '/competitor-analysis',
    'PERSONA_BUILDER': '/personas',
    'MINDMAP_GENERATOR': '/mindmaps',
    'SCAMPER_TOOL': '/scamper',
    'STRATEGIC_MODELS': '/strategic-models',
    'SMART_CALENDAR': '/content-calendar',
    'AUTO_BRIEF': '/brief-generator',
    'SOP_BUILDER': '/sop-builder',
    'HOOK_GENERATOR': '/hook-generator',
    'CUSTOMER_JOURNEY_MAPPER': '/journey-mapper',
    'BUDGET_ALLOCATOR': '/budget-allocator',
    'INSIGHT_FINDER': '/insight-finder',
    'CREATIVE_ANGLE_EXPLORER': '/creative-angles',
    'SMART_SALARY': '/salary-calculator',
    'MASTERMIND_STRATEGY': '/mastermind-strategy',
    'ADS_HEALTH_CHECKER': '/ads-health',
    'BRAND_POSITIONING_BUILDER': '/positioning',
    'PRICING_ANALYZER': '/pricing-analyzer',
    'AUDIENCE_EMOTION_MAP': '/emotion-map',
    'IMC_PLANNER': '/imc-planner',
    'MARKETING_KNOWLEDGE': '/knowledge-hub',
    'PESTEL_BUILDER': '/pestel',
    'PORTER_ANALYZER': '/porter-forces',
    'NEWS_AGGREGATOR': '/marketing-news',
    'TOOLKIT': '/toolkit',
    'STP_MODEL': '/stp-model',
    'LOGIN': '/login',
    'OPTIMKI_BUILDER': '/optimki'
};

export const SLUG_TO_VIEW: Record<string, ViewState> = Object.entries(VIEW_TO_SLUG).reduce((acc, [view, slug]) => {
    acc[slug] = view as ViewState;
    return acc;
}, {} as Record<string, ViewState>);

export function getSlugForView(view: ViewState): string {
    return VIEW_TO_SLUG[view] || '/';
}

export function getViewForSlug(slug: string): ViewState {
    // Exact match
    if (SLUG_TO_VIEW[slug]) return SLUG_TO_VIEW[slug];
    
    // Handle sub-paths if necessary (e.g. /key-visuals/new)
    const normalizedSlug = slug.startsWith('/') ? slug : `/${slug}`;
    return SLUG_TO_VIEW[normalizedSlug] || 'LANDING_INTRO';
}
