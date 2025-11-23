import React, { useState, useEffect } from 'react';
import { AssetExplorerCard } from '../components/ui/AssetExplorerCard';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { ContinuumService } from '../services/continuumService';
import { Filter, Compass } from 'lucide-react';

interface ExplorerAsset {
    tokenAddress: string;
    assetType: string;
    title: string;
    imageUrl: string | undefined;
    streamInfo: {
        startTime: number;
        flowRate: number;
        amountWithdrawn: number;
        totalAmount: number;
        stopTime: number;
        isActive: boolean;
    };
}

export const AssetExplorer: React.FC = () => {
    const [assets, setAssets] = useState<ExplorerAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        try {
            setLoading(true);
            console.log('[AssetExplorer] Loading registered tokens...');

            // Fetch all registered tokens from blockchain
            const tokens = await ContinuumService.getAllRegisteredTokens();
            console.log('[AssetExplorer] Found tokens:', tokens.length);

            // Process tokens in parallel
            const assetsWithStreams = await Promise.all(
                tokens.map(async (token: any) => {
                    const tokenAddress = token.token_address;
                    const streamId = Number(token.stream_id);
                    const assetType = token.asset_type !== undefined ? Number(token.asset_type) : undefined;

                    // Only process tokens with valid stream IDs
                    if (!streamId) {
                        console.log(`[AssetExplorer] Skipping ${tokenAddress} - no stream`);
                        return null;
                    }

                    try {
                        // Fetch stream info
                        const streamInfo = await ContinuumService.getStreamInfo(streamId);

                        if (!streamInfo) {
                            return null;
                        }

                        // Map asset type to readable name
                        const getAssetTypeName = (type: number | undefined): string => {
                            switch (type) {
                                case 0: return 'Real Estate';
                                case 1: return 'Vehicle';
                                case 2: return 'Commodities';
                                default: return 'Unknown Asset';
                            }
                        };

                        return {
                            tokenAddress,
                            assetType: getAssetTypeName(assetType),
                            title: `Asset ${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}`,
                            imageUrl: undefined, // Use gradient fallback
                            streamInfo: {
                                startTime: streamInfo.startTime,
                                flowRate: streamInfo.flowRate / 100_000_000, // Convert to APT/sec
                                amountWithdrawn: streamInfo.amountWithdrawn / 100_000_000, // Convert to APT
                                totalAmount: streamInfo.totalAmount / 100_000_000, // Convert to APT
                                stopTime: streamInfo.stopTime,
                                isActive: streamInfo.status === 0,
                            },
                        };
                    } catch (error) {
                        console.error(`[AssetExplorer] Error loading stream for ${tokenAddress}:`, error);
                        return null;
                    }
                })
            );

            // Filter out null results
            const validAssets = assetsWithStreams.filter((asset): asset is ExplorerAsset => asset !== null);

            console.log('[AssetExplorer] Loaded assets:', validAssets.length);
            setAssets(validAssets);
        } catch (error) {
            console.error('[AssetExplorer] Error loading assets:', error);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };

    // Filter assets by type
    const filteredAssets = filterType === 'all'
        ? assets
        : assets.filter(asset => asset.assetType === filterType);

    if (loading) {
        return <LoadingScreen message="Loading RWA assets from blockchain..." />;
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                    <Compass size={32} style={{ color: 'var(--color-primary)' }} />
                    <h1>Explore RWA Assets</h1>
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Discover tokenized real-world assets with active yield streams on the blockchain
                </p>
            </div>

            {assets.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🔍</div>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Assets Found</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        RWA assets with active yield streams will appear here once registered on the blockchain
                    </p>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                        <Filter size={18} style={{ color: 'var(--color-text-secondary)' }} />
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            {['all', 'Real Estate', 'Vehicle', 'Commodities'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        background: filterType === type
                                            ? 'var(--color-primary)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: filterType === type
                                            ? '1px solid var(--color-primary)'
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: 'var(--border-radius-md)',
                                        color: filterType === type ? 'white' : 'var(--color-text-secondary)',
                                        fontSize: 'var(--font-size-sm)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        textTransform: 'capitalize',
                                    }}
                                >
                                    {type === 'all' ? 'All Assets' : type}
                                </button>
                            ))}
                        </div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginLeft: 'auto' }}>
                            {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
                        </span>
                    </div>

                    {/* Assets Grid */}
                    <div className="grid grid-cols-3 gap-xl">
                        {filteredAssets.map((asset, index) => (
                            <AssetExplorerCard key={`explorer-${asset.tokenAddress}-${index}`} asset={asset} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
