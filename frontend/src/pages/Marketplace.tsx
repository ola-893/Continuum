import React, { useState, useEffect } from 'react';
import { MarketplaceCard } from '../components/ui/MarketplaceCard';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { useAssetList } from '../hooks/useAssetList';
import { ContinuumService } from '../services/continuumService';
import { Filter } from 'lucide-react';

export const Marketplace: React.FC = () => {
    const [publicTokenAddresses, setPublicTokenAddresses] = useState<string[]>([]);
    const [loadingRegistry, setLoadingRegistry] = useState(true);
    const [filterType, setFilterType] = useState<string>('all');

    const { assets: publicStreams } = useAssetList(publicTokenAddresses);

    // Load all registered tokens from the blockchain registry
    useEffect(() => {
        const fetchRegisteredTokens = async () => {
            setLoadingRegistry(true);
            try {
                const tokens = await ContinuumService.getAllRegisteredTokens();
                console.log('Fetched registered tokens:', tokens);

                const addresses = tokens.map((token: any) => {
                    return token.token_address || token.tokenAddress || token;
                });
                setPublicTokenAddresses(addresses.filter(addr => addr));
            } catch (error) {
                console.error('Error loading registered tokens:', error);
            } finally {
                setLoadingRegistry(false);
            }
        };

        fetchRegisteredTokens();
    }, []);

    // Filter assets by type
    const filteredAssets = filterType === 'all'
        ? publicStreams
        : publicStreams.filter(asset => asset.assetType === filterType);

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>RWA Marketplace</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Discover and explore tokenized real-world assets with yield streams
                </p>
            </div>

            {loadingRegistry ? (
                <LoadingScreen message="Loading marketplace from blockchain..." />
            ) : publicTokenAddresses.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🏪</div>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Assets Listed Yet</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Minted RWAs will appear here once registered on the blockchain
                    </p>
                </div>
            ) : (
                <>
                    {/* Filters */}
                    <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                        <Filter size={18} style={{ color: 'var(--color-text-secondary)' }} />
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            {['all', 'Real Estate', 'Securities', 'Commodities'].map((type) => (
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
                        {filteredAssets.map((stream, index) => (
                            <MarketplaceCard key={`marketplace-${index}`} asset={stream} />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
