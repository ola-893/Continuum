import React, { useState, useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { Car, Home, Wrench, Clock, XCircle, Zap, AlertTriangle, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { ContinuumService } from '../services/continuumService';
import { LoadingScreen } from '../components/ui/LoadingScreen';
import { fetchIpfsMetadata } from '../utils/ipfs'; 
import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../config/contracts';
import { ActiveRental } from '../types/continuum';

export const MyRentals: React.FC = () => {
    const { address, isConnected } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [rentals, setRentals] = useState<ActiveRental[]>([]);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const getAssetTypeName = (assetType: number): 'Real Estate' | 'Vehicle' | 'Heavy Machinery' | 'Unknown Asset' => {
        switch (assetType) {
            case 0: return 'Real Estate';
            case 1: return 'Vehicle';
            case 2: return 'Heavy Machinery';
            default: return 'Unknown Asset';
        }
    };

    const getAssetIcon = (assetType: string) => {
        const iconSize = 24;
        switch (assetType) {
            case 'Vehicle': return <Car size={iconSize} />;
            case 'Real Estate': return <Home size={iconSize} />;
            case 'Heavy Machinery': return <Wrench size={iconSize} />;
            default: return <Car size={iconSize} />;
        }
    };

    useEffect(() => {
        const loadMyRentals = async () => {
            if (!isConnected || !address) {
                setRentals([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);
            try {
                const allTokenIds = await ContinuumService.getAllTokenIds();
                const activeRentals: ActiveRental[] = [];

                for (const tokenId of allTokenIds) {
                    try {
                        const tokenDetails = await ContinuumService.getTokenDetails(tokenId);
                        const streamId = Number(tokenDetails.stream_id);

                        if (streamId > 0) {
                            const streamInfo = await ContinuumService.getStreamInfo(streamId);

                            if (streamInfo && streamInfo.sender.toLowerCase() === address.toLowerCase() && streamInfo.isActive) {
                                let assetMetadata: any = {};
                                if (tokenDetails.metadata_uri) {
                                    assetMetadata = await fetchIpfsMetadata(tokenDetails.metadata_uri);
                                }

                                const flowRateDisplay = Number(ethers.formatUnits(streamInfo.flowRate, 18));
                                const totalAmountDisplay = Number(ethers.formatUnits(streamInfo.totalAmount, 18));
                                const amountWithdrawnDisplay = Number(ethers.formatUnits(streamInfo.amountWithdrawn, 18));

                                const durationSeconds = Number(streamInfo.stopTime) - Number(streamInfo.startTime);

                                activeRentals.push({
                                    tokenId,
                                    tokenAddress: CONTRACT_CONFIG.TOKEN_REGISTRY_ADDRESS,
                                    assetType: getAssetTypeName(Number(tokenDetails.asset_type)),
                                    title: assetMetadata.name || `Asset #${tokenId}`,
                                    pricePerHour: flowRateDisplay * 3600,
                                    startTime: Number(streamInfo.startTime),
                                    duration: durationSeconds,
                                    totalBudget: totalAmountDisplay,
                                    amountSpent: amountWithdrawnDisplay,
                                    streamId: streamId,
                                    description: assetMetadata.description || '',
                                    imageUrl: assetMetadata.image || undefined,
                                    streamInfo: streamInfo, 
                                    metadataUri: tokenDetails.metadata_uri,
                                    attributes: assetMetadata.attributes || [],
                                    location: { lat: 0, lng: 0, city: 'N/A' },
                                });
                            }
                        }
                    } catch (innerError) {
                        console.warn(`Error processing token ${tokenId} for rentals:`, innerError);
                    }
                }
                setRentals(activeRentals);
            } catch (outerError: any) {
                console.error('[MyRentals] Error loading rentals:', outerError);
                setError(outerError.message || "Failed to load rentals.");
                setRentals([]);
            } finally {
                setLoading(false);
            }
        };

        loadMyRentals();
        const interval = setInterval(loadMyRentals, 15000);
        return () => clearInterval(interval);
    }, [address, isConnected, writeContractAsync]);

    const handleCancelRental = async (streamId: number, assetTitle: string) => {
        if (!address) return;

        const confirmCancel = window.confirm(
            `Are you sure you want to end the rental for ${assetTitle}? You will be refunded for unused time.`
        );

        if (!confirmCancel) return;

        setCancellingId(streamId);
        try {
            const tx = await ContinuumService.cancelStream(streamId);
            await tx.wait();

            alert(`Rental cancelled for ${assetTitle}. Unused funds have been refunded.`);
        } catch (error: any) {
            console.error('Cancel rental failed:', error);
            alert(`Failed to cancel rental: ${error?.message || 'Please try again'}`);
        } finally {
            setCancellingId(null);
        }
    };

    const calculateTimeElapsed = (startTime: number): string => {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - startTime;
        const hours = Math.floor(elapsed / 3600);
        const minutes = Math.floor((elapsed % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        return `${minutes}m`;
    };

    const calculateCurrentCost = (rental: ActiveRental): number => {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - rental.startTime;
        const hoursElapsed = elapsed / 3600;
        return Math.min(hoursElapsed * rental.pricePerHour, rental.totalBudget);
    };

    const calculateRefund = (rental: ActiveRental): number => {
        const currentCost = calculateCurrentCost(rental);
        return Math.max(rental.totalBudget - currentCost, 0);
    };

    const isRentalCompleted = (rental: ActiveRental): boolean => {
        const now = Math.floor(Date.now() / 1000);
        return now >= (rental.startTime + rental.duration);
    };

    const getBudgetPercentage = (rental: ActiveRental): number => {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - rental.startTime;
        const totalDuration = rental.duration;
        return Math.min((elapsed / totalDuration) * 100, 100);
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <Zap size={32} style={{ color: 'var(--color-primary)' }} />
                    <h1 style={{ margin: 0 }}>My Active Rentals</h1>
                </div>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Manage your ongoing rental streams. Cancel anytime to get refunded for unused time.
                </p>
            </div>

            {!isConnected ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-lg)' }}>🔒</div>
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Connect Your Wallet</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Connect your wallet to view your active rental streams
                    </p>
                </div>
            ) : loading ? (
                <LoadingScreen message="Loading your active rentals..." />
            ) : error ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <h2 style={{ marginBottom: 'var(--spacing-md)' }}>Error Loading Rentals</h2>
                    <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
                </div>
            ) : rentals.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-4xl)', textAlign: 'center' }}>
                    <Car size={48} style={{ margin: '0 auto var(--spacing-lg)', opacity: 0.3 }} />
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Active Rentals</h3>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                        Start renting real world assets to see them here
                    </p>
                    <Button
                        variant="primary"
                        onClick={() => window.location.href = '/dashboard'}
                    >
                        Browse Assets
                    </Button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                    {rentals.map((rental) => {
                        const IconComponent = getAssetIcon(rental.assetType); 
                        const currentCost = calculateCurrentCost(rental);
                        const refund = calculateRefund(rental);
                        const timeElapsed = calculateTimeElapsed(rental.startTime);
                        const isCompleted = isRentalCompleted(rental);
                        const budgetPercentage = getBudgetPercentage(rental);

                        return (
                            <div key={rental.tokenId} className="card" style={{ padding: 'var(--spacing-xl)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                                            {IconComponent}
                                            <h3>{rental.title}</h3>
                                            <span
                                                style={{
                                                    fontSize: 'var(--font-size-xs)',
                                                    padding: '4px 8px',
                                                    background: isCompleted
                                                        ? 'rgba(156, 163, 175, 0.2)'
                                                        : 'rgba(16, 185, 129, 0.2)',
                                                    color: isCompleted
                                                        ? 'var(--color-text-secondary)'
                                                        : 'var(--color-success)',
                                                    borderRadius: 'var(--border-radius-sm)',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {isCompleted ? 'COMPLETED' : 'ACTIVE'}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                            {rental.assetType} • ${rental.pricePerHour.toFixed(4)}/hour
                                        </p>
                                    </div>

                                    {!isCompleted ? (
                                        <Button
                                            variant="secondary"
                                            onClick={() => rental.streamId && handleCancelRental(rental.streamId, rental.title)} // Added null check
                                            disabled={cancellingId === rental.streamId || !isConnected || !rental.streamId}
                                            isLoading={cancellingId === rental.streamId}
                                            leftIcon={<XCircle size={16} />}
                                        >
                                            {cancellingId === rental.streamId ? 'Cancelling...' : 'End Rental'}
                                        </Button>
                                    ) : (
                                        <div
                                            style={{
                                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                                background: 'rgba(156, 163, 175, 0.1)',
                                                border: '1px solid rgba(156, 163, 175, 0.3)',
                                                borderRadius: 'var(--border-radius-md)',
                                                fontSize: 'var(--font-size-sm)',
                                                color: 'var(--color-text-secondary)',
                                            }}
                                        >
                                            Rental Complete
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(4, 1fr)',
                                    gap: 'var(--spacing-md)',
                                    marginTop: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-md)',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: 'var(--border-radius-md)',
                                }}>
                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                            Time Elapsed
                                        </p>
                                        <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                                            <Clock size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                            {timeElapsed}
                                        </p>
                                    </div>

                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                            Current Cost
                                        </p>
                                        <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-warning)' }}>
                                            ${currentCost.toFixed(2)}
                                        </p>
                                    </div>

                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                            Refund if Cancelled
                                        </p>
                                        <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600, color: 'var(--color-success)' }}>
                                            ${refund.toFixed(2)}
                                        </p>
                                    </div>

                                    <div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: '4px' }}>
                                            Total Budget
                                        </p>
                                        <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                                            ${rental.totalBudget.toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginTop: 'var(--spacing-md)' }}>
                                    <div style={{
                                        width: '100%',
                                        height: '8px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                        overflow: 'hidden',
                                    }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${budgetPercentage}%`,
                                            background: isCompleted
                                                ? 'rgba(156, 163, 175, 0.5)'
                                                : 'linear-gradient(90deg, var(--color-success), var(--color-warning))',
                                            transition: 'width 1s ease',
                                        }} />
                                    </div>
                                    <p style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--color-text-secondary)',
                                        marginTop: 'var(--spacing-xs)',
                                    }}>
                                        {budgetPercentage.toFixed(1)}% of budget used
                                    </p>
                                </div>

                                {isCompleted ? (
                                    <div
                                        className="card"
                                        style={{
                                            marginTop: 'var(--spacing-md)',
                                            padding: 'var(--spacing-md)',
                                            background: 'rgba(156, 163, 175, 0.1)',
                                            border: '1px solid rgba(156, 163, 175, 0.3)',
                                        }}
                                    >
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                            <AlertTriangle size={16} />
                                            Budget fully used. Your access to this asset has ended. To continue using, rent it again from the Dashboard.
                                        </p>
                                    </div>
                                ) : refund < rental.pricePerHour && (
                                    <div
                                        className="card"
                                        style={{
                                            marginTop: 'var(--spacing-md)',
                                            padding: 'var(--spacing-sm)',
                                            background: 'rgba(245, 158, 11, 0.1)',
                                            border: '1px solid var(--color-warning)',
                                        }}
                                    >
                                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                            <AlertTriangle size={16} />
                                            Less than 1 hour remaining in your budget
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div
                className="card"
                style={{
                    marginTop: 'var(--spacing-2xl)',
                    padding: 'var(--spacing-lg)',
                    background: 'rgba(0, 217, 255, 0.05)',
                    border: '1px solid rgba(0, 217, 255, 0.2)',
                }}
            >
                <h4 style={{ marginBottom: 'var(--spacing-sm)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                    <Info size={20} style={{ color: 'var(--color-primary)' }} />
                    How Rental Cancellation Works
                </h4>
                <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li>Click "End Rental" to stop the money stream</li>
                    <li>Contract calculates exact time used (down to the second)</li>
                    <li>Unused funds are refunded instantly to your wallet</li>
                    <li>Asset access is immediately revoked</li>
                </ul>
            </div>
        </div>
    );
};