import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Plus } from 'lucide-react';
import { AssetCard } from '../components/ui/AssetCard';
import { Button } from '../components/ui/Button';
import { useAssetList } from '../hooks/useAssetList';

export const Portfolio: React.FC = () => {
    const { connected } = useWallet();
    const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
    const [newTokenAddress, setNewTokenAddress] = useState('');

    const { assets: userStreams } = useAssetList(tokenAddresses);

    const handleAddAsset = () => {
        if (newTokenAddress && !tokenAddresses.includes(newTokenAddress)) {
            setTokenAddresses([...tokenAddresses, newTokenAddress]);
            setNewTokenAddress('');
        }
    };

    if (!connected) {
        return (
            <div style={{ padding: 'var(--spacing-2xl)' }}>
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>🔒</div>
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Connect Your Wallet</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Connect your wallet to track your RWA portfolio
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            {/* Add Asset Section */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)', maxWidth: '600px' }}>
                    <input
                        type="text"
                        className="input"
                        placeholder="Enter token address (0x...)"
                        value={newTokenAddress}
                        onChange={(e) => setNewTokenAddress(e.target.value)}
                        style={{ flex: 1 }}
                    />
                    <Button onClick={handleAddAsset} disabled={!newTokenAddress.trim()}>
                        <Plus size={16} /> Add Asset
                    </Button>
                </div>
                <p style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                    Add NFT token addresses to track your yield streams
                </p>
            </div>

            {/* Assets Grid */}
            {tokenAddresses.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>📊</div>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Assets Yet</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Add token addresses above to start tracking your portfolio
                    </p>
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
