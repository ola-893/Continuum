/**
 * Formatting Utilities for YieldStream
 */

/**
 * Format a number as currency with APT symbol
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
    return `$${amount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })}`;
}

/**
 * Format APT amount (converts from octas)
 */
export function formatAPT(octas: number, decimals: number = 4): string {
    const apt = octas / 100000000; // 1 APT = 100,000,000 octas
    return `${apt.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })} APT`;
}

/**
 * Truncate Aptos address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (address.length <= startChars + endChars) return address;
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days} day${days !== 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
    if (minutes > 0 && days === 0) parts.push(`${minutes} min${minutes !== 1 ? 's' : ''}`);

    return parts.join(', ') || '0 minutes';
}

/**
 * Format timestamp to date string
 */
export function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/**
 * Format timestamp to date and time string
 */
export function formatDateTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Calculate flow rate per second from total amount and duration
 */
export function calculateFlowRate(totalAmount: number, durationSeconds: number): number {
    return totalAmount / durationSeconds;
}

/**
 * Calculate percentage
 */
export function formatPercentage(value: number, total: number, decimals: number = 1): string {
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(decimals)}%`;
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(num: number): string {
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(0);
}
