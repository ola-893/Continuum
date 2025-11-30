import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { ContinuumService } from '../services/continuumService';
import { fetchIpfsMetadata, IPFS_GATEWAY } from '../utils/ipfs';
import type { StreamInfo } from '../types/continuum'; 
import { CONTRACT_CONFIG } from '../config/contracts'; 

export interface AssetData {
    tokenId: number;
    tokenAddress: string;
    assetType: string;
    title: string;
    description: string;
    imageUrl?: string;
    streamId?: number;
    streamInfo?: StreamInfo;
    metadataUri?: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
    location?: { lat: number; lng: number; city: string; }; // Added location
}

function getAssetTypeName(assetType: number): string {
    switch (assetType) {
        case 0: return 'Real Estate';
        case 1: return 'Vehicle';
        case 2: return 'Commodities';
        default: return 'Unknown Asset';
    }
}

export function useAssetList(ownerAddress?: string) {
    const [assets, setAssets] = useState<AssetData[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { address } = useAccount();

    useEffect(() => {
        const loadAssets = async () => {
            setLoading(true);
            setError(null);
            const fetchedAssets: AssetData[] = [];

            try {
                const allTokenIds = await ContinuumService.getAllTokenIds();

                for (const tokenId of allTokenIds) {
                    try {
                        const tokenDetails = await ContinuumService.getTokenDetails(tokenId);
                        const metadataUri = tokenDetails.metadata_uri;
                        
                        let assetMetadata: any = {};
                        if (metadataUri) {
                            assetMetadata = await fetchIpfsMetadata(metadataUri);
                            if (assetMetadata.image && assetMetadata.image.startsWith('ipfs://')) {
                                assetMetadata.image = `${IPFS_GATEWAY}${assetMetadata.image.replace('ipfs://', '')}`;
                            }
                        }

                        let streamInfo: StreamInfo | undefined;
                        if (tokenDetails.stream_id && Number(tokenDetails.stream_id) > 0) {
                            const rawStreamInfo = await ContinuumService.getStreamInfo(Number(tokenDetails.stream_id));
                            streamInfo = {
                                sender: rawStreamInfo.sender,
                                recipient: rawStreamInfo.recipient,
                                startTime: Number(rawStreamInfo.startTime),
                                flowRate: Number(ethers.formatUnits(rawStreamInfo.flowRate, 18)), 
                                amountWithdrawn: Number(ethers.formatUnits(rawStreamInfo.amountWithdrawn, 18)),
                                totalAmount: Number(ethers.formatUnits(rawStreamInfo.totalAmount, 18)),
                                stopTime: Number(rawStreamInfo.stopTime),
                                isActive: rawStreamInfo.isActive,
                            };
                        }

                        const tokenOwner = await ContinuumService.getTokenOwner(tokenId);
                        const isOwnedByUser = !ownerAddress || tokenOwner.toLowerCase() === (ownerAddress || '').toLowerCase();

                        if (isOwnedByUser) {
                            fetchedAssets.push({
                                tokenId,
                                tokenAddress: CONTRACT_CONFIG.TOKEN_REGISTRY_ADDRESS,
                                assetType: getAssetTypeName(tokenDetails.asset_type),
                                title: assetMetadata.name || `Asset #${tokenId}`,
                                description: assetMetadata.description || 'No description available.',
                                imageUrl: assetMetadata.image || undefined,
                                streamId: Number(tokenDetails.stream_id),
                                streamInfo,
                                metadataUri,
                                attributes: assetMetadata.attributes || [],
                                location: {
                                    lat: 37.7749 + (Math.random() - 0.5) * 0.5,
                                    lng: -122.4194 + (Math.random() - 0.5) * 0.5,
                                    city: 'San Francisco Bay Area',
                                },
                            });
                        }
                    } catch (innerError) {
                        console.warn(`Error fetching details for token ${tokenId}:`, innerError);
                    }
                }
                setAssets(fetchedAssets);
            } catch (outerError: any) {
                console.error("Error loading assets:", outerError);
                setError(outerError.message || "Failed to load assets.");
            } finally {
                setLoading(false);
            }
        };

        loadAssets();
    }, [address, ownerAddress]); 

    return { assets, loading, error };
}