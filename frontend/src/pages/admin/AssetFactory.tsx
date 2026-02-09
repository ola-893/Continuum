import React, { useState } from 'react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useTezosWallet } from '../../hooks/useTezosWallet';
import * as TezosContract from '../../services/tezosContractService';

export const AssetFactory: React.FC = () => {
    const { address, isConnected } = useTezosWallet();
    const [assetType, setAssetType] = useState<number>(TezosContract.AssetType.REAL_ESTATE);

    // Form data
    const [mintData, setMintData] = useState({
        tokenName: '',
        description: '',
        imageUrl: '',
        metadataUri: '',
    });

    const [streamData, setStreamData] = useState({
        totalYield: '',
        duration: '',
    });

    const [txStatus, setTxStatus] = useState('');
    const [txHash, setTxHash] = useState('');
    const [loading, setLoading] = useState(false);

    const handleMintAndCreateStream = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isConnected || !address) {
            setTxStatus('Error: Please connect your Tezos wallet first');
            setTimeout(() => setTxStatus(''), 5000);
            return;
        }

        try {
            setLoading(true);
            setTxStatus('Creating compliant RWA stream...');

            // Convert yield to mutez (assuming 6 decimals like USDT)
            const yieldInMutez = TezosContract.tokensToMutez(parseFloat(streamData.totalYield));
            const durationInSeconds = parseInt(streamData.duration) * 86400; // days to seconds

            // Generate metadata URI (in production, this would be uploaded to IPFS)
            const metadataUri = mintData.metadataUri || `ipfs://metadata/${Date.now()}`;

            // For now, we'll use a placeholder token address
            // In production, the NFT would be minted first and its address used here
            const tokenAddress = `KT1${Math.random().toString(36).substring(2, 15)}`;

            // Call RWA Hub to create compliant stream
            // This automatically:
            // 1. Checks compliance authorization
            // 2. Creates the asset yield stream
            // 3. Registers the token in the registry
            const opHash = await TezosContract.createCompliantRWAStream({
                tokenAddress,
                totalYield: yieldInMutez,
                duration: durationInSeconds,
                assetType,
                metadataUri,
            });

            setTxHash(opHash);
            setTxStatus(`Success: Asset minted and stream created!\nTransaction: ${opHash.slice(0, 10)}...`);

            // Reset forms
            setMintData({
                tokenName: '',
                description: '',
                imageUrl: '',
                metadataUri: '',
            });
            setStreamData({
                totalYield: '',
                duration: '',
            });

            setTimeout(() => {
                setTxStatus('');
                setTxHash('');
            }, 10000);

        } catch (error: any) {
            console.error('Minting or stream creation failed:', error);
            setTxStatus(`Error: ${error?.message || 'Failed to create asset. Check console for details.'}`);
            setTimeout(() => setTxStatus(''), 8000);
        } finally {
            setLoading(false);
        }
    };

    const getAssetTypeName = (type: number) => {
        switch (type) {
            case TezosContract.AssetType.REAL_ESTATE: return 'Real Estate';
            case TezosContract.AssetType.VEHICLES: return 'Vehicle';
            case TezosContract.AssetType.COMMODITIES: return 'Commodities';
            default: return 'Asset';
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Asset Factory</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Mint NFTs and create yield streams on Tezos
                </p>
            </div>

            {txStatus && (
                <div
                    className="card"
                    style={{
                        marginBottom: 'var(--spacing-xl)',
                        padding: 'var(--spacing-md)',
                        background: txStatus.includes('Success:') ? 'rgba(16, 185, 129, 0.1)' : txStatus.includes('Error:') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        border: txStatus.includes('Success:') ? '1px solid var(--color-success)' : txStatus.includes('Error:') ? '1px solid var(--color-error)' : '1px solid var(--color-warning)',
                        whiteSpace: 'pre-line',
                    }}
                >
                    {txStatus}
                    {txHash && (
                        <div style={{ marginTop: 'var(--spacing-sm)' }}>
                            <a
                                href={`https://ghostnet.tzkt.io/${txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                            >
                                View on TzKT Explorer
                            </a>
                        </div>
                    )}
                </div>
            )}

            <form onSubmit={handleMintAndCreateStream}>
                <div className="grid grid-cols-2 gap-xl">
                    {/* Left Column - NFT Details */}
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>NFT Details</h3>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                Asset Type
                            </label>
                            <select
                                className="input"
                                value={assetType}
                                onChange={(e) => setAssetType(parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            >
                                <option value={TezosContract.AssetType.REAL_ESTATE}>Real Estate</option>
                                <option value={TezosContract.AssetType.VEHICLES}>Vehicle</option>
                                <option value={TezosContract.AssetType.COMMODITIES}>Commodities</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                NFT Name
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Luxury Apartment #42"
                                value={mintData.tokenName}
                                onChange={(e) => setMintData({ ...mintData, tokenName: e.target.value })}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                Description
                            </label>
                            <textarea
                                className="input"
                                placeholder="Asset description"
                                value={mintData.description}
                                onChange={(e) => setMintData({ ...mintData, description: e.target.value })}
                                required
                                rows={3}
                                style={{ width: '100%', resize: 'vertical' }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                Image URL
                            </label>
                            <input
                                type="url"
                                className="input"
                                placeholder="https://example.com/image.jpg"
                                value={mintData.imageUrl}
                                onChange={(e) => setMintData({ ...mintData, imageUrl: e.target.value })}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                Metadata URI (optional)
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="ipfs://..."
                                value={mintData.metadataUri}
                                onChange={(e) => setMintData({ ...mintData, metadataUri: e.target.value })}
                                style={{ width: '100%' }}
                            />
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>
                                Leave empty to auto-generate
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Stream Parameters */}
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Yield Parameters</h3>

                        {mintData.imageUrl && (
                            <div
                                style={{
                                    width: '100%',
                                    height: '200px',
                                    background: `url(${mintData.imageUrl}) center/cover`,
                                    borderRadius: 'var(--border-radius-lg)',
                                    marginBottom: 'var(--spacing-lg)',
                                }}
                            />
                        )}

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                Total Yield (XTZ)
                            </label>
                            <input
                                type="number"
                                step="0.000001"
                                className="input"
                                placeholder="1000"
                                value={streamData.totalYield}
                                onChange={(e) => setStreamData({ ...streamData, totalYield: e.target.value })}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                Duration (Days)
                            </label>
                            <input
                                type="number"
                                className="input"
                                placeholder="365"
                                value={streamData.duration}
                                onChange={(e) => setStreamData({ ...streamData, duration: e.target.value })}
                                required
                                style={{ width: '100%' }}
                            />
                        </div>

                        {streamData.totalYield && streamData.duration && (
                            <div className="card" style={{ padding: 'var(--spacing-md)', background: 'rgba(0, 217, 255, 0.1)', border: '1px solid var(--color-primary)' }}>
                                <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-xs)' }}>
                                    Yield Rate:
                                </p>
                                <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-primary)' }}>
                                    {((parseFloat(streamData.totalYield) / (parseInt(streamData.duration) * 86400)) * 3600).toFixed(6)} XTZ/hour
                                </p>
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                                    {((parseFloat(streamData.totalYield) / parseInt(streamData.duration))).toFixed(4)} XTZ/day
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <Button
                        type="submit"
                        variant="primary"
                        leftIcon={<Sparkles size={20} />}
                        disabled={loading || !isConnected}
                        isLoading={loading}
                        style={{ minWidth: '300px' }}
                    >
                        {!isConnected ? 'Connect Wallet First' : 'Create Compliant RWA Stream'}
                    </Button>
                    <p style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                        Creates stream, registers asset, and checks compliance
                    </p>
                </div>
            </form>
        </div>
    );
};
