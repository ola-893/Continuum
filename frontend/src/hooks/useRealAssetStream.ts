import { useState, useEffect } from "react";
import { ContinuumService } from "../services/continuumService";

export interface RealStreamInfo {
    sender: string;
    recipient: string;
    totalAmount: number;
    flowRate: number;
    startTime: number;
    stopTime: number;
    amountWithdrawn: number;
    status: number;
    assetType?: number; // Asset type from registry (0=Real Estate, 1=Vehicle, 2=Commodities)
}

/**
 * Hook for fetching and tracking asset stream data from blockchain
 */
export function useAssetStream(tokenAddress: string | null) {
    const [streamId, setStreamId] = useState<number | null>(null);
    const [streamInfo, setStreamInfo] = useState<RealStreamInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load stream data from blockchain
    useEffect(() => {
        if (!tokenAddress) {
            setStreamInfo(null);
            setStreamId(null);
            return;
        }

        const loadStreamData = async () => {
            setLoading(true);
            setError(null);
            try {
                // Check if asset has a registered stream
                const isRegistered = await ContinuumService.isAssetRegistered(tokenAddress);

                if (!isRegistered) {
                    setError("No stream found for this asset");
                    setStreamInfo(null);
                    setStreamId(null);
                    setLoading(false);
                    return;
                }

                // Get stream ID
                const id = await ContinuumService.getAssetStreamId(tokenAddress);
                setStreamId(id);

                if (id !== null) {
                    // Get detailed stream info
                    const info = await ContinuumService.getStreamInfo(id);

                    // Get asset type from token registry
                    let assetType: number | undefined;
                    try {
                        const tokenDetails = await ContinuumService.getTokenDetailsFromRegistry(tokenAddress);
                        if (tokenDetails && tokenDetails.asset_type !== undefined) {
                            assetType = Number(tokenDetails.asset_type);
                        }
                    } catch (assetTypeError) {
                        console.warn("Could not fetch asset type:", assetTypeError);
                    }

                    if (info) {
                        setStreamInfo({ ...info, assetType });
                    }
                }
            } catch (err) {
                console.error("Error loading stream data:", err);
                setError("Failed to load stream data");
            } finally {
                setLoading(false);
            }
        };

        loadStreamData();
    }, [tokenAddress]);

    return {
        streamId,
        streamInfo,
        loading,
        error,
    };
}
