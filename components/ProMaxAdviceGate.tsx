import React from 'react';
import { Check, ChevronRight, Diamond } from 'lucide-react';
import { useAuth, type SubscriptionTier } from './AuthContext';
import './MastermindStrategyEditorial.css';
import './ProMaxAdviceGate.css';

const DEFAULT_BENEFITS = [
    'Insight chiến lược, rủi ro & cơ hội bị bỏ lỡ',
    'Lộ trình hành động 30 · 60 · 90 ngày',
] as const;

export interface ProMaxAdviceGateProps {
    children?: React.ReactNode;
    className?: string;
    benefits?: readonly string[];
    /** Ghi đè tier từ context — dùng profile.subscription_tier từ SaaS (AuthContext.tier hiện không đồng bộ profile). */
    subscriptionTier?: SubscriptionTier | string | null | undefined;
}

const ProMaxAdviceGate: React.FC<ProMaxAdviceGateProps> = ({
    children,
    className = '',
    benefits = DEFAULT_BENEFITS,
    subscriptionTier: subscriptionTierProp,
}) => {
    const { tier } = useAuth();
    const effectiveTier: SubscriptionTier =
        subscriptionTierProp === 'promax' || subscriptionTierProp === 'pro' || subscriptionTierProp === 'free'
            ? subscriptionTierProp
            : tier;

    if (effectiveTier === 'promax') {
        return <div className={`pmg-wrap ${className}`}>{children}</div>;
    }

    return (
        <div className={`pmg-wrap pmg-locked ${className}`}>
            <div className="pmg-compact-card" role="region" aria-label="Pro Max — Lời khuyên chiến lược">
                <div className="pmg-compact-inner">
                    <div className="ms-vault-label">
                        <Diamond size={11} strokeWidth={2.25} className="ms-vault-label-diamond" aria-hidden />
                        PRO MAX
                    </div>
                    <h3 className="ms-vault-title pmg-compact-title">Lời khuyên chiến lược</h3>
                    <p className="ms-vault-desc pmg-compact-desc">
                        Chỉ có trên <strong className="pmg-desc-strong">Pro Max</strong>. Mở khóa phân tích chuyên sâu và
                        lộ trình cho đội marketing.
                    </p>

                    <div className="ms-vault-benefits pmg-compact-benefits">
                        {benefits.map((benefit, bIdx) => (
                            <div key={bIdx} className="ms-vault-benefit-item">
                                <div className="ms-vault-benefit-icon">
                                    <Check size={13} strokeWidth={3} aria-hidden />
                                </div>
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <button type="button" className="ms-vault-cta pmg-compact-cta">
                        Nâng cấp Pro Max
                        <ChevronRight size={18} strokeWidth={2} aria-hidden />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProMaxAdviceGate;
