import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { AssetCard } from '../components/ui/AssetCard';
import { mockAssets } from '../data/mockAssets';

export const Dashboard: React.FC = () => {
    const { connected } = useWallet();

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
                        Manage your real-time yield streams and track asset performance
                    </p>
                </div>

                {/* Asset Grid */}
                <div className="grid grid-cols-3 gap-xl">
                    {mockAssets.map((asset, index) => (
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

                {/* Empty state if no assets */}
                {mockAssets.length === 0 && (
                    <div
                        className="card"
                        style={{
                            textAlign: 'center',
                            padding: 'var(--spacing-2xl)',
                        }}
                    >
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            No assets found. Start by creating your first yield stream!
                        </p>
                    </div>
                )}
            </motion.div>
        </div>
    );
};
