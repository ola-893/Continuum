import React from 'react';
import { AssetExplorerCard } from '../components/ui/AssetExplorerCard';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { Compass } from 'lucide-react';
import { useAssetList } from '../hooks/useAssetList';

export const AssetExplorer: React.FC = () => {
    const { assets, loading, error } = useAssetList();

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
                    Discover tokenized real estate assets with active yield streams on the BNB Smart Chain
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
                    <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-sm)', marginLeft: 'auto' }}>
                        {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
                    </span>
                    <div className="grid grid-cols-3 gap-xl">
                        {assets.map((asset) => (
                            <AssetExplorerCard key={`explorer-${asset.tokenId}`} asset={asset} />
                        ))}
                    </div>
                </>
            )}

        </div>
    );
};
