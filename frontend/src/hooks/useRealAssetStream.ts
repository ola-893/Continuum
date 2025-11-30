import { useState, useEffect } from "react";
import { ContinuumService } from "../services/continuumService";
import { fetchIpfsMetadata, IPFS_GATEWAY } from "../utils/ipfs";
import { ethers } from "ethers";

export interface RealStreamInfo {
    sender: string;
    recipient: string;
    totalAmount: number;
    flowRate: number;
    startTime: number;
    stopTime: number;
    amountWithdrawn: number;
    isActive: boolean;
    assetType?: number;
    metadataUri?: string;
    title?: string;
    description?: string;
    imageUrl?: string;
    attributes?: Array<{ trait_type: string; value: string | number }>;
}

/**
 * Hook for fetching and tracking asset stream data from blockchain for a single token.
 * In EVM context, `tokenId` is used instead of `tokenAddress` directly for token lookup.
 */
export function useAssetStream(tokenId: string | null) {
    const [streamId, setStreamId] = useState<number | null>(null);
    const [streamInfo, setStreamInfo] = useState<RealStreamInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!tokenId) {
            setStreamInfo(null);
            setStreamId(null);
            return;
        }

        const loadStreamData = async () => {
            setLoading(true);
            setError(null);
            try {
                const numericTokenId = Number(tokenId);
                if (isNaN(numericTokenId) || numericTokenId === 0) {
                    throw new Error("Invalid Token ID");
                }

                // Fetch token details from the TokenRegistry
                const tokenDetails = await ContinuumService.getTokenDetails(numericTokenId);

                if (!tokenDetails || tokenDetails.registered_at === 0) {
                    setError("Asset not found or not registered on blockchain");
                    setStreamInfo(null);
                    setStreamId(null);
                    return;
                }

                setStreamId(Number(tokenDetails.stream_id));

                let currentStreamInfo: RealStreamInfo = {
                    sender: "", recipient: "", totalAmount: 0, flowRate: 0, 
                    startTime: 0, stopTime: 0, amountWithdrawn: 0, isActive: false,
                    assetType: Number(tokenDetails.asset_type),
                    metadataUri: tokenDetails.metadata_uri
                };

                // If there's an associated stream, fetch its details
                if (tokenDetails.stream_id && Number(tokenDetails.stream_id) > 0) {
                    const rawStreamInfo = await ContinuumService.getStreamInfo(Number(tokenDetails.stream_id));
                    currentStreamInfo = {
                        ...currentStreamInfo,
                        sender: rawStreamInfo.sender,
                        recipient: rawStreamInfo.recipient,
                        totalAmount: Number(ethers.formatUnits(rawStreamInfo.totalAmount, 18)),
                        flowRate: Number(ethers.formatUnits(rawStreamInfo.flowRate, 18)),
                        startTime: Number(rawStreamInfo.startTime),
                        stopTime: Number(rawStreamInfo.stopTime),
                        amountWithdrawn: Number(ethers.formatUnits(rawStreamInfo.amountWithdrawn, 18)),
                        isActive: rawStreamInfo.isActive,
                    };
                }

                // Fetch IPFS metadata
                if (currentStreamInfo.metadataUri) {
                    const assetMetadata = await fetchIpfsMetadata(currentStreamInfo.metadataUri);
                    if (assetMetadata) {
                        if (assetMetadata.image && assetMetadata.image.startsWith('ipfs://')) {
                            assetMetadata.image = `${IPFS_GATEWAY}${assetMetadata.image.replace('ipfs://', '')}`;
                        }
                        currentStreamInfo = {
                            ...currentStreamInfo,
                            title: assetMetadata.name,
                            description: assetMetadata.description,
                            imageUrl: assetMetadata.image,
                            attributes: assetMetadata.attributes,
                        };
                    }
                }
                
                setStreamInfo(currentStreamInfo);

            } catch (err: any) {
                console.error("Error loading stream data:", err);
                setError(err.message || "Failed to load stream data");
            } finally {
                setLoading(false);
            }
        };

        loadStreamData();
    }, [tokenId]);

    return {
        streamId,
        streamInfo,
        loading,
        error,
    };
}