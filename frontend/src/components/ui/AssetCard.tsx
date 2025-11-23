import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveBalance } from './LiveBalance';
import { StreamVisualization } from './StreamVisualization';
import { Badge } from './Badge';
import type { StreamInfo } from '../../hooks/useStreamBalance';

export interface Asset {
    tokenAddress: string;
    assetType?: string;
    title?: string;
    imageUrl?: string;
    streamInfo: StreamInfo | null;
}

export interface AssetCardProps {
    asset: Asset;
    className?: string;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, className = '' }) => {
    const navigate = useNavigate();

    const {
        tokenAddress,
        assetType = 'Unknown Asset', // Debugging: shows we couldn't determine type
        title = `Asset ${tokenAddress?.slice(0, 6) || 'Unknown'}`,
        imageUrl,
        streamInfo,
    } = asset || {};

    const handleClick = () => {
        navigate(`/asset/${tokenAddress}`);
    };

    return (
        <div
            className={`card cursor-pointer ${className}`}
            onClick={handleClick}
            style={{ overflow: 'hidden', position: 'relative' }}
        >
            {/* Asset Image */}
            <div
                style={{
                    height: '200px',
                    background: imageUrl
                        ? `url(${imageUrl}) center/cover`
                        : 'linear-gradient(135deg, rgba(0, 217, 255, 0.2) 0%, rgba(16, 185, 129, 0.2) 100%)',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--spacing-lg)',
                    position: 'relative',
                }}
            >
                {/* Asset Type Badge */}
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <Badge variant="info" showIcon={false}>
                        {assetType}
                    </Badge>
                </div>
            </div>

            {/* Asset Info */}
            <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-sm)' }}>
                {title}
            </h3>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-lg)' }}>
                {tokenAddress ? `${tokenAddress.slice(0, 10)}...${tokenAddress.slice(-8)}` : 'No address'}
            </p>

            {/* Live Balance - The "WOW" Moment */}
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <LiveBalance streamInfo={streamInfo} showRate={true} />
            </div>

            {/* Progress Bar */}
            <StreamVisualization streamInfo={streamInfo} />
        </div>
    );
};
