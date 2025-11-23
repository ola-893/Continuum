import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LiveBalance } from '../components/ui/LiveBalance';
import { StreamVisualization } from '../components/ui/StreamVisualization';
import { FlashAdvanceModal } from '../components/ui/FlashAdvanceModal';
import { formatCurrency } from '../utils/formatting';
import { useContinuum } from '../hooks/useContinuum';
import { useAssetStream } from '../hooks/useRealAssetStream';

export const AssetDetails: React.FC = () => {
    const { tokenId } = useParams<{ tokenId: string }>();
    const navigate = useNavigate();
    const { claimYield, flashAdvance, loading } = useContinuum();
    const [showFlashModal, setShowFlashModal] = useState(false);
    const [isRepaying, setIsRepaying] = useState(false);
    const [txStatus, setTxStatus] = useState('');
    const [isClaiming, setIsClaiming] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);

    // Fetch real asset data from blockchain
    const { streamId, streamInfo, loading: loadingAsset, error } = useAssetStream(tokenId || '');

    if (loadingAsset) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                    <p>Loading asset data from blockchain...</p>
                </div>
            </div>
        );
    }

    if (!streamInfo || error) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                    <p>{error || 'Asset not found or not registered on blockchain'}</p>
                    <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 'var(--spacing-md)' }}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    // Transform blockchain data to asset object format
    const getAssetTypeName = (assetType: number | undefined): string => {
        switch (assetType) {
            case 0: return 'Real Estate';
            case 1: return 'Vehicle';
            case 2: return 'Commodities';
            default: return 'Unknown Asset';
        }
    };

    const asset = {
        tokenAddress: tokenId || '',
        assetType: getAssetTypeName(streamInfo.assetType),
        title: `Asset ${tokenId?.slice(0, 6)}...${tokenId?.slice(-4)}`,
        imageUrl: undefined,
        streamId: streamId || undefined, // Add streamId for flash advance balance checking
        streamInfo: {
            startTime: streamInfo.startTime,
            flowRate: streamInfo.flowRate / 100_000_000, // Convert to APT/sec
            amountWithdrawn: streamInfo.amountWithdrawn,
            totalAmount: streamInfo.totalAmount,
            stopTime: streamInfo.stopTime,
            isActive: streamInfo.status === 0,
        },
        metadata: {
            'Stream ID': streamInfo.startTime.toString(),
            'Start Time': new Date(streamInfo.startTime * 1000).toLocaleString(),
            'Flow Rate': `${(streamInfo.flowRate / 100_000_000).toFixed(8)} APT/sec`,
            'Total Amount': `${(streamInfo.totalAmount / 100_000_000).toFixed(2)} APT`,
            'Status': streamInfo.status === 0 ? 'Active' : 'Inactive',
        },
    };

    const currentStreamInfo = isRepaying
        ? { ...asset.streamInfo, isActive: false }
        : asset.streamInfo;

    // Handle claim yield transaction
    const handleClaimYield = async () => {
        const tokenAddress = asset.tokenAddress;
        if (!tokenAddress) return;

        try {
            setIsClaiming(true);
            setTxStatus('Preparing claim transaction...');

            setTxStatus('Please approve transaction in your wallet...');
            await claimYield(tokenAddress);

            setTxStatus('Successfully claimed all available yield!');
            setTimeout(() => {
                setTxStatus('');
                setIsClaiming(false);
            }, 3000);
        } catch (error: any) {
            console.error('Claim failed:', error);
            setTxStatus(`Claim failed: ${error?.message || 'Please try again'}`);
            setTimeout(() => {
                setTxStatus('');
                setIsClaiming(false);
            }, 5000);
        }
    };

    // Handle flash advance transaction
    const handleFlashAdvance = async (amount: number) => {
        const tokenAddress = asset.tokenAddress;
        if (!tokenAddress) return;

        try {
            setIsFlashing(true);
            setTxStatus('Preparing flash advance...');

            const flashAmountOctas = Math.floor(amount * 100_000_000);

            setTxStatus('Please approve flash advance in your wallet...');
            await flashAdvance(tokenAddress, flashAmountOctas);

            setTxStatus(`Flash advance of ${amount} APT successful! Remember to repay.`);
            setTimeout(() => {
                setTxStatus('');
                setIsFlashing(false);
            }, 3000);
            setShowFlashModal(false);
            setIsRepaying(true);
        } catch (error: any) {
            console.error('Flash advance failed:', error);
            setTxStatus(`Flash advance failed: ${error?.message || 'Please try again'}`);
            setTimeout(() => {
                setTxStatus('');
                setIsFlashing(false);
            }, 5000);
        }
    };

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {/* Back Button */}
                <Button
                    variant="ghost"
                    leftIcon={<ArrowLeft size={18} />}
                    onClick={() => navigate('/dashboard')}
                    style={{ marginBottom: 'var(--spacing-xl)' }}
                >
                    Back to Portfolio
                </Button>

                <div className="grid grid-cols-2 gap-xl">
                    {/* Left Column - Asset Info */}
                    <div>
                        {/* Asset Image */}
                        <div
                            className="card"
                            style={{
                                height: '400px',
                                background: asset.imageUrl
                                    ? `url(${asset.imageUrl}) center/cover`
                                    : 'var(--gradient-primary)',
                                marginBottom: 'var(--spacing-lg)',
                            }}
                        />

                        {/* NFT Metadata */}
                        <div className="card">
                            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Asset Details</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Type</span>
                                    <Badge variant="info">{asset.assetType}</Badge>
                                </div>
                                {Object.entries(asset.metadata).map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                        <span style={{ color: 'var(--color-text-secondary)' }}>{key}</span>
                                        <span>{value}</span>
                                    </div>
                                ))}
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Owner</span>
                                    <span>You</span>
                                </div>
                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Token Address</span>
                                    <span style={{ fontSize: 'var(--font-size-xs)' }}>
                                        {asset.tokenAddress.slice(0, 10)}...{asset.tokenAddress.slice(-8)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Stream Management */}
                    <div>
                        {/* Stream Header */}
                        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-md)' }}>
                                <h2>{asset.title}</h2>
                                <Badge variant={currentStreamInfo.isActive ? 'success' : 'warning'}>
                                    Stream #{asset.tokenAddress.slice(-4)} - {currentStreamInfo.isActive ? 'Active' : 'Repaying Advance'}
                                </Badge>
                            </div>

                            {/* Live Balance */}
                            <LiveBalance streamInfo={currentStreamInfo} showRate={true} decimals={4} />
                        </div>

                        {/* Stream Stats */}
                        <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <h4 style={{ marginBottom: 'var(--spacing-md)' }}>Stream Overview</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                <div>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        Total Vesting
                                    </p>
                                    <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700 }}>
                                        {formatCurrency(asset.streamInfo.totalAmount, 2)}
                                    </p>
                                </div>

                                <StreamVisualization streamInfo={currentStreamInfo} />

                                <div className="flex justify-between">
                                    <span style={{ color: 'var(--color-text-secondary)' }}>Amount Withdrawn</span>
                                    <span>{formatCurrency(asset.streamInfo.amountWithdrawn, 2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Transaction Status */}
                        {txStatus && (
                            <div
                                className="card"
                                style={{
                                    marginBottom: 'var(--spacing-lg)',
                                    background: txStatus.includes('Success:') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    border: txStatus.includes('Success:') ? '1px solid var(--color-success)' : '1px solid var(--color-warning)',
                                }}
                            >
                                <p>{txStatus}</p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <Button
                                variant="secondary"
                                leftIcon={<DollarSign size={18} />}
                                onClick={handleClaimYield}
                                disabled={isRepaying || loading || isClaiming}
                                isLoading={isClaiming}
                                style={{ flex: 1 }}
                            >
                                Claim Yield
                            </Button>
                            <Button
                                variant="primary"
                                leftIcon={<Zap size={18} />}
                                onClick={() => setShowFlashModal(true)}
                                disabled={isRepaying || loading || isFlashing}
                                isLoading={isFlashing}
                                style={{ flex: 1 }}
                            >
                                Flash Advance
                            </Button>
                        </div>

                        {isRepaying && (
                            <div
                                className="card"
                                style={{
                                    marginTop: 'var(--spacing-lg)',
                                    border: '1px solid var(--color-warning)',
                                }}
                            >
                                <p style={{ color: 'var(--color-warning)', fontSize: 'var(--font-size-sm)' }}>
                                    Lock: Stream is currently repaying a flash advance. All yield is being automatically allocated to repayment.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Flash Advance Modal */}
            {showFlashModal && (
                <FlashAdvanceModal
                    asset={asset}
                    onClose={() => setShowFlashModal(false)}
                    onConfirm={handleFlashAdvance}
                />
            )}
        </div>
    );
};
