import React from 'react'; // Removed useState
import { useAccount } from 'wagmi';
import { AssetCard } from '../components/ui/AssetCard';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { RefreshCw } from 'lucide-react';
import { useAssetList } from '../hooks/useAssetList'; 
import { Button } from '../components/ui/Button'; // Imported Button

export const Portfolio: React.FC = () => {
    const { isConnected, address } = useAccount();
    const { assets, loading, error } = useAssetList(address);

    const handleRefresh = () => {
        console.log('[Portfolio] Manual refresh triggered (effect handled by useAssetList)');
    };

    if (!isConnected) {
        return (
            <div style={{ padding: 'var(--spacing-2xl)' }}>
                <div className="card text-center p-xl">
                    <h2 className="mb-md">Connect Your Wallet</h2>
                    <p className="text-secondary">
                        Connect your wallet to view your yield-bearing assets
                    </p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <LoadingScreen message="Loading your yield portfolio..." />;
    }

    if (error) {
        return (
            <div style={{ padding: 'var(--spacing-2xl)' }}>
                <div className="card text-center p-xl">
                    <h2 className="mb-md">Error Loading Assets</h2>
                    <p className="text-secondary">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 style={{ marginBottom: 'var(--spacing-xs)' }}>My Portfolio</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {assets.length} yield-bearing asset{assets.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button
                    onClick={handleRefresh}
                    variant="secondary"
                    leftIcon={<RefreshCw size={16} />}
                >
                    Refresh
                </Button>
            </div>

            {assets.length === 0 ? (
                <div className="card text-center p-2xl">
                    <div className="text-3xl mb-md">📊</div>
                    <h3 className="mb-sm">No Yield Streams Found</h3>
                    <p className="text-secondary mb-md">
                        You don't have any yield-bearing assets yet. Browse the marketplace to find assets that generate income.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-xl">
                    {assets.map((asset) => (
                        <AssetCard key={`portfolio-${asset.tokenId}`} asset={asset} />
                    ))}
                </div>
            )}
        </div>
    );
};
