import { useState, useEffect } from 'react';
import { ContinuumService } from '../services/continuumService';
import { generateMockAssetData, getMockImage } from '../utils/mockDataGenerator';
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

                            // Fetch asset details from the token registry to get asset type
                            let assetType: string = 'Unknown Asset';
                            let assetTypeNumber: number | undefined = undefined;
                            let title = '';
                            let imageUrl = '';

                            try {
                                const tokenDetails = await ContinuumService.getTokenDetailsFromRegistry(tokenAddress);
                                if (tokenDetails && tokenDetails.asset_type !== undefined) {
                                    assetTypeNumber = Number(tokenDetails.asset_type);
                                    assetType = getAssetTypeName(assetTypeNumber);
                                }
                            } catch (error) {
                                console.warn(`Could not fetch asset_type for ${tokenAddress}:`, error);
                            }

                            // Try to fetch NFT metadata for title
                            try {
                                const nftMetadata = await ContinuumService.getNFTMetadata(tokenAddress);
                                if (nftMetadata?.name) {
                                    title = nftMetadata.name;
                                }
                            } catch (error) {
                                console.warn(`Could not fetch NFT metadata for ${tokenAddress}`);
                            }

                            // Use smart mock data if title is missing
                            if (!title) {
                                const mockData = generateMockAssetData(assetTypeNumber, tokenAddress, 'marketplace');
                                title = mockData.name;
                                imageUrl = mockData.image;
                            } else {
                                // Use mock image if we have real title but no image
                                imageUrl = getMockImage(assetTypeNumber, tokenAddress);
                            }

                            if (streamInfo) {
                                loadedAssets.push({
                                    tokenAddress,
                                    streamInfo: convertToStreamInfo(streamInfo),
                                    assetType,
                                    title,
                                    imageUrl,
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
