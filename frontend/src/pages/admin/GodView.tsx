
import React, { useState, useEffect } from 'react';
import { Activity, DollarSign, Zap, TrendingUp, Car, Home, Wrench, RefreshCw } from 'lucide-react';
import { StatCard } from '../../components/admin/StatCard';
import { AssetMap } from '../../components/admin/AssetMap';
import { AnalyticsExport } from '../../components/admin/AnalyticsExport';
import { formatCurrency } from '../../utils/formatting';
import { ContinuumService } from '../../services/continuumService';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { TokenIndexEntry, AssetLocation } from '../../types/continuum';
import { calculateTotalStreamed } from '../../utils/streamCalculations';
import { getSystemMetrics, type SystemMetrics } from '../../services/systemMetricsService';
import { mutezToTokens } from '../../services/tezosContractService';

export const GodView: React.FC = () => {
    const [assets, setAssets] = useState<AssetLocation[]>([]);
    const [loading, setLoading] = useState(true);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [stats, setStats] = useState<SystemMetrics & { iotUptime: number }>({
        activeStreamsCount: 0,
        totalValueLocked: 0,
        totalYieldDistributed: 0,
        totalAssetsCount: 0,
        iotUptime: 99.9, // Placeholder for now as IoT isn't fully integrated
    });

    useEffect(() => {
        const fetchRealAssets = async () => {
            setLoading(true);
            try {
                // Fetch all registered tokens from blockchain
                const tokens = await ContinuumService.getAllRegisteredTokens();
                console.log('Fetched tokens from registry:', tokens);

                // Convert token registry entries to AssetLocation format
                const transformedAssets: AssetLocation[] = await Promise.all(
                    tokens.map(async (token: TokenIndexEntry, index: number) => {
                        const tokenAddress = token.token_address;
                        const streamId = Number(token.stream_id);
                        const assetType = token.asset_type !== undefined ? Number(token.asset_type) : undefined;

                        // Fetch stream info if stream ID exists
                        let streamInfo = null;
                        let streamStatus = null;
                        if (streamId) {
                            try {
                                streamInfo = await ContinuumService.getStreamInfo(streamId);
                                streamStatus = await ContinuumService.getStreamStatus(streamId);
                            } catch (error) {
                                console.warn(`Failed to fetch stream info for stream ${streamId}: `, error);
                            }
                        }

                        // Map asset type to readable type
                        const typeMap: Record<number, 'real_estate' | 'car' | 'machinery'> = {
                            0: 'real_estate',
                            1: 'car',
                            2: 'machinery',
                        };

                        const getAssetTypeOrDefault = (type: number | undefined): 'real_estate' | 'car' | 'machinery' => {
                            if (type === undefined) return 'machinery'; // Unknown assets default to machinery
                            return typeMap[type] || 'machinery';
                        };

                        // Transform streamInfo to match expected format for calculations
                        const streamInfoForCalc = streamInfo ? {
                            sender: streamInfo.sender || '',
                            recipient: streamInfo.recipient || '',
                            startTime: streamInfo.startTime,
                            flowRate: streamInfo.flowRate / 100_000_000, // Convert to APT/sec
                            amountWithdrawn: streamInfo.amountWithdrawn / 100_000_000, // Convert to APT
                            totalAmount: streamInfo.totalAmount / 100_000_000, // Convert to APT
                            stopTime: streamInfo.stopTime,
                            status: streamInfo.status || 0,
                        } : null;

                        return {
                            id: `TOKEN-${index + 1}`,
                            type: getAssetTypeOrDefault(assetType),
                            name: `Asset #${index + 1}`,
                            tokenAddress,
                            status: streamStatus?.isFrozen ? 'frozen' : streamInfo ? 'active' : 'idle',
                            location: {
                                lat: 37.7749 + (Math.random() - 0.5) * 0.5, // Random Bay Area location
                                lng: -122.4194 + (Math.random() - 0.5) * 0.5,
                                city: 'San Francisco Bay Area',
                            },
                            streamId: streamId || undefined,
                            currentValue: streamInfo ? Number(streamInfo.totalAmount) / 100_000_000 : 0,
                            yieldRate: streamInfo ? Number(streamInfo.flowRate) / 100_000_000 : 0,
                            totalEarned: streamInfo ? calculateTotalStreamed(streamInfoForCalc) : 0,
                            lastUpdate: Date.now(),
                        };
                    })
                );

                setAssets(transformedAssets);

            } catch (error) {
                console.error('Error fetching real assets:', error);
                // Keep empty array on error
            } finally {
                setLoading(false);
            }
        };

        const fetchSystemMetrics = async () => {
            setMetricsLoading(true);
            try {
                // Fetch system metrics from Tezos contracts
                const metrics = await getSystemMetrics();
                console.log('Fetched system metrics:', metrics);

                setStats({
                    activeStreamsCount: metrics.activeStreamsCount,
                    totalValueLocked: mutezToTokens(metrics.totalValueLocked),
                    totalYieldDistributed: mutezToTokens(metrics.totalYieldDistributed),
                    totalAssetsCount: metrics.totalAssetsCount,
                    iotUptime: 99.9,
                });
            } catch (error) {
                console.error('Error fetching system metrics:', error);
            } finally {
                setMetricsLoading(false);
            }
        };

        fetchRealAssets();
        fetchSystemMetrics();
    }, []);

    const handleRefreshMetrics = async () => {
        setMetricsLoading(true);
        try {
            const metrics = await getSystemMetrics();
            setStats({
                activeStreamsCount: metrics.activeStreamsCount,
                totalValueLocked: mutezToTokens(metrics.totalValueLocked),
                totalYieldDistributed: mutezToTokens(metrics.totalYieldDistributed),
                totalAssetsCount: metrics.totalAssetsCount,
                iotUptime: 99.9,
            });
        } catch (error) {
            console.error('Error refreshing metrics:', error);
        } finally {
            setMetricsLoading(false);
        }
    };

    const handleAssetClick = (asset: AssetLocation) => {
        console.log('Asset clicked:', asset);
        // Can navigate to fleet control with this asset selected
    };

    if (loading) {
        return <LoadingScreen message="Loading assets from blockchain..." />;
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            {/* Live Map */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <h2>Live Asset Monitor</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        {assets.length > 0
                            ? `Tracking ${assets.length} registered asset${assets.length !== 1 ? 's' : ''} from blockchain`
                            : 'No registered assets found on blockchain'}
                    </p>
                </div>
                {assets.length > 0 ? (
                    <AssetMap assets={assets} onAssetClick={handleAssetClick} />
                ) : (
                    <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                        <div style={{ fontSize: '3rem', marginBottom: 'var(--spacing-md)' }}>Pin:</div>
                        <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Assets Registered Yet</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Assets will appear on the map once they are registered in the token registry
                        </p>
                    </div>
                )}
            </div>

            {/* Top Stats Bar */}
            <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>System Metrics</h3>
                <button
                    onClick={handleRefreshMetrics}
                    disabled={metricsLoading}
                    style={{
                        padding: 'var(--spacing-xs) var(--spacing-md)',
                        background: metricsLoading ? 'var(--color-bg-secondary)' : 'var(--gradient-primary)',
                        border: 'none',
                        borderRadius: 'var(--border-radius-md)',
                        color: 'white',
                        cursor: metricsLoading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-xs)',
                        fontWeight: 600,
                        opacity: metricsLoading ? 0.6 : 1,
                    }}
                >
                    <RefreshCw size={16} style={{ animation: metricsLoading ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh Metrics
                </button>
            </div>
            <div className="grid grid-cols-4 gap-lg" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <StatCard
                    label="Active Streams"
                    value={stats.activeStreamsCount}
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

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-md">
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(0, 217, 255, 0.05)', border: '1px solid var(--color-primary)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Car size={18} /> Fleet Status
                    </h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {assets.filter(a => a.type === 'car' && a.status === 'active').length} vehicles active, {assets.filter(a => a.type === 'car' && a.status === 'frozen').length} frozen
                    </p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--color-success)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Home size={18} /> Properties
                    </h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {assets.filter(a => a.type === 'real_estate' && a.status === 'active').length} with active streams, {assets.filter(a => a.type === 'real_estate' && a.status === 'idle').length} idle
                    </p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--color-warning)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-xs)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <Wrench size={18} /> Machinery
                    </h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        {assets.filter(a => a.type === 'machinery').length} units deployed
                    </p>
                </div>
            </div>

            {/* Analytics Export Section */}
            <div style={{ marginTop: 'var(--spacing-2xl)' }}>
                <AnalyticsExport />
            </div>
        </div>
    );
};
