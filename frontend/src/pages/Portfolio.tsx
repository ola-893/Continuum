import React, { useState, useEffect } from 'react';
import { MultiAssetStreamDisplay, useMultiAssetStreams, type AssetStreamData } from '../components/ui/MultiAssetStreamDisplay';
import { useTezosWallet } from '../hooks/useTezosWallet';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { RefreshCw, Grid, List, Filter } from 'lucide-react';

interface PortfolioAsset {
    tokenAddress: string;
    streamInfo: {
        sender: string;
        recipient: string;
        startTime: number;
        flowRate: number;
        amountWithdrawn: number;
        totalAmount: number;
        stopTime: number;
        status: number;
    };
    assetType: string;
    title: string;
    imageUrl: string;
}

export const Portfolio: React.FC = () => {
    const { connected, address } = useTezosWallet();
    const [assets, setAssets] = useState<PortfolioAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterAssetType, setFilterAssetType] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    // Convert portfolio assets to multi-asset stream format
    const assetStreamData: AssetStreamData[] = assets.map((asset) => ({
        tokenAddress: asset.tokenAddress,
        assetType: asset.assetType,
        title: asset.title,
        imageUrl: asset.imageUrl,
        streamInfo: asset.streamInfo,
        tokenSymbol: 'XTZ',
        tokenDecimals: 6,
    }));

    // Use multi-asset stream utilities
    const {
        activeCount,
        filterByAssetType,
    } = useMultiAssetStreams(assetStreamData);

    // Apply filters
    const filteredAssets = filterAssetType
        ? filterByAssetType(filterAssetType)
        : assetStreamData;

    /**
     * Portfolio Strategy: Show assets where user is the YIELD RECIPIENT
     * In Continuum, "owning" an asset means receiving its yield stream,
     * not necessarily holding the NFT object.
     */
    useEffect(() => {
        const loadPortfolio = async () => {
            if (!connected || !address) {
                setAssets([]);
                return;
            }

            setLoading(true);
            try {
                console.log(`[Portfolio] Loading portfolio for: ${address}`);
                // TODO: Implement Tezos portfolio loading
                // For now, show empty state
                setAssets([]);
            } catch (error) {
                console.error('[Portfolio] Error loading portfolio:', error);
                setAssets([]);
            } finally {
                setLoading(false);
            }
        };

        loadPortfolio();
    }, [connected, address, lastRefresh]);

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
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <div>
                        <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>My Portfolio</h1>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                            {assets.length} yield-bearing asset{assets.length !== 1 ? 's' : ''} • {activeCount} active stream{activeCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                        {/* View Mode Toggle */}
                        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 'var(--border-radius-md)', padding: '4px' }}>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}
                                style={{
                                    padding: 'var(--spacing-sm)',
                                    minWidth: 'auto',
                                }}
                                title="Grid View"
                            >
                                <Grid size={16} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}
                                style={{
                                    padding: 'var(--spacing-sm)',
                                    minWidth: 'auto',
                                }}
                                title="List View"
                            >
                                <List size={16} />
                            </button>
                        </div>

                        {/* Refresh Button */}
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
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                    <Filter size={16} style={{ color: 'var(--color-text-secondary)' }} />
                    <button
                        onClick={() => setFilterAssetType(null)}
                        className={filterAssetType === null ? 'btn-primary' : 'btn-secondary'}
                        style={{
                            padding: 'var(--spacing-xs) var(--spacing-md)',
                            fontSize: 'var(--font-size-sm)',
                        }}
                    >
                        All Assets
                    </button>
                    <button
                        onClick={() => setFilterAssetType('Real Estate')}
                        className={filterAssetType === 'Real Estate' ? 'btn-primary' : 'btn-secondary'}
                        style={{
                            padding: 'var(--spacing-xs) var(--spacing-md)',
                            fontSize: 'var(--font-size-sm)',
                        }}
                    >
                        Real Estate
                    </button>
                    <button
                        onClick={() => setFilterAssetType('Vehicle')}
                        className={filterAssetType === 'Vehicle' ? 'btn-primary' : 'btn-secondary'}
                        style={{
                            padding: 'var(--spacing-xs) var(--spacing-md)',
                            fontSize: 'var(--font-size-sm)',
                        }}
                    >
                        Vehicles
                    </button>
                    <button
                        onClick={() => setFilterAssetType('Commodities')}
                        className={filterAssetType === 'Commodities' ? 'btn-primary' : 'btn-secondary'}
                        style={{
                            padding: 'var(--spacing-xs) var(--spacing-md)',
                            fontSize: 'var(--font-size-sm)',
                        }}
                    >
                        Commodities
                    </button>
                    <div style={{ marginLeft: 'auto' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showDetails}
                                onChange={(e) => setShowDetails(e.target.checked)}
                            />
                            Show Details
                        </label>
                    </div>
                </div>
            </div>

            {/* Assets Display */}
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
                <MultiAssetStreamDisplay
                    assets={filteredAssets}
                    layout={viewMode}
                    showDetails={showDetails}
                />
            )}
        </div>
    );
};
