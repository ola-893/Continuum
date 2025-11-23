import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { AssetCard } from '../components/ui/AssetCard';
import { useAssetList } from '../hooks/useAssetList';
import { ContinuumService } from '../services/continuumService';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { RefreshCw } from 'lucide-react';

export const Portfolio: React.FC = () => {
    const { connected, account } = useWallet();
    const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

    const { assets: userStreams } = useAssetList(tokenAddresses);

    // Auto-detect owned RWA NFTs when wallet connects
    useEffect(() => {
        const fetchOwnedTokens = async () => {
            if (!connected || !account) {
                setTokenAddresses([]);
                return;
            }

            setLoading(true);
            try {
                const ownedTokens = await ContinuumService.getOwnedRWATokens(account.address);
                console.log('Auto-detected owned RWA tokens:', ownedTokens);
                setTokenAddresses(ownedTokens);
            } catch (error) {
                console.error('Error fetching owned tokens:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOwnedTokens();
    }, [connected, account, lastRefresh]);

    const handleRefresh = () => {
        setLastRefresh(Date.now());
    };

    if (!connected) {
        return (
            <div style={{ padding: 'var(--spacing-2xl)' }}>
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>🔒</div>
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Connect Your Wallet</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Connect your wallet to view your RWA portfolio
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <LoadingScreen message="Loading your RWA portfolio..." />;
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            {/* Header with Refresh */}
            <div style={{ marginBottom: 'var(--spacing-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>My Portfolio</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {tokenAddresses.length} RWA NFT{tokenAddresses.length !== 1 ? 's' : ''} detected
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        background: 'rgba(0, 217, 255, 0.1)',
                        border: '1px solid rgba(0, 217, 255, 0.3)',
                        borderRadius: 'var(--border-radius-md)',
                        color: 'var(--color-primary)',
                        fontSize: 'var(--font-size-sm)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 217, 255, 0.2)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(0, 217, 255, 0.3)';
                    }}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Assets Grid */}
            {tokenAddresses.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🏦</div>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No RWA NFTs Found</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                        You don't own any RWA NFTs yet. Browse the marketplace to discover yield-bearing assets.
                    </p>
                    <a
                        href="/dashboard"
                        style={{
                            display: 'inline-block',
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            background: 'var(--color-primary)',
                            color: 'white',
                            borderRadius: 'var(--border-radius-md)',
                            textDecoration: 'none',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 600,
                            transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                        Browse Marketplace
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-xl">
                    {userStreams.map((stream, index) => (
                        <AssetCard key={`portfolio-${index}`} asset={stream} />
                    ))}
                </div>
            )}
        </div>
    );
};
