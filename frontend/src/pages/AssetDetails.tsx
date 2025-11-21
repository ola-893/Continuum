import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LiveBalance } from '../components/ui/LiveBalance';
import { StreamVisualization } from '../components/ui/StreamVisualization';
import { FlashAdvanceModal } from '../components/ui/FlashAdvanceModal';
import { getAssetByAddress } from '../data/mockAssets';
import { formatCurrency } from '../utils/formatting';

export const AssetDetails: React.FC = () => {
    const { tokenId } = useParams<{ tokenId: string }>();
    const navigate = useNavigate();
    const [showFlashModal, setShowFlashModal] = useState(false);
    const [isRepaying, setIsRepaying] = useState(false);

    const asset = tokenId ? getAssetByAddress(tokenId) : null;

    if (!asset) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                    <p>Asset not found</p>
                    <Button variant="ghost" onClick={() => navigate('/dashboard')} style={{ marginTop: 'var(--spacing-md)' }}>
                        Back to Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    const currentStreamInfo = isRepaying
        ? { ...asset.streamInfo, isActive: false }
        : asset.streamInfo;

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

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <Button
                                variant="secondary"
                                leftIcon={<DollarSign size={18} />}
                                disabled={isRepaying}
                                style={{ flex: 1 }}
                            >
                                Claim Yield
                            </Button>
                            <Button
                                variant="primary"
                                leftIcon={<Zap size={18} />}
                                onClick={() => setShowFlashModal(true)}
                                disabled={isRepaying}
                                style={{ flex: 1 }}
                            >
                                ⚡ Flash Advance
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
                                    🔒 Stream is currently repaying a flash advance. All yield is being automatically allocated to repayment.
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
                    onConfirm={(amount) => {
                        console.log('Flash advance requested:', amount);
                        setIsRepaying(true);
                        setShowFlashModal(false);
                    }}
                />
            )}
        </div>
    );
};
