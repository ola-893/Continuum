import { useState, useEffect } from 'react';
import type { StreamInfo } from '../types/continuum';

/**
 * Custom hook to calculate and update live balance for a stream
 * Returns the current claimable balance which updates every second
 * 
 * Formula: (current_time - start_time) * flow_rate - amount_withdrawn
 * Capped at: total_amount - amount_withdrawn
 */
export function useStreamBalance(streamInfo: StreamInfo | null): number {
    const [balance, setBalance] = useState<number>(0);

    useEffect(() => {
        if (!streamInfo) {
            setBalance(0);
            return;
        }

        // Handle stream status (active, paused, cancelled)
        if (streamInfo.status === 2 || streamInfo.status === 3) {
            // Cancelled or depleted - no claimable balance
            setBalance(0);
            return;
        }

        const calculateBalance = (): number => {
            const now = Math.floor(Date.now() / 1000);
            
            // If before start time, no balance yet
            if (now < streamInfo.startTime) {
                return 0;
            }

            // Calculate elapsed time, capped at stop time
            const effectiveTime = Math.min(now, streamInfo.stopTime);
            const elapsedTime = effectiveTime - streamInfo.startTime;

            // Calculate accumulated amount: (current_time - start_time) * flow_rate
            const accumulated = elapsedTime * streamInfo.flowRate;

            // Subtract what's already been withdrawn
            const claimable = accumulated - streamInfo.amountWithdrawn;

            // Cap at remaining balance
            const remaining = streamInfo.totalAmount - streamInfo.amountWithdrawn;
            
            return Math.max(0, Math.min(claimable, remaining));
        };

        // Initial calculation
        setBalance(calculateBalance());

        // Stop updating after stop_time
        const now = Math.floor(Date.now() / 1000);
        if (now >= streamInfo.stopTime) {
            // Stream has ended, calculate final balance and don't update
            setBalance(calculateBalance());
            return;
        }

        // Update every second for live ticking effect
        const interval = setInterval(() => {
            const currentTime = Math.floor(Date.now() / 1000);
            
            // Stop updating after stop_time
            if (currentTime >= streamInfo.stopTime) {
                setBalance(calculateBalance());
                clearInterval(interval);
                return;
            }

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
            
            if (totalDuration <= 0) return 0;

            const elapsed = now - streamInfo.startTime;
            const percentage = (elapsed / totalDuration) * 100;
            
            return Math.min(Math.max(percentage, 0), 100);
        };

        setProgress(calculateProgress());

        // Stop updating after stop time
        const now = Math.floor(Date.now() / 1000);
        if (now >= streamInfo.stopTime) {
            setProgress(100);
            return;
        }

        const interval = setInterval(() => {
            const currentTime = Math.floor(Date.now() / 1000);
            
            if (currentTime >= streamInfo.stopTime) {
                setProgress(100);
                clearInterval(interval);
                return;
            }
            
            setProgress(calculateProgress());
        }, 5000); // Update every 5 seconds

        return () => clearInterval(interval);
    }, [streamInfo]);

    return progress;
}
