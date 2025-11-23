import React from 'react';
import { Badge } from './Badge';
import { ExternalLink, TrendingUp } from 'lucide-react';
import type { StreamInfo } from '../../hooks/useStreamBalance';

export interface MarketplaceAsset {
    tokenAddress: string;
    assetType?: string;
    title?: string;
    imageUrl?: string;
    streamInfo: StreamInfo | null;
}

export interface MarketplaceCardProps {
    asset: MarketplaceAsset;
    className?: string;
}

export const MarketplaceCard: React.FC<MarketplaceCardProps> = ({ asset, className = '' }) => {
    const {
        tokenAddress,
        assetType = 'Unknown Asset', // Debugging: shows we couldn't determine type
        title = `Asset ${tokenAddress?.slice(0, 6) || 'Unknown'}`,
        imageUrl,
        streamInfo,
    } = asset || {};

    // Calculate APY if stream exists (with proper validation)
    const calculateAPY = () => {
        if (!streamInfo?.flowRate || !streamInfo?.totalAmount || streamInfo.totalAmount === 0) {
            return null;
        }

        // Convert from octas (10^8) to APT for calculation
        const flowRateAPT = streamInfo.flowRate / 100_000_000;
        const totalAmountAPT = streamInfo.totalAmount / 100_000_000;

        const annualYield = flowRateAPT * 365 * 24 * 60 * 60;
        const apy = (annualYield / totalAmountAPT) * 100;

        // Return null if APY is 0 or invalid
        return apy > 0 ? apy.toFixed(1) : null;
    };

    const apy = calculateAPY();

    return (
        <div
            className={`card cursor-pointer ${className}`}
            style={{
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 217, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
            }}
        >
            {/* Asset Image */}
            <div
                style={{
                    height: '220px',
                    background: imageUrl
                        ? `url(${imageUrl}) center/cover`
                        : 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                    borderRadius: 'var(--border-radius-lg)',
                    marginBottom: 'var(--spacing-lg)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Gradient Overlay */}
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
                    }}
                />

                {/* Top Badges Row */}
                <div
                    style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        right: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: 'var(--spacing-sm)',
                        zIndex: 1,
                    }}
                >
                    {/* Asset Type Badge */}
                    <div
                        style={{
                            background: 'rgba(0, 217, 255, 0.15)',
                            backdropFilter: 'blur(10px)',
                            padding: '6px 12px',
                            borderRadius: 'var(--border-radius-md)',
                            border: '1px solid rgba(0, 217, 255, 0.4)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 600,
                            color: 'var(--color-primary)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {assetType}
                    </div>

                    {/* APY Badge (if available) */}
                    {apy && (
                        <div
                            style={{
                                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.95), rgba(5, 150, 105, 0.95))',
                                backdropFilter: 'blur(10px)',
                                padding: '6px 12px',
                                borderRadius: 'var(--border-radius-md)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: 'var(--font-size-sm)',
                                fontWeight: 700,
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <TrendingUp size={16} strokeWidth={2.5} />
                            <span>{apy}% APY</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Asset Info */}
            <div>
                <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-xs)' }}>
                    {title}
                </h3>

                <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-md)' }}>
                    {tokenAddress ? `${tokenAddress.slice(0, 10)}...${tokenAddress.slice(-8)}` : 'No address'}
                </p>

                {/* Stream Stats */}
                {streamInfo && (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 'var(--spacing-md)',
                            marginBottom: 'var(--spacing-lg)',
                            padding: 'var(--spacing-md)',
                            background: 'rgba(255, 255, 255, 0.02)',
                            borderRadius: 'var(--border-radius-md)',
                        }}
                    >
                        <div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-xs)' }}>
                                Total Yield
                            </p>
                            <p style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>
                                {(streamInfo.totalAmount / 100_000_000).toFixed(2)} APT
                            </p>
                        </div>
                        <div>
                            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-xs)' }}>
                                Status
                            </p>
                            <Badge variant={streamInfo.isActive ? 'success' : 'warning'} showIcon={false}>
                                {streamInfo.isActive ? 'Active' : 'Paused'}
                            </Badge>
                        </div>
                    </div>
                )}

                {/* View Details Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://explorer.aptoslabs.com/object/${tokenAddress}?network=testnet`, '_blank');
                    }}
                    style={{
                        width: '100%',
                        padding: 'var(--spacing-md)',
                        background: 'rgba(0, 217, 255, 0.1)',
                        border: '1px solid rgba(0, 217, 255, 0.3)',
                        borderRadius: 'var(--border-radius-md)',
                        color: 'var(--color-primary)',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--spacing-sm)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 217, 255, 0.2)';
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 217, 255, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(0, 217, 255, 0.3)';
                    }}
                >
                    View on Explorer
                    <ExternalLink size={14} />
                </button>

                {/* Info Note */}
                <p
                    className="text-muted"
                    style={{
                        fontSize: 'var(--font-size-xs)',
                        marginTop: 'var(--spacing-md)',
                        textAlign: 'center',
                    }}
                >
                    Only NFT owners can claim yield
                </p>
            </div>
        </div>
    );
};
