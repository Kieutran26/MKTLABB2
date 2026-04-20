/**
 * Shared AI model policy for mapping product plans to production models.
 * Frontend sends plan / feature / task metadata; backend decides the real model.
 */

export const AI_PLANS = ['free', 'pro', 'promax'];

export function normalizeSubscriptionTier(value) {
    const tier = typeof value === 'string' ? value.trim().toLowerCase() : '';
    if (tier === 'pro' || tier === 'promax') return tier;
    return 'free';
}

export function normalizeAiTaskType(value) {
    const task = typeof value === 'string' ? value.trim().toLowerCase() : '';
    return task || 'default';
}

function pushCandidate(out, value) {
    const model = typeof value === 'string' ? value.trim() : '';
    if (model && !out.includes(model)) out.push(model);
}

function getTierEnvModel(env, tier) {
    switch (tier) {
        case 'promax':
            return env.OPENAI_MODEL_PROMAX || env.VITE_OPENAI_MODEL_PROMAX || '';
        case 'pro':
            return env.OPENAI_MODEL_PRO || env.VITE_OPENAI_MODEL_PRO || '';
        default:
            return env.OPENAI_MODEL_FREE || env.VITE_OPENAI_MODEL_FREE || '';
    }
}

function getDefaultCandidatesByTier(tier, taskType) {
    const isHighValueTask =
        taskType === 'analysis' ||
        taskType === 'premium_insight' ||
        taskType === 'final_report' ||
        taskType === 'strategic_report';

    switch (tier) {
        case 'promax':
            return isHighValueTask
                ? ['gpt-5.4', 'gpt-5.4-mini', 'gpt-4.1', 'gpt-4o']
                : ['gpt-5.4-mini', 'gpt-4.1', 'gpt-4o-mini'];
        case 'pro':
            return isHighValueTask
                ? ['gpt-4.1', 'gpt-4o', 'gpt-4.1-mini']
                : ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1'];
        default:
            return ['gpt-4.1-mini', 'gpt-4o-mini', 'gpt-4.1'];
    }
}

export function resolveOpenAiModelCandidates({
    plan,
    feature,
    taskType,
    preferredModel,
    env = process.env,
}) {
    const normalizedPlan = normalizeSubscriptionTier(plan);
    const normalizedTaskType = normalizeAiTaskType(taskType);
    const out = [];

    pushCandidate(out, preferredModel);
    pushCandidate(out, getTierEnvModel(env, normalizedPlan));
    pushCandidate(out, env.OPENAI_MODEL || env.VITE_OPENAI_MODEL || '');

    const defaults = getDefaultCandidatesByTier(normalizedPlan, normalizedTaskType);
    for (const candidate of defaults) {
        pushCandidate(out, candidate);
    }

    return {
        plan: normalizedPlan,
        feature: typeof feature === 'string' && feature.trim() ? feature.trim() : 'generic',
        taskType: normalizedTaskType,
        candidates: out,
    };
}
