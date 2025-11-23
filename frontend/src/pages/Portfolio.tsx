import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AssetCard } from '../components/ui/AssetCard';
import { ContinuumService } from '../services/continuumService';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { RefreshCw } from 'lucide-react';
import { generateMockAssetData, getMockImage } from '../utils/mockDataGenerator';

interface PortfolioAsset {
    tokenAddress: string;
    streamInfo: {
        startTime: number;
        flowRate: number;
        amountWithdrawn: number;
        totalAmount: number;
        stopTime: number;
        isActive: boolean;
    };
    assetType: string;
    title: string;
    imageUrl: string;
}

export const Portfolio: React.FC = () => {
    const { connected, account } = useWallet();
    const [assets, setAssets] = useState<PortfolioAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

    /**
     * Portfolio Strategy: Show assets where user is the YIELD RECIPIENT
     * In YieldStream, "owning" an asset means receiving its yield stream,
     * not necessarily holding the NFT object.
     */
    useEffect(() => {
        const loadPortfolio = async () => {
            if (!connected || !account) {
                setAssets([]);
                return;
            }

            setLoading(true);
            try {
                console.log(`[Portfolio] Loading portfolio for: ${account.address}`);

                // Get ALL registered tokens from the marketplace
                const allTokens = await ContinuumService.getAllRegisteredTokens();
                console.log(`[Portfolio] Found ${allTokens.length} registered tokens`);

                // Process all tokens in parallel and filter for owned assets
                const allAssetsData = await Promise.all(
                    allTokens.map(async (token: any) => {
                        try {
                            const tokenAddress = token.token_address || token.tokenAddress;
                            const assetTypeNumber = token.asset_type !== undefined
                                ? Number(token.asset_type)
                                : (token.assetType !== undefined ? Number(token.assetType) : 0);
                            const streamId = Number(token.stream_id || token.streamId || 0);

                            // Skip tokens without a stream
                            if (streamId === 0) {
                                console.log(`[Portfolio] Skipping ${tokenAddress} - no stream`);
                                return null;
                            }

                            // Get stream info to check recipient
                            const streamInfo = await ContinuumService.getStreamInfo(streamId);
                            if (!streamInfo) {
                                console.log(`[Portfolio] Skipping ${tokenAddress} - no stream info`);
                                return null;
                            }

                            // Check if current user is the yield recipient
                            const isRecipient = streamInfo.recipient.toLowerCase() === account.address.toLowerCase();
                            if (!isRecipient) {
                                console.log(`[Portfolio] Skipping ${tokenAddress} - not recipient (recipient: ${streamInfo.recipient})`);
                                return null;
                            }

                            console.log(`[Portfolio] ✓ Found owned asset: ${tokenAddress}`);

                            // Get asset type name
                            let assetType = 'Real Estate';
                            switch (assetTypeNumber) {
                                case 0: assetType = 'Real Estate'; break;
                                case 1: assetType = 'Vehicle'; break;
                                case 2: assetType = 'Commodities'; break;
                            }

                            // Fetch NFT metadata
                            let assetName = '';
                            let assetImage = '';
                            try {
                                const nftMetadata = await ContinuumService.getNFTMetadata(tokenAddress);
                                assetName = nftMetadata.name || '';
                            } catch (error) {
                                // Silent fail - will use mock data
                            }

                            // Use smart mock data if needed
                            if (!assetName) {
                                const mockData = generateMockAssetData(assetTypeNumber, tokenAddress, 'portfolio');
                                assetName = mockData.name;
                                assetImage = mockData.image;
                            } else {
                                assetImage = getMockImage(assetTypeNumber, tokenAddress);
                            }

                            // Format stream info
                            const formattedStreamInfo = {
                                startTime: streamInfo.startTime,
                                flowRate: streamInfo.flowRate / 100_000_000, // Convert to APT/sec
                                amountWithdrawn: streamInfo.amountWithdrawn,
                                totalAmount: streamInfo.totalAmount,
                                stopTime: streamInfo.stopTime,
                                isActive: streamInfo.status === 0,
                            };

                            return {
                                tokenAddress,
                                streamInfo: formattedStreamInfo,
                                assetType,
                                title: assetName,
                                imageUrl: assetImage,
                            };
                        } catch (error) {
                            console.warn(`[Portfolio] Error processing token:`, error);
                            return null;
                        }
                    })
                );

                // Filter out nulls (non-owned assets)
                const ownedAssets = allAssetsData.filter((asset): asset is PortfolioAsset => asset !== null);

                console.log(`[Portfolio] Total owned assets: ${ownedAssets.length}`);
                setAssets(ownedAssets);
            } catch (error) {
                console.error('[Portfolio] Error loading portfolio:', error);
                setAssets([]);
            } finally {
                setLoading(false);
            }
        };

        loadPortfolio();
    }, [connected, account, lastRefresh]);

    const handleRefresh = () => {
        console.log('[Portfolio] Manual refresh triggered');
        setLastRefresh(Date.now());
    };

    if (!connected) {
        return (
            <div style={{ padding: 'var(--spacing-2xl)' }}>
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>🔒</div>
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Connect Your Wallet</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Connect your wallet to view your yield-bearing assets
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <LoadingScreen message="Loading your yield portfolio..." />;
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>My Portfolio</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {assets.length} yield-bearing asset{assets.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="btn-secondary"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                    }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Assets Grid */}
            {assets.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📊</div>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Yield Streams Found</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                        You don't have any yield-bearing assets yet. Browse the marketplace to find assets that generate income.
                    </p>
                    <a
                        href="/dashboard"
                        className="btn-primary"
                        style={{
                            display: 'inline-block',
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            textDecoration: 'none',
                        }}
                    >
                        Explore Assets
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-xl">
                    {assets.map((asset) => (
                        <AssetCard key={`portfolio-${asset.tokenAddress}`} asset={asset} />
                    ))}
                </div>
            )}
        </div>
    );
};
