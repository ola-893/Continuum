import { useState, useEffect } from 'react';
import { ContinuumService } from '../services/continuumService';
import type { StreamInfo } from '../hooks/useStreamBalance';

/**
 * Convert blockchain stream info to UI StreamInfo format
 */
function convertToStreamInfo(blockchainInfo: any): StreamInfo {
    return {
        startTime: blockchainInfo.startTime,
        flowRate: blockchainInfo.flowRate / 100_000_000, // Convert to APT/sec for display
        amountWithdrawn: blockchainInfo.amountWithdrawn,
        totalAmount: blockchainInfo.totalAmount,
        stopTime: blockchainInfo.stopTime,
        isActive: blockchainInfo.status === 0, // 0 = Active
    };
}

/**
 * Hook to load real stream data from blockchain for multiple assets (Dashboard grid)
 */
export function useAssetList(tokenAddresses: string[]) {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (tokenAddresses.length === 0) {
            setAssets([]);
            return;
        }

        const loadAssets = async () => {
            setLoading(true);
            const loadedAssets = [];

            for (const tokenAddress of tokenAddresses) {
                try {
                    // Check if registered
                    const isRegistered = await ContinuumService.isAssetRegistered(tokenAddress);

                    if (isRegistered) {
                        // Get stream ID
                        const streamId = await ContinuumService.getAssetStreamId(tokenAddress);

                        if (streamId !== null) {
                            // Get stream info
                            const streamInfo = await ContinuumService.getStreamInfo(streamId);

                            if (streamInfo) {
                                loadedAssets.push({
                                    tokenAddress,
                                    streamInfo: convertToStreamInfo(streamInfo),
                                    assetType: 'Real Estate', // Default, could be enhanced
                                    title: `Asset #${tokenAddress.slice(-4)}`,
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error loading asset ${tokenAddress}:`, error);
                }
            }

            setAssets(loadedAssets);
            setLoading(false);
        };

        loadAssets();
    }, [tokenAddresses.join(',')]);

    return { assets, loading };
}
