import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LiveBalance } from './LiveBalance';
import { StreamVisualization } from './StreamVisualization';
import { Badge } from './Badge';
import { AssetData } from '../../hooks/useAssetList'; 

export interface AssetCardProps {
    asset: AssetData;
    className?: string;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, className = '' }) => {
    const navigate = useNavigate();

    const {
        tokenId,
        assetType = 'Unknown Asset',
        title = `Asset #${tokenId}`,
        imageUrl,
        streamInfo,
    } = asset || {};

    const handleClick = () => {
        navigate(`/asset/${tokenId}`);
    };

    return (
        <div
            className={`card cursor-pointer ${className}`}
            onClick={handleClick}
            style={{ overflow: 'hidden', position: 'relative' }}
        >
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
                <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                    <Badge variant="info" showIcon={false}>
                        {assetType}
                    </Badge>
                </div>
            </div>

            <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-sm)' }}>
                {title}
            </h3>
            <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-lg)' }}>
                Token ID: {tokenId}
            </p>

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <LiveBalance streamInfo={streamInfo || null} showRate={true} />
            </div>

            <StreamVisualization streamInfo={streamInfo || null} />
        </div>
    );
};