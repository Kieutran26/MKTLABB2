import React from 'react';
import { Check, ChevronRight, Diamond, Lock } from 'lucide-react';
import './MastermindStrategyEditorial.css';

export type BrandVaultUpsellCardProps = {
    /** Mặc định: Tính năng Brand Vault */
    title?: string;
    description: string;
    benefits: string[];
    ctaLabel?: string;
    onCtaClick?: () => void;
    className?: string;
};

/**
 * Thẻ upsell Brand Vault (chỉ nội dung, không cột khóa) — dùng chung PESTEL, Porter, v.v.
 * Style: MastermindStrategyEditorial.css (.ms-vault-*)
 */
const BrandVaultUpsellCard: React.FC<BrandVaultUpsellCardProps> = ({
    title = 'Tính năng Brand Vault',
    description,
    benefits,
    ctaLabel = 'Nâng cấp Pro Max',
    onCtaClick,
    className,
}) => {
    return (
        <div className={className ?? 'ms-editorial-wrapper'} style={{ padding: 0 }}>
            <div className="ms-vault-card">
                <div className="ms-vault-content">
                    <div className="ms-vault-upper">
                        <div className="ms-vault-label">
                            <Diamond size={11} strokeWidth={2.25} className="ms-vault-label-diamond" aria-hidden />
                            Brand Vault Access
                        </div>
                        <h3 className="ms-vault-title">{title}</h3>
                        <p className="ms-vault-desc">{description}</p>
                    </div>

                    <div className="ms-vault-benefits">
                        {benefits.map((benefit, bIdx) => (
                            <div key={bIdx} className="ms-vault-benefit-item">
                                <div className="ms-vault-benefit-icon">
                                    <Check size={14} strokeWidth={3} />
                                </div>
                                <span>{benefit}</span>
                            </div>
                        ))}
                    </div>

                    <button type="button" className="ms-vault-cta" onClick={onCtaClick}>
                        {ctaLabel} <ChevronRight size={18} />
                    </button>
                </div>

                {/* Right Visual: The "Lock" part */}
                <div className="ms-vault-visual">
                    <div className="ms-vault-glow" />
                    <div className="ms-vault-dna">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                            <div
                                key={i}
                                className="ms-vault-dna-bar"
                                style={{
                                    height: `${12 + Math.random() * 24}%`,
                                    animationDelay: `${i * 0.15}s`,
                                }}
                            />
                        ))}
                    </div>

                    <div className="ms-vault-lock-wrap">
                        <div className="ms-vault-lock-circle">
                            <div className="ms-vault-lock-icon">
                                <Lock size={32} strokeWidth={1.5} />
                            </div>
                        </div>
                        <div className="ms-vault-lock-text">ENCRYPTED DNA</div>
                    </div>

                    <div className="ms-vault-corner ms-vault-corner-tl" />
                    <div className="ms-vault-corner ms-vault-corner-br" />
                </div>
            </div>
        </div>
    );
};

export default BrandVaultUpsellCard;
