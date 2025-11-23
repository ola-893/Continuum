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
 * Convert numeric asset type to display string
 * Registry uses: 0=Real Estate, 1=Car/Vehicle, 2=Commodities
 */
function getAssetTypeName(assetType: number): string {
    switch (assetType) {
        case 0:
            return 'Real Estate';
        case 1:
            return 'Vehicle';
        case 2:
            return 'Commodities';
        default:
            return 'Real Estate';
    }
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

                            // Get token details from registry to fetch asset type
                            let assetType = 'Real Estate'; // fallback
                            try {
                                const tokenDetails = await ContinuumService.getTokenDetails(tokenAddress);
                                if (tokenDetails && tokenDetails.asset_type !== undefined) {
                                    assetType = getAssetTypeName(Number(tokenDetails.asset_type));
                                }
                            } catch (error) {
                                console.warn(`Could not fetch asset type for ${tokenAddress}, using default`);
                            }

                            if (streamInfo) {
                                loadedAssets.push({
                                    tokenAddress,
                                    streamInfo: convertToStreamInfo(streamInfo),
                                    assetType, // Now uses actual type from registry!
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
