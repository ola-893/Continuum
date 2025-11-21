import React from 'react';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatting';
import { useStreamBalance } from '../../hooks/useStreamBalance';
import type { StreamInfo } from '../../hooks/useStreamBalance';

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

    return (
        <div className={`flex flex-col gap-sm ${className}`}>
            <div className="flex items-center gap-sm">
                <span
                    className="text-4xl font-bold gradient-text"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                    {formatCurrency(balance, decimals)}
                </span>
                {streamInfo.isActive && (
                    <TrendingUp
                        size={24}
                        className="text-secondary animate-pulse"
                        style={{ color: 'var(--color-secondary)' }}
                    />
                )}
            </div>
            {showRate && streamInfo.isActive && (
                <p className="text-sm text-secondary">
                    Streaming Rate: {formatCurrency(streamInfo.flowRate, 4)} / sec
                </p>
            )}
        </div>
    );
};
