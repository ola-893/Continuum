/**
 * Utility functions for calculating real-time stream values
 */

export interface StreamInfo {
    startTime: number;
    flowRate: number; // Amount per second (in octas or smallest unit)
    amountWithdrawn: number;
    totalAmount: number;
    stopTime: number;
    isActive: boolean;
}

/**
 * Calculate the total amount that has been streamed so far
 * Based on elapsed time × flow rate, capped at totalAmount
 */
export function calculateTotalStreamed(streamInfo: StreamInfo | null): number {
    if (!streamInfo) return 0;

    const now = Math.floor(Date.now() / 1000);
    const endTime = Math.min(now, streamInfo.stopTime);
    const elapsedTime = Math.max(0, endTime - streamInfo.startTime);

    // Total amount that has streamed through based on time
    const streamed = elapsedTime * streamInfo.flowRate;

    // Cap at the total amount allocated for the stream
    return Math.min(streamed, streamInfo.totalAmount);
}

/**
 * Calculate the claimable balance (streamed but not withdrawn)
 */
export function calculateClaimable(streamInfo: StreamInfo | null): number {
    if (!streamInfo) return 0;

    const totalStreamed = calculateTotalStreamed(streamInfo);
    const claimable = Math.max(0, totalStreamed - streamInfo.amountWithdrawn);

    return claimable;
}

/**
 * Calculate remaining amount that hasn't been streamed yet
 */
export function calculateRemainingVesting(streamInfo: StreamInfo | null): number {
    if (!streamInfo) return 0;

    const totalStreamed = calculateTotalStreamed(streamInfo);
    return Math.max(0, streamInfo.totalAmount - totalStreamed);
}

/**
 * Calculate the percentage of total amount that has been streamed
 */
export function calculateStreamedPercentage(streamInfo: StreamInfo | null): number {
    if (!streamInfo || streamInfo.totalAmount === 0) return 0;

    const totalStreamed = calculateTotalStreamed(streamInfo);
    return Math.min(100, (totalStreamed / streamInfo.totalAmount) * 100);
}

/**
 * Format stream info for display with all calculated values
 */
export function getStreamMetrics(streamInfo: StreamInfo | null) {
    return {
        totalStreamed: calculateTotalStreamed(streamInfo),
        totalWithdrawn: streamInfo?.amountWithdrawn || 0,
        claimable: calculateClaimable(streamInfo),
        remainingVesting: calculateRemainingVesting(streamInfo),
        percentageStreamed: calculateStreamedPercentage(streamInfo),
    };
}
