import React, { useState, useEffect } from 'react';
import { StreamDetails } from './StreamDetails';
import { LiveBalance } from './LiveBalance';
import { Badge } from './Badge';
import type { StreamInfo } from '../../types/continuum';

export interface AssetStreamData {
    tokenAddress: string;
    assetType: string;
    title: string;
    imageUrl?: string;
    streamInfo: StreamInfo;
    tokenSymbol?: string;
    tokenDecimals?: number;
}

export interface MultiAssetStreamDisplayProps {
    assets: AssetStreamData[];
    className?: string;
    layout?: 'grid' | 'list';
    showDetails?: boolean;
}

/**
 * Component for displaying multiple assets with different streams
 * Each asset's balance updates independently in real-time
 * Handles different token types with appropriate decimals and symbols
 */
export const MultiAssetStreamDisplay: React.FC<MultiAssetStreamDisplayProps> = ({
    assets,
    className = '',
    layout = 'grid',
    showDetails = false,
}) => {
    const [expandedAsset, setExpandedAsset] = useState<string | null>(null);

    // Handle empty state
    if (!assets || assets.length === 0) {
        return (
            <div className={`p-6 bg-secondary rounded-lg text-center ${className}`}>
                <p className="text-muted">No active streams found</p>
            </div>
        );
    }

    const toggleExpanded = (tokenAddress: string) => {
        setExpandedAsset(expandedAsset === tokenAddress ? null : tokenAddress);
    };

    // Grid layout for multiple assets
    if (layout === 'grid') {
        return (
            <div className={`grid gap-lg ${className}`} style={{
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            }}>
                {assets.map((asset) => (
                    <div
                        key={asset.tokenAddress}
                        className="bg-secondary rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => toggleExpanded(asset.tokenAddress)}
                    >
                        {/* Asset Header */}
                        <div className="p-4 border-b border-tertiary">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-semibold truncate">{asset.title}</h3>
                                <Badge variant="info" showIcon={false}>
                                    {asset.assetType}
                                </Badge>
                            </div>
                            <p className="text-xs text-muted truncate">
                                {asset.tokenAddress.slice(0, 10)}...{asset.tokenAddress.slice(-8)}
                            </p>
                        </div>

                        {/* Asset Image */}
                        {asset.imageUrl && (
                            <div
                                style={{
                                    height: '150px',
                                    background: `url(${asset.imageUrl}) center/cover`,
                                }}
                            />
                        )}

                        {/* Live Balance */}
                        <div className="p-4">
                            <LiveBalance
                                streamInfo={asset.streamInfo}
                                showRate={false}
                                decimals={asset.tokenDecimals || 6}
                            />
                            <p className="text-xs text-muted mt-2">
                                Token: {asset.tokenSymbol || 'USDT'}
                            </p>
                        </div>

                        {/* Expanded Details */}
                        {showDetails && expandedAsset === asset.tokenAddress && (
                            <div className="p-4 border-t border-tertiary">
                                <StreamDetails
                                    streamInfo={asset.streamInfo}
                                    tokenSymbol={asset.tokenSymbol}
                                    tokenDecimals={asset.tokenDecimals}
                                />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // List layout for detailed view
    return (
        <div className={`flex flex-col gap-lg ${className}`}>
            {assets.map((asset, index) => (
                <div
                    key={asset.tokenAddress}
                    className="bg-secondary rounded-lg overflow-hidden"
                >
                    {/* Asset Header */}
                    <div className="p-6 border-b border-tertiary">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-2xl font-bold text-primary">
                                        #{index + 1}
                                    </span>
                                    <h3 className="text-xl font-semibold">{asset.title}</h3>
                                    <Badge variant="info" showIcon={false}>
                                        {asset.assetType}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted">
                                    {asset.tokenAddress}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted mb-1">Token Type</p>
                                <p className="text-sm font-semibold">
                                    {asset.tokenSymbol || 'USDT'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Asset Content */}
                    <div className="p-6">
                        <div className="grid grid-cols-2 gap-6">
                            {/* Left: Image */}
                            {asset.imageUrl && (
                                <div
                                    className="rounded-lg"
                                    style={{
                                        height: '250px',
                                        background: `url(${asset.imageUrl}) center/cover`,
                                    }}
                                />
                            )}

                            {/* Right: Live Balance */}
                            <div className="flex flex-col justify-center">
                                <p className="text-sm text-muted mb-2">Claimable Balance</p>
                                <LiveBalance
                                    streamInfo={asset.streamInfo}
                                    showRate={true}
                                    decimals={asset.tokenDecimals || 6}
                                />
                            </div>
                        </div>

                        {/* Stream Details */}
                        {showDetails && (
                            <div className="mt-6">
                                <StreamDetails
                                    streamInfo={asset.streamInfo}
                                    tokenSymbol={asset.tokenSymbol}
                                    tokenDecimals={asset.tokenDecimals}
                                />
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

/**
 * Hook for managing multiple asset streams
 * Provides utilities for filtering, sorting, and aggregating stream data
 */
export function useMultiAssetStreams(assets: AssetStreamData[]) {
    const [activeCount, setActiveCount] = useState<number>(0);

    useEffect(() => {
        // Calculate aggregate statistics
        let active = 0;

        assets.forEach((asset) => {
            if (asset.streamInfo.status === 0) {
                active++;
            }
        });

        setActiveCount(active);
    }, [assets]);

    const filterByAssetType = (assetType: string) => {
        return assets.filter((asset) => asset.assetType === assetType);
    };

    const filterByTokenType = (tokenSymbol: string) => {
        return assets.filter((asset) => asset.tokenSymbol === tokenSymbol);
    };

    const filterActive = () => {
        return assets.filter((asset) => asset.streamInfo.status === 0);
    };

    const sortByBalance = (descending: boolean = true) => {
        return [...assets].sort((a, b) => {
            const now = Math.floor(Date.now() / 1000);
            
            const calcBalance = (stream: StreamInfo) => {
                if (now < stream.startTime) return 0;
                const effectiveTime = Math.min(now, stream.stopTime);
                const elapsed = effectiveTime - stream.startTime;
                const accumulated = elapsed * stream.flowRate;
                const claimable = accumulated - stream.amountWithdrawn;
                const remaining = stream.totalAmount - stream.amountWithdrawn;
                return Math.max(0, Math.min(claimable, remaining));
            };

            const balanceA = calcBalance(a.streamInfo);
            const balanceB = calcBalance(b.streamInfo);

            return descending ? balanceB - balanceA : balanceA - balanceB;
        });
    };

    return {
        activeCount,
        filterByAssetType,
        filterByTokenType,
        filterActive,
        sortByBalance,
    };
}
