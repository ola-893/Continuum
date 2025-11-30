import React from 'react';
import { Badge } from './Badge';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { AssetData } from '../../hooks/useAssetList'; 
import { CONTRACT_CONFIG } from '../../config/contracts'; 

export interface AssetExplorerCardProps {
    asset: AssetData;
    className?: string;
}

export const AssetExplorerCard: React.FC<AssetExplorerCardProps> = ({ asset, className = '' }) => {
    const {
        tokenId,
        assetType = 'Unknown Asset',
        title = `Asset #${tokenId}`,
        imageUrl,
        streamInfo,
    } = asset || {};

    const calculateAPY = () => {
        if (!streamInfo?.flowRate || !streamInfo?.totalAmount || streamInfo.totalAmount === 0) {
            return null;
        }
        const annualYield = streamInfo.flowRate * 365 * 24 * 60 * 60;
        const apy = (annualYield / streamInfo.totalAmount) * 100;
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
                <div
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 50%, rgba(0,0,0,0.4) 100%)',
                    }}
                />
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
            <div>
                <h3 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--spacing-xs)' }}>
                    {title}
                </h3>
                <p className="text-muted" style={{ fontSize: 'var(--font-size-xs)', marginBottom: 'var(--spacing-md)' }}>
                    Token ID: {tokenId}
                </p>
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
                                {streamInfo.totalAmount.toFixed(2)} BUSD
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
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://testnet.bscscan.com/token/${CONTRACT_CONFIG.TOKEN_REGISTRY_ADDRESS}?a=${tokenId}`, '_blank');
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
                    View on BscScan
                    <ExternalLink size={14} />
                </button>
            </div>
        </div>
    );
};