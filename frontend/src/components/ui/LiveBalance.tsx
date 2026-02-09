import React from 'react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import { useStreamBalance } from '../../hooks/useStreamBalance';
import type { StreamInfo } from '../../types/continuum';

export interface LiveBalanceProps {
    streamInfo: StreamInfo | null;
    className?: string;
    showRate?: boolean;
    decimals?: number;
}

export const LiveBalance: React.FC<LiveBalanceProps> = ({
    streamInfo,
    className = '',
    showRate = true,
    decimals = 4,
}) => {
    const balance = useStreamBalance(streamInfo);

    if (!streamInfo) {
        return <div className={className}>$0.00</div>;
    }

    const isActive = streamInfo.status === 0; // 0 = Active

    return (
        <div className={`flex flex-col gap-sm ${className}`}>
            <div className="flex items-center gap-sm">
                <span
                    className="text-4xl font-bold gradient-text"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                    {formatCurrency(balance, decimals)}
                </span>
                {isActive && (
                    <TrendingUp
                        size={24}
                        className="text-secondary animate-pulse"
                        style={{ color: 'var(--color-secondary)' }}
                    />
                )}
            </div>
            {showRate && isActive && (
                <p className="text-sm text-secondary">
                    Streaming Rate: {formatCurrency(streamInfo.flowRate, 4)} / sec
                </p>
            )}
        </div>
    );
};
