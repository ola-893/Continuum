import React, { useState, useEffect } from 'react';
import { AssetCard } from '../components/ui/AssetCard';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { useAssetList } from '../hooks/useAssetList';
import { ContinuumService } from '../services/continuumService';

export const Marketplace: React.FC = () => {
    const [publicTokenAddresses, setPublicTokenAddresses] = useState<string[]>([]);
    const [loadingRegistry, setLoadingRegistry] = useState(true);

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

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            {loadingRegistry ? (
                <LoadingScreen message="Loading marketplace from blockchain..." />
            ) : publicTokenAddresses.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>🏪</div>
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Assets Listed Yet</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Minted RWAs will appear here once registered
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-xl">
                    {publicStreams.map((stream, index) => (
                        <AssetCard key={`marketplace-${index}`} asset={stream} />
                    ))}
                </div>
            )}
        </div>
    );
};
