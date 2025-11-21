import { useState, useEffect } from 'react';

export interface StreamInfo {
    startTime: number;
    flowRate: number; //Amount per second
    amountWithdrawn: number;
    totalAmount: number;
    stopTime: number;
    isActive: boolean;
}

/**
 * Custom hook to calculate and update live balance for a stream
 * Returns the current claimable balance which updates every second
 */
export function useStreamBalance(streamInfo: StreamInfo | null): number {
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        if (!streamInfo || !streamInfo.isActive) {
            setBalance(0);
            return;
        }

        const calculateBalance = (): number => {
            const now = Math.floor(Date.now() / 1000);
            const endTime = Math.min(now, streamInfo.stopTime);
            const elapsedTime = endTime - streamInfo.startTime;

            if (elapsedTime <= 0) return 0;

            const totalEarned = elapsedTime * streamInfo.flowRate;
            const claimable = Math.max(0, totalEarned - streamInfo.amountWithdrawn);

            return Math.min(claimable, streamInfo.totalAmount - streamInfo.amountWithdrawn);
        };

        // Initial calculation
        setBalance(calculateBalance());

        // Update every second for live ticking effect
        const interval = setInterval(() => {
            setBalance(calculateBalance());
        }, 1000);

        return () => clearInterval(interval);
    }, [streamInfo]);

    return balance;
}

/**
 * Hook for calculating progress percentage of a stream
 */
export function useStreamProgress(streamInfo: StreamInfo | null): number {
    const [progress, setProgress] = useState<number>(0);

    useEffect(() => {
        if (!streamInfo) {
            setProgress(0);
            return;
        }

        const calculateProgress = (): number => {
            const now = Math.floor(Date.now() / 1000);
            const totalDuration = streamInfo.stopTime - streamInfo.startTime;
            const elapsed = now - streamInfo.startTime;

            if (totalDuration <= 0) return 0;

            const percentage = (elapsed / totalDuration) * 100;
            return Math.min(Math.max(percentage, 0), 100);
        };

        setProgress(calculateProgress());

        const interval = setInterval(() => {
            setProgress(calculateProgress());
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [streamInfo]);

    return progress;
}
