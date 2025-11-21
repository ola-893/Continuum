import React from 'react';
import { Activity, DollarSign, Zap, TrendingUp } from 'lucide-react';
import { StatCard } from '../../components/admin/StatCard';
import { AssetMap } from '../../components/admin/AssetMap';
import { mockAssets, globalStats } from '../../data/mockAdminData';
import { formatCurrency } from '../../utils/formatting';

export const GodView: React.FC = () => {
    const handleAssetClick = (asset: any) => {
        console.log('Asset clicked:', asset);
        // Can navigate to fleet control with this asset selected
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            {/* Top Stats Bar */}
            <div className="grid grid-cols-4 gap-lg" style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <StatCard
                    label="Active Streams"
                    value={globalStats.activeStreams}
                    glow={true}
                    icon={<Activity size={24} style={{ color: 'var(--color-success)' }} />}
                    trend="up"
                    trendValue="+3 this week"
                />
                <StatCard
                    label="Total Value Locked"
                    value={formatCurrency(globalStats.totalValueLocked, 0)}
                    icon={<DollarSign size={24} style={{ color: 'var(--color-primary)' }} />}
                />
                <StatCard
                    label="Yield Distributed"
                    value={formatCurrency(globalStats.totalYieldDistributed, 0)}
                    icon={<TrendingUp size={24} style={{ color: 'var(--color-secondary)' }} />}
                    trend="up"
                    trendValue="+12.5%"
                />
                <StatCard
                    label="IoT Uptime"
                    value={`${globalStats.iotUptime}%`}
                    glow={true}
                    icon={<Zap size={24} style={{ color: 'var(--color-success)' }} />}
                />
            </div>

            {/* Live Map */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                    <h2>Live Asset Monitor</h2>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                        Real-time tracking of all deployed assets across the Bay Area
                    </p>
                </div>
                <AssetMap assets={mockAssets} onAssetClick={handleAssetClick} />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-3 gap-md">
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(0, 217, 255, 0.05)', border: '1px solid var(--color-primary)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-xs)' }}>🚗 Fleet Status</h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        4 vehicles active, 1 frozen
                    </p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid var(--color-success)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-xs)' }}>🏢 Properties</h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        2 leased, 1 vacant
                    </p>
                </div>
                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--color-warning)' }}>
                    <h4 style={{ marginBottom: 'var(--spacing-xs)' }}>🚜 Machinery</h4>
                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                        2 units deployed
                    </p>
                </div>
            </div>
        </div>
    );
};
