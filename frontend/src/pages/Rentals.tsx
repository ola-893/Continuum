import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { Car, Home, Wrench, Clock, DollarSign, Zap, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ContinuumService } from '../services/continuumService';
import { CONTRACT_CONFIG } from '../config/contracts';
import { ethers } from 'ethers';

interface RentalAsset {
    tokenAddress: string;
    tokenId: number;
    assetType: string;
    metadata_uri: string;
    streamId: number;
    title: string;
    description: string;
    imageUrl: string;
    pricePerHour: number;
}

export const Rentals: React.FC = () => {
    const { address, isConnected } = useAccount();
    const [assets, setAssets] = useState<RentalAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | string>('all');
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
            const allTokenIds = await ContinuumService.getAllTokenIds();

            const rentalAssets: RentalAsset[] = [];

            for (const tokenId of allTokenIds) {
                try {
                    const tokenDetails = await ContinuumService.getTokenDetails(tokenId);
                    const streamId = Number(tokenDetails.stream_id);

                    // Fetch stream info to determine price/availability
                    let pricePerHour = 10; // Default fallback
                    if (streamId > 0) {
                        try {
                            const streamInfo = await ContinuumService.getStreamInfo(streamId);
                            // Convert flowRate (wei/sec) to BUSD/hour
                            const flowRatePerSec = Number(ethers.formatUnits(streamInfo.flowRate, 18));
                            pricePerHour = flowRatePerSec * 3600;
                        } catch (e) {
                            console.warn("Could not fetch stream info", e);
                        }
                    }

                    rentalAssets.push({
                        tokenAddress: CONTRACT_CONFIG.TOKEN_REGISTRY_ADDRESS,
                        tokenId: tokenId,
                        assetType: 'Real Estate', // Defaulting to Real Estate for now
                        metadata_uri: tokenDetails.metadata_uri,
                        streamId,
                        title: `Asset #${tokenId}`,
                        description: `A rentable property registered on the blockchain. Token ID: ${tokenId}`,
                        imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80', // Placeholder
                        pricePerHour: Math.max(pricePerHour, 1),
                    });

                } catch (e) {
                    console.error(`Error processing token ${tokenId}`, e);
                }
            }

            setAssets(rentalAssets);
        } catch (error) {
            console.error('Error loading rental assets:', error);
            setAssets([]);
        } finally {
            setLoading(false);
        }
    };

    const getAssetIcon = (assetType: string) => {
        switch (assetType.toLowerCase()) {
            case 'vehicle': return Car;
            case 'real estate': return Home;
            case 'equipment': return Wrench;
            default: return Zap;
        }
    };

    const handleStartRental = (asset: RentalAsset) => {
        setSelectedAsset(asset);
        setShowRentalModal(true);
    };

    const confirmRental = async () => {
        if (!selectedAsset || !address) return;

        try {
            setIsProcessing(true);
            setTxStatus('Preparing transaction...');

            // Calculate total payment
            // Duration in seconds
            const durationInSeconds = rentalDuration * 3600;
            // Total cost = pricePerHour * hours
            const totalCost = selectedAsset.pricePerHour * rentalDuration;

            // Convert to BigInt for contract calls (assuming 18 decimals for matching token)
            const totalAmountWei = ethers.parseUnits(totalCost.toString(), 18);

            setTxStatus('Please approve transaction in your wallet...');

            const assetOwner = await ContinuumService.getTokenOwner(selectedAsset.tokenId);

            const tx = await ContinuumService.createStream(
                address,
                assetOwner,
                totalAmountWei,
                durationInSeconds
            );

            await tx.wait();

            setTxStatus('Transaction confirmed! Rental stream is now active.');
            setTimeout(() => {
                setShowRentalModal(false);
                setTxStatus('');
                setIsProcessing(false);
                // Refresh assets or user state if needed
            }, 3000);
        } catch (error: any) {
            console.error('Rental failed:', error);
            setTxStatus(`Transaction failed: ${error?.message || 'Please try again'}`);
            setIsProcessing(false);
        }
    };

    const filteredAssets = filter === 'all'
        ? assets
        : assets.filter(a => a.assetType.toLowerCase() === filter.toLowerCase());

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
                    onClick={() => setFilter('vehicle')}
                    className={filter === 'vehicle' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: 'var(--spacing-sm) var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                >
                    <Car size={16} /> Vehicles
                </button>
                <button
                    onClick={() => setFilter('real estate')}
                    className={filter === 'real estate' ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: 'var(--spacing-sm) var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}
                >
                    <Home size={16} /> Real Estate
                </button>
                <button
                    onClick={() => setFilter('equipment')}
                    className={filter === 'equipment' ? 'btn-primary' : 'btn-secondary'}
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
                            <div key={asset.tokenAddress + asset.tokenId} className="card" style={{ padding: 0, overflow: 'hidden' }}>
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
                                            ${asset.pricePerHour.toFixed(2)}/hr
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
                                <span style={{ fontWeight: 600 }}>${selectedAsset.pricePerHour.toFixed(2)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-sm)' }}>
                                <span>Duration:</span>
                                <span style={{ fontWeight: 600 }}>{rentalDuration} hours</span>
                            </div>
                            <hr style={{ margin: 'var(--spacing-sm) 0', opacity: 0.2 }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>Total Budget:</span>
                                <span style={{ fontWeight: 600, fontSize: 'var(--font-size-lg)', color: 'var(--color-primary)' }}>
                                    ${(selectedAsset.pricePerHour * rentalDuration).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Safety Controls */}
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 500, fontSize: '12px' }}>
                                SAFETY CONTROLS
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>Max Spend Cap ($)</label>
                                    <input type="number" className="input" placeholder="No Limit" style={{ fontSize: '14px', padding: 'var(--spacing-xs) var(--spacing-sm)' }} />
                                </div>
                                <div style={{
                                    padding: 'var(--spacing-xs) var(--spacing-sm)',
                                    border: '1px solid #10b981',
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    color: '#10b981',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <span>🛡️ Verified by ChainGPT</span>
                                </div>
                            </div>
                        </div>

                        {txStatus && (
                            <div
                                className="card"
                                style={{
                                    marginBottom: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-md)',
                                    background: txStatus.includes('confirmed') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
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
                                disabled={!isConnected || isProcessing}
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

export default Rentals;
