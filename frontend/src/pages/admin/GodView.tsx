import React, { useState, useEffect } from 'react';
import { Activity, DollarSign, Zap, TrendingUp, Car, Home, Wrench, Rocket } from 'lucide-react';
import { StatCard } from '../../components/admin/StatCard';
import { AssetMap } from '../../components/admin/AssetMap';
import { formatCurrency } from '../../utils/formatting';
import { ContinuumService } from '../../services/continuumService';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { ethers } from 'ethers';
import { CONTRACT_CONFIG } from '../../config/contracts';
import { fetchIpfsMetadata, IPFS_GATEWAY } from '../../utils/ipfs'; 
import { StreamInfo, AssetLocation } from '../../types/continuum'; // Imported AssetLocation

export const GodView: React.FC = () => {
    const [assets, setAssets] = useState<AssetLocation[]>([]); 
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        activeStreams: 0,
        totalValueLocked: 0,
        totalYieldDistributed: 0,
        iotUptime: 99.9,
    });

    const getAssetTypeName = (assetType: number | undefined): 'Real Estate' | 'Vehicle' | 'Heavy Machinery' | 'Unknown Asset' => {
        switch (assetType) {
            case 0: return 'Real Estate';
            case 1: return 'Vehicle';
            case 2: return 'Heavy Machinery';
            default: return 'Unknown Asset';
        }
    };

    useEffect(() => {
        const fetchRealAssets = async () => {
            setLoading(true);
            try {
                const allTokenIds = await ContinuumService.getAllTokenIds();
                const transformedAssets: (AssetLocation | null)[] = await Promise.all(
                    allTokenIds.map(async (tokenId: number) => {
                        try {
                            const tokenDetails = await ContinuumService.getTokenDetails(tokenId);
                            const metadataUri = tokenDetails.metadata_uri;
                            let assetMetadata: any = {};
                            if (metadataUri) {
                                assetMetadata = await fetchIpfsMetadata(metadataUri);
                                if (assetMetadata.image && assetMetadata.image.startsWith('ipfs://')) {
                                    assetMetadata.image = `${IPFS_GATEWAY}${assetMetadata.image.replace('ipfs://', '')}`;
                                }
                            }

                            const streamId = Number(tokenDetails.stream_id);
                            let streamInfo: StreamInfo | undefined;
                            let streamStatus = null;
                            if (streamId > 0) {
                                try {
                                    streamInfo = await ContinuumService.getStreamInfo(streamId);
                                    streamStatus = await ContinuumService.getStreamStatus(streamId);
                                } catch (error) {
                                    console.warn(`Failed to fetch stream info for stream ${streamId}: `, error);
                                }
                            }

                            const currentTotalAmount = streamInfo ? Number(ethers.formatUnits(streamInfo.totalAmount, 18)) : 0;
                            const currentFlowRate = streamInfo ? Number(ethers.formatUnits(streamInfo.flowRate, 18)) : 0;
                            const amountWithdrawn = streamInfo ? Number(ethers.formatUnits(streamInfo.amountWithdrawn, 18)) : 0;

                            return {
                                id: tokenId.toString(),
                                tokenId: tokenId,
                                assetType: getAssetTypeName(Number(tokenDetails.asset_type)),
                                title: assetMetadata.name || `Asset #${tokenId}`,
                                description: assetMetadata.description || 'No description available.',
                                imageUrl: assetMetadata.image || undefined,
                                tokenAddress: CONTRACT_CONFIG.TOKEN_REGISTRY_ADDRESS, 
                                status: streamStatus?.isFrozen ? 'frozen' : (streamInfo ? 'active' : 'idle'),
                                location: {
                                    lat: 37.7749 + (Math.random() - 0.5) * 0.5,
                                    lng: -122.4194 + (Math.random() - 0.5) * 0.5,
                                    city: 'San Francisco Bay Area',
                                },
                                streamId: streamId > 0 ? streamId : undefined,
                                currentValue: currentTotalAmount,
                                yieldRate: currentFlowRate,
                                totalEarned: amountWithdrawn,
                                lastUpdate: Date.now(),
                                streamInfo,
                                metadataUri,
                                attributes: assetMetadata.attributes || [],
                            };
                        } catch (innerError) {
                            console.error(`Error processing token ${tokenId}:`, innerError);
                            return null;
                        }
                    })
                );

                const validAssets = transformedAssets.filter((asset): asset is AssetLocation => asset !== null);
                setAssets(validAssets);

                const activeStreams = validAssets.filter(a => a.status === 'active').length;
                const totalValueLocked = validAssets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
                const totalYieldDistributed = validAssets.reduce((sum, a) => sum + (a.totalEarned || 0), 0);

                setStats({
                    activeStreams,
                    totalValueLocked,
                    totalYieldDistributed,
                    iotUptime: 99.9,
                });

            } catch (outerError) {
                console.error('Error fetching real assets:', outerError);
            } finally {
                setLoading(false);
            }
        };

        fetchRealAssets();
        const interval = setInterval(fetchRealAssets, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleAssetClick = (asset: AssetLocation) => {
        console.log('Asset clicked:', asset);
    };

    if (loading) {
        return <LoadingScreen message="Loading assets from blockchain..." />;
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Live Asset Monitor (EVM Simulated)</h1>
                <p className="text-secondary">
                    {assets.length > 0
                        ? `Tracking ${assets.length} registered asset${assets.length !== 1 ? 's' : ''} on BNB Smart Chain`
                        : 'No registered assets found on BNB Smart Chain'}
                </p>
            </div>
            {assets.length > 0 ? (
                <AssetMap assets={assets} onAssetClick={handleAssetClick} />
            ) : (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <Rocket size={48} style={{ margin: '0 auto var(--spacing-md)', opacity: 0.3 }} />
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Assets Registered Yet</h3>
                    <p className="text-secondary">
                        Assets will appear on the map once they are registered in the token registry
                    </p>
                </div>
            )}

            <div className="grid grid-cols-4 gap-lg" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <StatCard
                    label="Active Streams"
                    value={stats.activeStreams}
                    glow={true}
                    icon={<Activity size={24} style={{ color: 'var(--color-success)' }} />}
                    trend="up"
                    trendValue="Live"
                />
                <StatCard
                    label="Total Value Locked"
                    value={formatCurrency(stats.totalValueLocked, 0)}
                    icon={<DollarSign size={24} style={{ color: 'var(--color-primary)' }} />}
                />
                <StatCard
                    label="Yield Distributed"
                    value={formatCurrency(stats.totalYieldDistributed, 0)}
                    icon={<TrendingUp size={24} style={{ color: 'var(--color-secondary)' }} />}
                    trend="up"
                    trendValue="Real-time"
                />
                <StatCard
                    label="IoT Uptime"
                    value={`${stats.iotUptime}%`}
                    glow={true}
                    icon={<Zap size={24} style={{ color: 'var(--color-success)' }} />}
                />
            </div>

            <div className="grid grid-cols-3 gap-md">
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(0, 217, 255, 0.05)', border: '1px solid var(--color-primary)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Car size={18} /> Fleet Status
                    </h4>
                    <p className="text-secondary">
                        {assets.filter(a => a.assetType === 'Vehicle' && a.status === 'active').length} vehicles active, {assets.filter(a => a.assetType === 'Vehicle' && a.status === 'frozen').length} frozen
                    </p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--color-success)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Home size={18} /> Properties
                    </h4>
                    <p className="text-secondary">
                        {assets.filter(a => a.assetType === 'Real Estate' && a.status === 'active').length} with active streams, {assets.filter(a => a.assetType === 'Real Estate' && a.status === 'idle').length} idle
                    </p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--color-warning)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Wrench size={18} /> Machinery
                    </h4>
                    <p className="text-secondary">
                        {assets.filter(a => a.assetType === 'Heavy Machinery').length} units deployed
                    </p>
                </div>
            </div>
        </div>
    );
};