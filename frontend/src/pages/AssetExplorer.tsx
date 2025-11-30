import React, { useState } from 'react';
import { AssetExplorerCard } from '../components/ui/AssetExplorerCard';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { Filter, Compass } from 'lucide-react';
import { useAssetList } from '../hooks/useAssetList'; 

export const AssetExplorer: React.FC = () => {
    const { assets, loading, error } = useAssetList(); 
    const [filterType, setFilterType] = useState<string>('all');

    const filteredAssets = filterType === 'all'
        ? assets
        : assets.filter(asset => asset.assetType === filterType);

    if (loading) {
        return <LoadingScreen message="Loading RWA assets from blockchain..." />;
    }

    if (error) {
        return (
            <div style={{ padding: 'var(--spacing-2xl)' }}>
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Error Loading Assets</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                    <Compass size={32} style={{ color: 'var(--color-primary)' }} />
                    <h1>Explore RWA Assets</h1>
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Discover tokenized real-world assets with active yield streams on the BNB Smart Chain
                </p>
            </div>

            {filteredAssets.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🔍</div>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Assets Found</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        RWA assets with active yield streams will appear here once registered on the blockchain
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 'var(--spacing-xl)', display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                        <Filter size={18} style={{ color: 'var(--color-text-secondary)' }} />
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            {['all', 'Real Estate', 'Vehicle', 'Commodities'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`btn-filter ${filterType === type ? 'active' : ''}`}
                                >
                                    {type === 'all' ? 'All Assets' : type}
                                </button>
                            ))}
                        </div>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginLeft: 'auto' }}>
                            {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-xl">
                        {filteredAssets.map((asset) => (
                            <AssetExplorerCard key={`explorer-${asset.tokenId}`} asset={asset} />
                        ))}
                    </div>
                </>
            )}
            <style>
                {`
                .btn-filter {
                    padding: var(--spacing-sm) var(--spacing-md);
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: var(--border-radius-md);
                    color: var(--color-text-secondary);
                    font-size: var(--font-size-sm);
                    cursor: pointer;
                    transition: all 0.2s ease;
                    text-transform: capitalize;
                }
                .btn-filter:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: var(--color-text-primary);
                }
                .btn-filter.active {
                    background: var(--color-primary);
                    border-color: var(--color-primary);
                    color: white;
                }
            `}
            </style>
        </div>
    );
};
