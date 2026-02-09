import React from 'react';
import { useStreamBalance, useStreamProgress } from '../../hooks/useStreamBalance';
import type { StreamInfo } from '../../types/continuum';
import { formatFlowRate, formatDuration, mutezToTokens } from '../../services/tezosContractService';

export interface StreamDetailsProps {
    streamInfo: StreamInfo | null;
    tokenSymbol?: string;
    tokenDecimals?: number;
    className?: string;
}

/**
 * Comprehensive stream display component showing:
 * - Claimable balance with live updates
 * - Flow rate in human-readable format (per day/month)
 * - Time remaining
 * - Total withdrawn
 * - Escrow balance
 * - Paused status indicator
 */
export const StreamDetails: React.FC<StreamDetailsProps> = ({
    streamInfo,
    tokenSymbol = 'USDT',
    tokenDecimals = 6,
    className = '',
}) => {
    const claimableBalance = useStreamBalance(streamInfo);
    const progress = useStreamProgress(streamInfo);

    if (!streamInfo) {
        return (
            <div className={`p-4 bg-secondary rounded-lg ${className}`}>
                <p className="text-muted text-center">No stream data available</p>
            </div>
        );
    }

    // Convert amounts from smallest unit to tokens
    const claimableTokens = mutezToTokens(claimableBalance, tokenDecimals);
    const totalTokens = mutezToTokens(streamInfo.totalAmount, tokenDecimals);
    const withdrawnTokens = mutezToTokens(streamInfo.amountWithdrawn, tokenDecimals);
    const escrowTokens = totalTokens - withdrawnTokens;

    // Calculate flow rates
    const flowRatePerDay = parseFloat(formatFlowRate(streamInfo.flowRate, 'day'));
    const flowRatePerMonth = parseFloat(formatFlowRate(streamInfo.flowRate, 'month'));

    // Calculate time remaining
    const now = Math.floor(Date.now() / 1000);
    const timeRemaining = Math.max(0, streamInfo.stopTime - now);
    const timeRemainingFormatted = formatDuration(timeRemaining);

    // Determine stream status
    const getStatusInfo = () => {
        switch (streamInfo.status) {
            case 0:
                return { text: 'Active', color: 'var(--color-success)', icon: '●' };
            case 1:
                return { text: 'Paused', color: 'var(--color-warning)', icon: '⏸' };
            case 2:
                return { text: 'Cancelled', color: 'var(--color-error)', icon: '✕' };
            case 3:
                return { text: 'Depleted', color: 'var(--color-muted)', icon: '○' };
            default:
                return { text: 'Unknown', color: 'var(--color-muted)', icon: '?' };
        }
    };

    const statusInfo = getStatusInfo();
    const isStreamEnded = now >= streamInfo.stopTime;

    return (
        <div className={`p-6 bg-secondary rounded-lg space-y-4 ${className}`}>
            {/* Status Header */}
            <div className="flex items-center justify-between pb-4 border-b border-tertiary">
                <div className="flex items-center gap-2">
                    <span
                        className="text-xl animate-pulse"
                        style={{ color: statusInfo.color }}
                    >
                        {statusInfo.icon}
                    </span>
                    <span className="font-semibold" style={{ color: statusInfo.color }}>
                        {statusInfo.text}
                    </span>
                </div>
                <div className="text-sm text-muted">
                    {progress.toFixed(1)}% Complete
                </div>
            </div>

            {/* Claimable Balance - Prominent Display */}
            <div className="bg-tertiary p-4 rounded-lg">
                <div className="text-sm text-muted mb-1">Claimable Balance</div>
                <div className="text-3xl font-bold text-primary">
                    {claimableTokens.toFixed(2)} {tokenSymbol}
                </div>
                {streamInfo.status === 0 && !isStreamEnded && (
                    <div className="text-xs text-muted mt-1 animate-pulse">
                        ⚡ Updating live
                    </div>
                )}
            </div>

            {/* Flow Rate */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-tertiary p-3 rounded">
                    <div className="text-xs text-muted mb-1">Flow Rate (Daily)</div>
                    <div className="text-lg font-semibold">
                        {mutezToTokens(flowRatePerDay, tokenDecimals).toFixed(2)} {tokenSymbol}
                    </div>
                </div>
                <div className="bg-tertiary p-3 rounded">
                    <div className="text-xs text-muted mb-1">Flow Rate (Monthly)</div>
                    <div className="text-lg font-semibold">
                        {mutezToTokens(flowRatePerMonth, tokenDecimals).toFixed(2)} {tokenSymbol}
                    </div>
                </div>
            </div>

            {/* Time Remaining */}
            <div className="bg-tertiary p-3 rounded">
                <div className="text-xs text-muted mb-1">Time Remaining</div>
                <div className="text-lg font-semibold">
                    {isStreamEnded ? 'Stream Ended' : timeRemainingFormatted}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-tertiary rounded-full overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear"
                    style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
                        boxShadow: '0 0 10px var(--color-primary-glow)',
                    }}
                />
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="text-center">
                    <div className="text-xs text-muted mb-1">Total Withdrawn</div>
                    <div className="text-sm font-semibold">
                        {withdrawnTokens.toFixed(2)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-muted mb-1">Escrow Balance</div>
                    <div className="text-sm font-semibold">
                        {escrowTokens.toFixed(2)}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-muted mb-1">Total Amount</div>
                    <div className="text-sm font-semibold">
                        {totalTokens.toFixed(2)}
                    </div>
                </div>
            </div>

            {/* Paused Status Indicator */}
            {streamInfo.status === 1 && (
                <div className="bg-warning/10 border border-warning/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <span className="text-warning">⚠️</span>
                        <div>
                            <div className="text-sm font-semibold text-warning">Stream Paused</div>
                            <div className="text-xs text-muted">
                                This stream has been paused. No new tokens are accumulating.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Stream Dates */}
            <div className="text-xs text-muted pt-2 border-t border-tertiary">
                <div className="flex justify-between">
                    <span>Start: {new Date(streamInfo.startTime * 1000).toLocaleDateString()}</span>
                    <span>End: {new Date(streamInfo.stopTime * 1000).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};
