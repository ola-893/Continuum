import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { motion } from 'framer-motion';
import { Wallet, Plus } from 'lucide-react';
import { AssetCard } from '../components/ui/AssetCard';
import { Button } from '../components/ui/Button';
import { ContinuumService } from '../services/continuumService';
import type { StreamInfo } from '../hooks/useStreamBalance';

// Helper to convert blockchain stream to UI format
function convertToStreamInfo(blockchainInfo: any): StreamInfo {
    return {
        startTime: blockchainInfo.startTime,
        flowRate: blockchainInfo.flowRate / 100_000_000, // Convert to APT/sec for display
        amountWithdrawn: blockchainInfo.amountWithdrawn,
        totalAmount: blockchainInfo.totalAmount,
        stopTime: blockchainInfo.stopTime,
        isActive: blockchainInfo.status === 0, // 0 = Active
    };
}

export const Dashboard: React.FC = () => {
    const { connected } = useWallet();
    const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
    const [newAddress, setNewAddress] = useState('');
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Load real assets from blockchain when addresses change
    useEffect(() => {
        if (!connected || tokenAddresses.length === 0) {
            setAssets([]);
            return;
        }

        const loadAssets = async () => {
            setLoading(true);
            const loadedAssets = [];

            for (const tokenAddress of tokenAddresses) {
                try {
                    // Check if this address has a registered stream
                    const isRegistered = await ContinuumService.isAssetRegistered(tokenAddress);

                    if (isRegistered) {
                        // Get the stream ID
                        const streamId = await ContinuumService.getAssetStreamId(tokenAddress);

                        if (streamId !== null) {
                            // Get full stream info from blockchain
                            const streamInfo = await ContinuumService.getStreamInfo(streamId);

                            if (streamInfo) {
                                loadedAssets.push({
                                    tokenAddress,
                                    streamInfo: convertToStreamInfo(streamInfo),
                                    assetType: 'Real Estate', // You can enhance this by storing type in your contract
                                    title: `Asset #${tokenAddress.slice(-4).toUpperCase()}`,
                                    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&q=80', // Placeholder
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error loading asset ${tokenAddress}:`, error);
                }
            }

            setAssets(loadedAssets);
            setLoading(false);
        };

        loadAssets();
    }, [connected, tokenAddresses]);

    const handleAddAsset = () => {
        if (newAddress && !tokenAddresses.includes(newAddress)) {
            setTokenAddresses([...tokenAddresses, newAddress]);
            setNewAddress('');
        }
    };

    if (!connected) {
        // Empty State - Wallet Not Connected
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center"
                    style={{ minHeight: '70vh', textAlign: 'center' }}
                >
                    <div
                        className="glass"
                        style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 'var(--spacing-xl)',
                        }}
                    >
                        <Wallet size={50} style={{ color: 'var(--color-primary)' }} />
                    </div>

                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Welcome to Continuum</h2>
                    <p
                        style={{
                            color: 'var(--color-text-secondary)',
                            marginBottom: 'var(--spacing-xl)',
                            maxWidth: '400px',
                        }}
                    >
                        Connect your Aptos wallet to access your yield-streaming assets and manage your portfolio.
                    </p>

                    <WalletSelector />

                    <p style={{ marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                        Status: <span style={{ color: 'var(--color-error)' }}>Wallet Disconnected</span>
                    </p>
                </motion.div>
            </div>
        );
    }

    // Portfolio View - Connected State
    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Header */}
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Your Portfolio</h1>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Add your NFT token addresses to monitor real-time yield streams from the blockchain
                    </p>
                </div>

                {/* Add Asset Form */}
                <div className="card" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <h3 style={{ marginBottom: 'var(--spacing-md)' }}>📍 Add Asset to Monitor</h3>
                    <div className="flex gap-md">
                        <input
                            type="text"
                            className="input"
                            placeholder="Enter NFT Token Address (0x...)"
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Button
                            variant="primary"
                            leftIcon={<Plus size={18} />}
                            onClick={handleAddAsset}
                            disabled={!newAddress || loading}
                        >
                            Add Asset
                        </Button>
                    </div>
                    <p style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                        Enter the token object address of an NFT with a registered yield stream
                    </p>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <p>Loading assets from blockchain...</p>
                    </div>
                )}

                {/* Asset Grid - Real Data from Blockchain */}
                {!loading && assets.length > 0 && (
                    <div className="grid grid-cols-3 gap-xl">
                        {assets.map((asset: any, index: number) => (
                            <motion.div
                                key={asset.tokenAddress}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <AssetCard
                                    tokenAddress={asset.tokenAddress}
                                    assetType={asset.assetType}
                                    title={asset.title}
                                    imageUrl={asset.imageUrl}
                                    streamInfo={asset.streamInfo}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Empty State */}
                {!loading && assets.length === 0 && tokenAddresses.length === 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>No Assets Yet</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Add your first NFT token address above to start monitoring yield streams
                        </p>
                    </div>
                )}

                {/* No Streams Found State */}
                {!loading && assets.length === 0 && tokenAddresses.length > 0 && (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', border: '1px solid var(--color-warning)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-warning)' }}>⚠️ No Streams Found</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            The token addresses you added don't have registered yield streams yet.
                            Create a stream for these assets using the admin panel.
                        </p>
                    </div>
                )}

                {/* Blockchain Info */}
                <div className="card" style={{ marginTop: 'var(--spacing-2xl)', background: 'rgba(0, 217, 255, 0.1)', border: '1px solid var(--color-primary)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>🔗 Real Blockchain Integration Active</h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                        Connected to contract: <code>0x7c68c08ed30efcb9159b90c398247bf6504ab11678b39e58db12cae2360c9dc3</code>
                    </p>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        All data is fetched live from Aptos testnet. Balances update every 5 seconds.
                    </p>
                </div>
            </motion.div>
        </div>
    );
};
