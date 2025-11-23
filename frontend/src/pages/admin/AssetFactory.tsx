import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Sparkles, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { NFTMintingService } from '../../services/nftMintingService';
import { aptosClient } from '../../services/aptosClient';
import { useContinuum } from '../../hooks/useContinuum';
import { CONTRACT_CONFIG } from '../../config/contracts';

export const AssetFactory: React.FC = () => {
    const { createYieldStream, loading } = useContinuum();
    const { signAndSubmitTransaction, account } = useWallet();
    const [assetType, setAssetType] = useState<number>(CONTRACT_CONFIG.ASSET_TYPES.REAL_ESTATE);

    // Form data
    const [mintData, setMintData] = useState({
        collectionName: 'YieldStream RWA',
        tokenName: '',
        description: '',
        imageUrl: '',
    });

    const [streamData, setStreamData] = useState({
        totalYield: '',
        duration: '',
    });

    const [txStatus, setTxStatus] = useState('');
    const [collectionExists, setCollectionExists] = useState(false);
    const [checkingCollection, setCheckingCollection] = useState(true);
    const [currentStep, setCurrentStep] = useState<number>(0); // 0 = idle, 1 = minting, 2 = creating stream

    // Check if collection exists on mount
    useEffect(() => {
        const checkCollection = async () => {
            if (!account?.address) {
                setCheckingCollection(false);
                return;
            }

            try {
                setCheckingCollection(true);

                // Query all collections owned by this account
                const collections = await aptosClient.getAccountCollectionsWithOwnedTokens({
                    accountAddress: account.address,
                });

                // Check if "YieldStream RWA" collection exists
                const exists = collections.some(
                    (col: any) => col.collection_name === mintData.collectionName
                );

                setCollectionExists(exists);
                console.log(`Collection "${mintData.collectionName}" exists:`, exists);
            } catch (error) {
                console.error('Error checking collection:', error);
                setCollectionExists(false);
            } finally {
                setCheckingCollection(false);
            }
        };

        checkCollection();
    }, [account?.address, mintData.collectionName]);

    const handleCreateCollection = async () => {
        try {
            setTxStatus('Creating collection "YieldStream RWA"...');
            const transaction = NFTMintingService.createCollection(
                mintData.collectionName,
                'Real World Assets tokenized on Aptos',
                'https://yieldstream.example.com/collection.json',
                10000
            );
            await signAndSubmitTransaction(transaction);
            setTxStatus('Success: Collection created!');
            setCollectionExists(true);
            setTimeout(() => setTxStatus(''), 3000);
        } catch (error) {
            console.error('Collection creation failed:', error);
            setTxStatus('Error: Failed to create collection');
            setTimeout(() => setTxStatus(''), 5000);
        }
    };

    const handleMintAndCreateStream = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // STEP 1: Mint NFT
            setCurrentStep(1);
            setTxStatus('Step 1/2: Minting NFT...');

            const tokenUri = NFTMintingService.generateTokenMetadata(
                mintData.tokenName,
                mintData.description,
                mintData.imageUrl,
                [
                    { trait_type: 'Asset Type', value: getAssetTypeName(assetType) },
                    { trait_type: 'Platform', value: 'YieldStream' },
                ]
            );

            const mintTransaction = NFTMintingService.mintNFT(
                mintData.collectionName,
                mintData.tokenName,
                mintData.description,
                tokenUri
            );

            const mintResult = await signAndSubmitTransaction(mintTransaction);
            console.log('Mint transaction result:', mintResult);

            // Get the transaction hash
            const txHash = (mintResult as any).hash;
            if (!txHash) {
                throw new Error('No transaction hash returned from mint transaction');
            }

            setTxStatus(`Step 1/2: NFT minted! Fetching token address...`);

            // Extract the token address by fetching full transaction details
            const tokenAddress = await NFTMintingService.extractTokenAddress(aptosClient, txHash);

            if (!tokenAddress) {
                throw new Error('Failed to extract token address from mint transaction. Check console for details.');
            }

            setTxStatus(`Success: Step 1/2 Complete!\nNFT Address: ${tokenAddress.slice(0, 10)}...`);

            // Small delay for user to see step 1 completion
            await new Promise(resolve => setTimeout(resolve, 1000));

            // STEP 2: Create yield stream
            setCurrentStep(2);
            setTxStatus('Step 2/2: Creating yield stream & registering...');

            // NOTE: This calls rwa_hub::create_real_estate_stream which automatically:
            // 1. Creates the stream via streaming_protocol
            // 2. Registers the asset in asset_yield_protocol
            // 3. Registers the token in token_registry (auto-handled by Hub)
            const yieldInOctas = Math.floor(parseFloat(streamData.totalYield) * 100_000_000);
            const durationInSeconds = parseInt(streamData.duration) * 86400;

            await createYieldStream(tokenAddress, yieldInOctas, durationInSeconds);

            setCurrentStep(0);
            setTxStatus('Success: Success! NFT minted, stream created, and auto-registered in global registry!');

            // Reset forms
            setMintData({
                collectionName: 'YieldStream RWA',
                tokenName: '',
                description: '',
                imageUrl: '',
            });
            setStreamData({
                totalYield: '',
                duration: '',
            });

            setTimeout(() => setTxStatus(''), 5000);

        } catch (error: any) {
            console.error('Minting or stream creation failed:', error);
            setCurrentStep(0);
            setTxStatus(`Error: Failed: ${error?.message || 'Check console for details'}`);
            setTimeout(() => setTxStatus(''), 8000);
        }
    };

    const getAssetTypeName = (type: number) => {
        switch (type) {
            case CONTRACT_CONFIG.ASSET_TYPES.CAR: return 'Vehicle';
            case CONTRACT_CONFIG.ASSET_TYPES.REAL_ESTATE: return 'Real Estate';
            case CONTRACT_CONFIG.ASSET_TYPES.COMMODITIES: return 'Heavy Machinery';
            default: return 'Asset';
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Asset Factory</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Mint NFTs and create yield streams
                </p>
            </div>

            {txStatus && (
                <div
                    className="card"
                    style={{
                        marginBottom: 'var(--spacing-xl)',
                        padding: 'var(--spacing-md)',
                        background: txStatus.includes('Success:') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                        border: txStatus.includes('Success:') ? '1px solid var(--color-success)' : '1px solid var(--color-warning)',
                        whiteSpace: 'pre-line',
                    }}
                >
                    {txStatus}
                </div>
            )}

            <form onSubmit={handleMintAndCreateStream}>
                <div className="grid grid-cols-2 gap-xl">
                    {/* Left Column - NFT Details */}
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>NFT Details</h3>

                        {checkingCollection ? (
                            <LoadingScreen
                                message="Checking collection status..."
                                size="sm"
                            />
                        ) : !collectionExists ? (
                            <div
                                className="card"
                                style={{
                                    marginBottom: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-md)',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid var(--color-warning)',
                                }}
                            >
                                <p style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-warning)' }}>
                                    Collection "YieldStream RWA" not found
                                </p>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={handleCreateCollection}
                                    disabled={loading}
                                >
                                    Create Collection First
                                </Button>
                            </div>
                        ) : (
                            <div
                                className="card"
                                style={{
                                    marginBottom: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-md)',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid var(--color-success)',
                                }}
                            >
                                <p style={{ color: 'var(--color-success)' }}>
                                    <CheckCircle size={16} style={{ display: 'inline', marginRight: '4px', color: 'var(--color-success)' }} />
                                    Collection "YieldStream RWA" is ready!
                                </p>
                            </div>
                        )}

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
                                <option value={CONTRACT_CONFIG.ASSET_TYPES.CAR}>Vehicle</option>
                                <option value={CONTRACT_CONFIG.ASSET_TYPES.REAL_ESTATE}>Real Estate</option>
                                <option value={CONTRACT_CONFIG.ASSET_TYPES.COMMODITIES}>Heavy Machinery</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-xs)', fontWeight: 500 }}>
                                NFT Name
                            </label>
                            <input
                                type="text"
                                className="input"
                                placeholder="e.g., Tesla Model 3 Fleet #42"
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
                                Total Yield (APT)
                            </label>
                            <input
                                type="number"
                                step="0.00000001"
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
                                    ${((parseFloat(streamData.totalYield) / (parseInt(streamData.duration) * 86400)) * 3600).toFixed(4)} / hour
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    {currentStep > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                            {/* Step Progress Indicator */}
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                {/* Step 1 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    borderRadius: 'var(--border-radius-md)',
                                    background: currentStep === 1 ? 'rgba(0, 217, 255, 0.2)' : currentStep > 1 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    border: `2px solid ${currentStep === 1 ? 'var(--color-primary)' : currentStep > 1 ? 'var(--color-success)' : 'transparent'}`,
                                    transition: 'all 0.3s ease',
                                }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: currentStep === 1 ? 'var(--color-primary)' : currentStep > 1 ? 'var(--color-success)' : 'rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                    }}>
                                        {currentStep > 1 ? '' : '1'}
                                    </div>
                                    <span style={{ fontWeight: 500, fontSize: '14px' }}>Minting NFT</span>
                                </div>

                                {/* Connector */}
                                <div style={{
                                    width: '40px',
                                    height: '2px',
                                    background: currentStep > 1 ? 'var(--color-success)' : 'rgba(255, 255, 255, 0.1)',
                                    transition: 'all 0.3s ease',
                                }} />

                                {/* Step 2 */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-sm)',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    borderRadius: 'var(--border-radius-md)',
                                    background: currentStep === 2 ? 'rgba(0, 217, 255, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                                    border: `2px solid ${currentStep === 2 ? 'var(--color-primary)' : 'transparent'}`,
                                    transition: 'all 0.3s ease',
                                }}>
                                    <div style={{
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '50%',
                                        background: currentStep === 2 ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: 'bold',
                                        fontSize: '12px',
                                    }}>
                                        2
                                    </div>
                                    <span style={{ fontWeight: 500, fontSize: '14px' }}>Creating Stream</span>
                                </div>
                            </div>

                            {/* Loading indicator */}
                            <div style={{
                                width: '100%',
                                maxWidth: '300px',
                                height: '4px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '2px',
                                overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: currentStep === 1 ? '50%' : '100%',
                                    background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                                    transition: 'width 0.5s ease',
                                    animation: 'pulse 1.5s ease-in-out infinite',
                                }} />
                            </div>

                            <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                {currentStep === 1 ? 'Please confirm the transaction in your wallet...' : 'Registering in global marketplace...'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <Button
                                type="submit"
                                variant="primary"
                                leftIcon={<Sparkles size={20} />}
                                disabled={loading || !collectionExists}
                                isLoading={loading}
                                style={{ minWidth: '300px' }}
                            >
                                Mint NFT & Create Stream
                            </Button>
                            <p style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                                Step 1: Mint NFT → Step 2: Create yield stream
                            </p>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};
