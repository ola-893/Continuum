import React, { useState, useEffect } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Car, Home, Wrench, Clock, DollarSign, Zap, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ContinuumService } from '../services/continuumService';
import { CONTRACT_CONFIG } from '../config/contracts';

interface RentalAsset {
    tokenAddress: string;
    assetType: number;
    metadata_uri: string;
    streamId: number;
    title: string;
    description: string;
    imageUrl: string;
    pricePerHour: number;
}

export const Rentals: React.FC = () => {
    const { signAndSubmitTransaction, account } = useWallet();
    const [assets, setAssets] = useState<RentalAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | number>('all');
    const [selectedAsset, setSelectedAsset] = useState<RentalAsset | null>(null);
    const [rentalDuration, setRentalDuration] = useState<number>(1); // hours
    const [showRentalModal, setShowRentalModal] = useState(false);
    const [txStatus, setTxStatus] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        loadAvailableAssets();
    }, []);

    const loadAvailableAssets = async () => {
        try {
            setLoading(true);
            // Fetch all registered tokens from blockchain
            const allTokens = await ContinuumService.getAllRegisteredTokens();

            console.log('Loaded tokens from registry:', allTokens);

            // Convert to rental asset format with real data
            const rentalAssets: RentalAsset[] = await Promise.all(
                allTokens.map(async (token: any) => {
                    const tokenAddress = token.token_address || token.tokenAddress;
                    const assetType = Number(token.asset_type || token.assetType || 0);
                    const streamId = Number(token.stream_id || token.streamId || 0);
                    const metadataUri = token.metadata_uri || '';

                    // Fetch NFT metadata (name and description) directly from blockchain
                    let assetName = `Asset #${tokenAddress.slice(-4)}`;
                    let assetDescription = ''; // Empty by default - only show if NFT has description

                    try {
                        const nftMetadata = await ContinuumService.getNFTMetadata(tokenAddress);
                        assetName = nftMetadata.name || assetName;
                        assetDescription = nftMetadata.description || ''; // Show nothing if no description
                        console.log(`Fetched NFT metadata from blockchain for ${tokenAddress}:`, nftMetadata);
                    } catch (error) {
                        console.warn(`Could not fetch NFT metadata from blockchain for ${tokenAddress}, using fallback`);
                        assetName = getAssetTitle(assetType, tokenAddress);
                    }

                    // Fetch stream info to get yield data
                    let pricePerHour = getDefaultPricePerHour(assetType);
                    try {
                        if (streamId > 0) {
                            const streamInfo = await ContinuumService.getStreamInfo(streamId);
                            if (streamInfo && streamInfo.flowRate) {
                                // Convert flow rate (APT per second) to APT per hour
                                // flowRate is in octas per second, convert to APT per hour
                                pricePerHour = (Number(streamInfo.flowRate) / 100_000_000) * 3600;
                            }
                        }
                    } catch (error) {
                        console.warn(`Could not fetch stream info for stream ${streamId}, using default price`);
                    }

                    return {
                        tokenAddress,
                        assetType,
                        metadata_uri: metadataUri,
                        streamId,
                        title: assetName,
                        description: assetDescription,
                        imageUrl: getAssetImage(assetType),
                        pricePerHour: Math.max(pricePerHour, 0.01), // Minimum price
                    };
                })
            );

            console.log('Processed rental assets:', rentalAssets);
            setAssets(rentalAssets);
        } catch (error) {
            console.error('Error loading rental assets:', error);
            setAssets([]); // Empty array on error
        } finally {
            setLoading(false);
        }
    };

    const getAssetTitle = (assetType: number, address: string): string => {
        const suffix = address.slice(-4);
        switch (assetType) {
            case 1: return `Vehicle #${suffix}`;
            case 0: return `Real Estate #${suffix}`;
            case 2: return `Equipment #${suffix}`;
            default: return `Asset #${suffix}`;
        }
    };

    const getAssetImage = (assetType: number): string => {
        switch (assetType) {
            case 1: return 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800'; // Modern car
            case 0: return 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800'; // Modern building/property
            case 2: return 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=800'; // Industrial equipment
            default: return 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800'; // Generic business/asset
        }
    };

    const getDefaultPricePerHour = (assetType: number): number => {
        switch (assetType) {
            case 1: return 25; // $25/hour for cars
            case 0: return 5; // $5/hour for apartments (~$3600/month)
            case 2: return 50; // $50/hour for heavy equipment
            default: return 10;
        }
    };

    const getAssetIcon = (assetType: number) => {
        switch (assetType) {
            case 1: return Car;
            case 0: return Home;
            case 2: return Wrench;
            default: return Zap;
        }
    };

    const handleStartRental = (asset: RentalAsset) => {
        setSelectedAsset(asset);
        setShowRentalModal(true);
    };

    const confirmRental = async () => {
        if (!selectedAsset || !account) return;

        try {
            setIsProcessing(true);
            setTxStatus('Preparing transaction...');

            // Calculate total payment based on duration
            // Use Math.floor to ensure we have a whole number (no decimals)
            const totalPayment = Math.floor(selectedAsset.pricePerHour * rentalDuration * 100_000_000); // Convert to octas
            const durationInSeconds = rentalDuration * 3600;

            setTxStatus('Please approve transaction in your wallet...');

            const transaction = ContinuumService.streamRentToAsset(
                selectedAsset.tokenAddress,
                totalPayment,
                durationInSeconds
            );

            await signAndSubmitTransaction(transaction);

            setTxStatus('Transaction confirmed! Rental stream is now active.');
            setTimeout(() => {
                setShowRentalModal(false);
                setTxStatus('');
                setIsProcessing(false);
            }, 3000);
        } catch (error: any) {
            console.error('Rental failed:', error);
            setTxStatus(`Transaction failed: ${error?.message || 'Please try again'}`);
            setIsProcessing(false);
        }
    };

    const filteredAssets = filter === 'all'
        ? assets
        : assets.filter(a => a.assetType === filter);

    return (
        <div style={{ padding: 'var(--spacing-2xl)', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <Zap size={32} style={{ color: 'var(--color-primary)' }} />
                    <h1 style={{ margin: 0 }}>Rent Real World Assets</h1>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-lg)', marginBottom: 'var(--spacing-md)' }}>
                    Pay-as-you-go physical access. Stream money to use cars, apartments, equipment in real life.
                </p>
                <div
                    className="card"
                    style={{
                        padding: 'var(--spacing-md)',
                        background: 'rgba(0, 217, 255, 0.05)',
                        border: '1px solid rgba(0, 217, 255, 0.2)',
                    }}
                >
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', gap: 'var(--spacing-xs)', alignItems: 'start' }}>
                        <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                        <span><strong>How it works:</strong> Asset owner keeps the NFT & financial rights (yield, flash loans).
                            You stream payment to unlock <strong>physical access</strong> to the real-world asset.
                            Cancel anytime, get refunded instantly!</span>
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
                <button
                    onClick={() => setFilter('all')}
                    className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: 'var(--spacing-sm) var(--spacing-lg)' }}
                >
                    All Assets
                </button>
                <button
                    onClick={() => setFilter(CONTRACT_CONFIG.ASSET_TYPES.CAR)}
                    className={filter === CONTRACT_CONFIG.ASSET_TYPES.CAR ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: 'var(--spacing-sm) var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                >
                    <Car size={16} /> Vehicles
                </button>
                <button
                    onClick={() => setFilter(CONTRACT_CONFIG.ASSET_TYPES.REAL_ESTATE)}
                    className={filter === CONTRACT_CONFIG.ASSET_TYPES.REAL_ESTATE ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: 'var(--spacing-sm) var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                >
                    <Home size={16} /> Real Estate
                </button>
                <button
                    onClick={() => setFilter(CONTRACT_CONFIG.ASSET_TYPES.COMMODITIES)}
                    className={filter === CONTRACT_CONFIG.ASSET_TYPES.COMMODITIES ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: 'var(--spacing-sm) var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                >
                    <Wrench size={16} /> Equipment
                </button>
            </div>

            {/* Asset Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl)' }}>
                    <p>Loading available assets...</p>
                </div>
            ) : filteredAssets.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-4xl)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        No assets available for rental in this category.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-lg">
                    {filteredAssets.map((asset) => {
                        const Icon = getAssetIcon(asset.assetType);
                        return (
                            <div key={asset.tokenAddress} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                {/* Image */}
                                <div
                                    style={{
                                        height: '200px',
                                        background: `url(${asset.imageUrl}) center/cover`,
                                        position: 'relative',
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        top: 'var(--spacing-sm)',
                                        right: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        borderRadius: 'var(--border-radius-sm)',
                                        backdropFilter: 'blur(4px)',
                                    }}>
                                        <Icon size={16} style={{ display: 'inline', marginRight: '4px' }} />
                                        <span style={{ fontSize: '12px', fontWeight: 500 }}>
                                            ${asset.pricePerHour}/hr
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div style={{ padding: 'var(--spacing-lg)' }}>
                                    <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>{asset.title}</h3>
                                    <p style={{
                                        fontSize: 'var(--font-size-sm)',
                                        color: 'var(--color-text-secondary)',
                                        marginBottom: 'var(--spacing-md)',
                                    }}>
                                        {asset.description}
                                    </p>

                                    <div style={{
                                        display: 'flex',
                                        gap: 'var(--spacing-md)',
                                        marginBottom: 'var(--spacing-md)',
                                        fontSize: 'var(--font-size-sm)',
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                            <Clock size={14} />
                                            <span>Per-second billing</span>
                                        </div>
                                    </div>

                                    <Button
                                        variant="primary"
                                        onClick={() => handleStartRental(asset)}
                                        style={{ width: '100%' }}
                                    >
                                        Start Rental
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Rental Modal */}
            {showRentalModal && selectedAsset && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowRentalModal(false)}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: '500px',
                            width: '90%',
                            padding: 'var(--spacing-2xl)',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Start Rental</h2>
                        <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-primary)' }}>
                            {selectedAsset.title}
                        </h3>

                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500 }}>
                                Rental Duration (hours)
                            </label>
                            <input
                                type="number"
                                className="input"
                                value={rentalDuration}
                                onChange={(e) => setRentalDuration(Number(e.target.value))}
                                min="1"
                                max="720"
                                style={{ width: '100%' }}
                            />
                        </div>

                        <div
                            className="card"
                            style={{
                                padding: 'var(--spacing-md)',
                                background: 'rgba(0, 217, 255, 0.1)',
                                marginBottom: 'var(--spacing-lg)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                <span>Price per hour:</span>
                                <span style={{ fontWeight: 600 }}>${selectedAsset.pricePerHour} APT</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                <span>Duration:</span>
                                <span style={{ fontWeight: 600 }}>{rentalDuration} hours</span>
                            </div>
                            <hr style={{ margin: 'var(--spacing-sm) 0', opacity: 0.2 }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Total Budget:</span>
                                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>
                                    ${(selectedAsset.pricePerHour * rentalDuration).toFixed(2)} APT
                                </span>
                            </div>
                        </div>

                        {txStatus && (
                            <div
                                className="card"
                                style={{
                                    marginBottom: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-md)',
                                    background: txStatus.includes('Success:') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                }}
                            >
                                {txStatus}
                            </div>
                        )}

                        <p style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-secondary)',
                            marginBottom: 'var(--spacing-lg)',
                            display: 'flex',
                            gap: 'var(--spacing-xs)',
                            alignItems: 'start',
                        }}>
                            <Info size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                            <span><strong>You rent physical access, not the NFT.</strong> Owner keeps NFT ownership & financial rights (yield, flash loans).
                                Your payment streams per-second for real-world usage. Cancel anytime and get refunded for unused time!</span>
                        </p>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <Button
                                variant="secondary"
                                onClick={() => setShowRentalModal(false)}
                                style={{ flex: 1 }}
                                disabled={isProcessing}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={confirmRental}
                                style={{ flex: 1 }}
                                disabled={!account || isProcessing}
                                isLoading={isProcessing}
                            >
                                <DollarSign size={16} />
                                {isProcessing ? 'Processing...' : 'Confirm & Start Stream'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
