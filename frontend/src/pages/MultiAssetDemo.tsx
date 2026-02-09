import React, { useState } from 'react';
import { MultiAssetStreamDisplay, useMultiAssetStreams, type AssetStreamData } from '../components/ui/MultiAssetStreamDisplay';
import { Button } from '../components/ui/Button';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

/**
 * Demo page showcasing multi-asset stream handling capabilities
 * Demonstrates:
 * - Multiple assets with different streams updating independently
 * - Different token types (USDT, APT, USDC)
 * - Filtering by asset type and token type
 * - Sorting by balance
 * - Grid and list layouts
 */
export const MultiAssetDemo: React.FC = () => {
    const [layout, setLayout] = useState<'grid' | 'list'>('grid');
    const [showDetails, setShowDetails] = useState(false);
    const [filterType, setFilterType] = useState<string | null>(null);

    // Mock data with different token types and asset types
    const mockAssets: AssetStreamData[] = [
        {
            tokenAddress: '0x1234...5678',
            assetType: 'Real Estate',
            title: 'Luxury Apartment NYC',
            imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
            streamInfo: {
                sender: '0xsender1...abc',
                recipient: '0xrecipient1...def',
                startTime: Math.floor(Date.now() / 1000) - 86400 * 30, // Started 30 days ago
                flowRate: 0.0001157, // ~10 USDT per day
                amountWithdrawn: 150,
                totalAmount: 3650,
                stopTime: Math.floor(Date.now() / 1000) + 86400 * 335, // 335 days remaining
                status: 0, // active
            },
            tokenSymbol: 'USDT',
            tokenDecimals: 6,
        },
        {
            tokenAddress: '0xabcd...ef01',
            assetType: 'Vehicle',
            title: 'Tesla Model S 2023',
            imageUrl: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400',
            streamInfo: {
                sender: '0xsender2...abc',
                recipient: '0xrecipient2...def',
                startTime: Math.floor(Date.now() / 1000) - 86400 * 15, // Started 15 days ago
                flowRate: 0.00005787, // ~5 APT per day
                amountWithdrawn: 45,
                totalAmount: 1825,
                stopTime: Math.floor(Date.now() / 1000) + 86400 * 350, // 350 days remaining
                status: 0, // active
            },
            tokenSymbol: 'APT',
            tokenDecimals: 8,
        },
        {
            tokenAddress: '0x9876...5432',
            assetType: 'Commodities',
            title: 'Gold Vault Storage',
            imageUrl: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400',
            streamInfo: {
                sender: '0xsender3...abc',
                recipient: '0xrecipient3...def',
                startTime: Math.floor(Date.now() / 1000) - 86400 * 60, // Started 60 days ago
                flowRate: 0.0002315, // ~20 USDC per day
                amountWithdrawn: 800,
                totalAmount: 7300,
                stopTime: Math.floor(Date.now() / 1000) + 86400 * 305, // 305 days remaining
                status: 0, // active
            },
            tokenSymbol: 'USDC',
            tokenDecimals: 6,
        },
        {
            tokenAddress: '0x2468...1357',
            assetType: 'Real Estate',
            title: 'Commercial Office Space',
            imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=400',
            streamInfo: {
                sender: '0xsender4...abc',
                recipient: '0xrecipient4...def',
                startTime: Math.floor(Date.now() / 1000) - 86400 * 45, // Started 45 days ago
                flowRate: 0.0003472, // ~30 USDT per day
                amountWithdrawn: 1200,
                totalAmount: 10950,
                stopTime: Math.floor(Date.now() / 1000) + 86400 * 320, // 320 days remaining
                status: 0, // active
            },
            tokenSymbol: 'USDT',
            tokenDecimals: 6,
        },
        {
            tokenAddress: '0x1357...2468',
            assetType: 'Vehicle',
            title: 'Lamborghini Aventador',
            imageUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=400',
            streamInfo: {
                sender: '0xsender5...abc',
                recipient: '0xrecipient5...def',
                startTime: Math.floor(Date.now() / 1000) - 86400 * 7, // Started 7 days ago
                flowRate: 0.00011574, // ~10 APT per day
                amountWithdrawn: 50,
                totalAmount: 3650,
                stopTime: Math.floor(Date.now() / 1000) + 86400 * 358, // 358 days remaining
                status: 0, // active
            },
            tokenSymbol: 'APT',
            tokenDecimals: 8,
        },
        {
            tokenAddress: '0xfed...cba',
            assetType: 'Commodities',
            title: 'Silver Bullion Reserve',
            imageUrl: 'https://images.unsplash.com/photo-1610375461369-d613b564f6c4?w=400',
            streamInfo: {
                sender: '0xsender6...abc',
                recipient: '0xrecipient6...def',
                startTime: Math.floor(Date.now() / 1000) - 86400 * 90, // Started 90 days ago
                flowRate: 0.00008102, // ~7 USDC per day
                amountWithdrawn: 500,
                totalAmount: 2555,
                stopTime: Math.floor(Date.now() / 1000) + 86400 * 275, // 275 days remaining
                status: 0, // active
            },
            tokenSymbol: 'USDC',
            tokenDecimals: 6,
        },
    ];

    // Apply filters
    const filteredAssets = filterType
        ? mockAssets.filter((asset) => asset.assetType === filterType)
        : mockAssets;

    // Use multi-asset utilities
    const { activeCount } = useMultiAssetStreams(filteredAssets);

    return (
        <div style={{ padding: 'var(--spacing-2xl)', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>
                    Multi-Asset Stream Demo
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
                    Demonstrating real-time balance updates for multiple assets with different token types
                </p>

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-lg" style={{ marginBottom: 'var(--spacing-xl)' }}>
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                            <Activity size={20} style={{ color: 'var(--color-primary)' }} />
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                Total Assets
                            </span>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>
                            {filteredAssets.length}
                        </div>
                    </div>

                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                            <TrendingUp size={20} style={{ color: 'var(--color-success)' }} />
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                Active Streams
                            </span>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-success)' }}>
                            {activeCount}
                        </div>
                    </div>

                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                            <DollarSign size={20} style={{ color: 'var(--color-warning)' }} />
                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                Token Types
                            </span>
                        </div>
                        <div style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700 }}>
                            3
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                            USDT, APT, USDC
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--spacing-md)' }}>
                    {/* Asset Type Filters */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                            Filter:
                        </span>
                        <Button
                            variant={filterType === null ? 'primary' : 'secondary'}
                            onClick={() => setFilterType(null)}
                            style={{ padding: 'var(--spacing-xs) var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}
                        >
                            All
                        </Button>
                        <Button
                            variant={filterType === 'Real Estate' ? 'primary' : 'secondary'}
                            onClick={() => setFilterType('Real Estate')}
                            style={{ padding: 'var(--spacing-xs) var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}
                        >
                            Real Estate
                        </Button>
                        <Button
                            variant={filterType === 'Vehicle' ? 'primary' : 'secondary'}
                            onClick={() => setFilterType('Vehicle')}
                            style={{ padding: 'var(--spacing-xs) var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}
                        >
                            Vehicles
                        </Button>
                        <Button
                            variant={filterType === 'Commodities' ? 'primary' : 'secondary'}
                            onClick={() => setFilterType('Commodities')}
                            style={{ padding: 'var(--spacing-xs) var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}
                        >
                            Commodities
                        </Button>
                    </div>

                    {/* View Controls */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', fontSize: 'var(--font-size-sm)' }}>
                            <input
                                type="checkbox"
                                checked={showDetails}
                                onChange={(e) => setShowDetails(e.target.checked)}
                            />
                            Show Details
                        </label>
                        <Button
                            variant={layout === 'grid' ? 'primary' : 'secondary'}
                            onClick={() => setLayout('grid')}
                            style={{ padding: 'var(--spacing-xs) var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}
                        >
                            Grid
                        </Button>
                        <Button
                            variant={layout === 'list' ? 'primary' : 'secondary'}
                            onClick={() => setLayout('list')}
                            style={{ padding: 'var(--spacing-xs) var(--spacing-md)', fontSize: 'var(--font-size-sm)' }}
                        >
                            List
                        </Button>
                    </div>
                </div>
            </div>

            {/* Multi-Asset Stream Display */}
            <MultiAssetStreamDisplay
                assets={filteredAssets}
                layout={layout}
                showDetails={showDetails}
            />

            {/* Info Card */}
            <div className="card" style={{ marginTop: 'var(--spacing-2xl)', padding: 'var(--spacing-lg)', background: 'rgba(0, 217, 255, 0.05)', border: '1px solid rgba(0, 217, 255, 0.2)' }}>
                <h4 style={{ marginBottom: 'var(--spacing-sm)' }}>
                    ✨ Multi-Asset Stream Features
                </h4>
                <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', paddingLeft: 'var(--spacing-lg)' }}>
                    <li>Each asset's balance updates independently every second</li>
                    <li>Supports multiple token types (USDT, APT, USDC) with different decimals</li>
                    <li>Filter by asset type to focus on specific categories</li>
                    <li>Switch between grid and list layouts for different viewing preferences</li>
                    <li>Toggle detailed stream information on demand</li>
                    <li>All calculations happen client-side for instant updates</li>
                </ul>
            </div>
        </div>
    );
};
