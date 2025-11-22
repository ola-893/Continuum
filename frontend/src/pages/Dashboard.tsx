import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Plus } from 'lucide-react';
import { AssetCard } from '../components/ui/AssetCard';
import { Button } from '../components/ui/Button';
import { useAssetList } from '../hooks/useAssetList';
import { ContinuumService } from '../services/continuumService';

export const Dashboard: React.FC = () => {
    const { connected } = useWallet();

    // User's personal assets
    const [tokenAddresses, setTokenAddresses] = useState<string[]>([]);
    const [newTokenAddress, setNewTokenAddress] = useState('');

    // Public streams - fetched from blockchain registry
    const [publicTokenAddresses, setPublicTokenAddresses] = useState<string[]>([]);
    const [loadingRegistry, setLoadingRegistry] = useState(true);

    // Load all registered tokens from the blockchain registry
    useEffect(() => {
        const fetchRegisteredTokens = async () => {
            setLoadingRegistry(true);
            try {
                const tokens = await ContinuumService.getAllRegisteredTokens();
                console.log('Fetched registered tokens:', tokens);

                // New structure: TokenIndexEntry has token_address field
                const addresses = tokens.map((token: any) => {
                    // Handle both old and new structure
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

    // Load streams for user's assets and public streams
    const { assets: userStreams, loading: loadingUserStreams } = useAssetList(tokenAddresses);
    const { assets: publicStreams, loading: loadingPublicStreams } = useAssetList(publicTokenAddresses);

    const handleAddAsset = () => {
        if (newTokenAddress && !tokenAddresses.includes(newTokenAddress)) {
            setTokenAddresses([...tokenAddresses, newTokenAddress]);
            setNewTokenAddress('');
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            {/* Hero Section */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>RWA Dashboard</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Track your real-world assets and explore public streams
                </p>
            </div>

            {!connected ? (
                // Disconnected State
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>🔒</div>
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Connect Your Wallet</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Connect your wallet to track real-world assets and manage yield streams.
                    </p>
                </div>
            ) : (
                <>
                    {/* User's Personal Assets Section */}
                    <div style={{ marginBottom: 'var(--spacing-3xl)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-xl)' }}>
                            <h2>My Assets</h2>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="Add token address (0x...)"
                                    value={newTokenAddress}
                                    onChange={(e) => setNewTokenAddress(e.target.value)}
                                    style={{ minWidth: '400px' }}
                                />
                                <Button onClick={handleAddAsset} disabled={!newTokenAddress.trim()}>
                                    <Plus size={16} /> Add Asset
                                </Button>
                            </div>
                        </div>

                        {tokenAddresses.length === 0 ? (
                            <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🏢</div>
                                <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Assets Yet</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    Add a token address above to track your RWA streams
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-xl">
                                {userStreams.map((stream, index) => (
                                    <AssetCard key={`user-${index}`} asset={stream} />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Public Streams Gallery Section */}
                    <div>
                        <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                            <h2 style={{ marginBottom: 'var(--spacing-xs)' }}>🌐 Public RWA Streams</h2>
                            <p style={{ color: 'var(--color-text-secondary)' }}>
                                All minted real-world assets from the blockchain registry
                            </p>
                        </div>

                        {loadingRegistry ? (
                            <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>⏳</div>
                                <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>Loading Registry...</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    Fetching all registered tokens from blockchain
                                </p>
                            </div>
                        ) : publicTokenAddresses.length === 0 ? (
                            <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                                <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🚀</div>
                                <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Public Streams Yet</h3>
                                <p style={{ color: 'var(--color-text-secondary)' }}>
                                    Public streams will appear here once they are minted via the Admin Dashboard
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-xl">
                                {publicStreams.map((stream, index) => (
                                    <AssetCard key={`public-${index}`} asset={stream} />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
