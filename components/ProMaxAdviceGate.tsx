import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from './AuthContext';
import './ProMaxAdviceGate.css';

interface ProMaxAdviceGateProps {
    children: React.ReactNode;
    className?: string;
}

const ProMaxAdviceGate: React.FC<ProMaxAdviceGateProps> = ({ children, className = '' }) => {
    const { tier } = useAuth();

    if (tier === 'promax') {
        return <div className={`pmg-wrap ${className}`}>{children}</div>;
    }

    return (
        <div className={`pmg-wrap pmg-locked ${className}`}>
            <div className="pmg-card pmg-card--editorial" role="region" aria-label="Pro Max">
                <p className="pmg-kicker">Pro Max</p>
                <h2 className="pmg-title">Lời khuyên chiến lược</h2>
                <p className="pmg-desc">
                    Lời khuyên chiến lược chỉ có ở gói <strong>Pro Max</strong>.
                    <span className="pmg-desc-break" />
                    Nâng cấp để mở khóa toàn bộ phân tích chuyên sâu.
                </p>
                <button type="button" className="pmg-cta">
                    <Lock size={14} strokeWidth={1.75} aria-hidden />
                    Nâng cấp Pro Max
                </button>
            </div>
        </div>
    );
};

export default ProMaxAdviceGate;
