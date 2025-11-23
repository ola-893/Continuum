import React, { useState } from 'react';
import type { AssetLocation } from '../../data/mockAdminData';
import { Car, Home, Wrench, MapPin, Map } from 'lucide-react';

interface AssetMapProps {
    assets: AssetLocation[];
    onAssetClick?: (asset: AssetLocation) => void;
}

export const AssetMap: React.FC<AssetMapProps> = ({ assets, onAssetClick }) => {
    const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

    // Convert lat/lng to map position (simplified)
    const latLngToPosition = (lat: number, lng: number) => {
        // SF Bay Area bounds: lat 37.3-38.0, lng -122.6 to -121.7
        const latMin = 37.2;
        const latMax = 38.1;
        const lngMin = -122.7;
        const lngMax = -121.6;

        const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
        const y = ((latMax - lat) / (latMax - latMin)) * 100;

        return { x: `${ Math.max(2, Math.min(98, x)) }% `, y: `${ Math.max(2, Math.min(98, y)) }% ` };
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return '#10b981'; // Green
            case 'frozen':
                return '#ef4444'; // Red
            case 'idle':
                return '#6b7280'; // Gray
            default:
                return '#6b7280';
        }
    };

    const getAssetMarker = (type: string) => {
        const iconSize = 20;
        const iconColor = 'white';
        switch (type) {
            case 'car':
                return <Car size={iconSize} color={iconColor} />;
            case 'real_estate':
                return <Home size={iconSize} color={iconColor} />;
            case 'machinery':
                return <Wrench size={iconSize} color={iconColor} />;
            default:
                return <MapPin size={iconSize} color={iconColor} />;
        }
    };

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                height: '500px',
                background: 'linear-gradient(135deg, #0a0e27 0%, #1a1027 100%)',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
            }}
        >
            {/* Grid overlay */}
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
linear - gradient(rgba(0, 217, 255, 0.1) 1px, transparent 1px),
    linear - gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)
        `,
                    backgroundSize: '50px 50px',
                    opacity: 0.3,
                }}
            />

            {/* Region label */}
            <div
                style={{
                    position: 'absolute',
                    top: 'var(--spacing-md)',
                    left: 'var(--spacing-md)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                }}
            >
                <Map size={20} style={{ display: 'inline', marginRight: '8px' }} />
                San Francisco Bay Area
            </div>

            {/* Asset dots */}
            {assets.map((asset) => {
                const pos = latLngToPosition(asset.location.lat, asset.location.lng);
                const isHovered = hoveredAsset === asset.id;

                return (
                    <div
                        key={asset.id}
                        className="asset-dot"
                        style={{
                            position: 'absolute',
                            left: pos.x,
                            top: pos.y,
                            transform: 'translate(-50%, -50%)',
                            cursor: 'pointer',
                            zIndex: isHovered ? 10 : 1,
                        }}
                        onMouseEnter={() => setHoveredAsset(asset.id)}
                        onMouseLeave={() => setHoveredAsset(null)}
                        onClick={() => onAssetClick?.(asset)}
                    >
                        {/* Dot */}
                        <div
                            className={`asset - dot ${ asset.status } `}
                            style={{
                                width: isHovered ? '16px' : '12px',
                                height: isHovered ? '16px' : '12px',
                                borderRadius: '50%',
                                background: getStatusColor(asset.status),
                                boxShadow: `0 0 ${ isHovered ? '30px' : '20px' } ${ getStatusColor(asset.status) } `,
                                animation: asset.status === 'active' ? 'pulse 2s infinite' : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        />

                        {/* Tooltip */}
                        {isHovered && (
                            <div
                                className="glass"
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    bottom: '20px',
                                    transform: 'translateX(-50%)',
                                    padding: 'var(--spacing-sm) var(--spacing-md)',
                                    borderRadius: 'var(--border-radius-md)',
                                    whiteSpace: 'nowrap',
                                    fontSize: 'var(--font-size-sm)',
                                    pointerEvents: 'none',
                                    minWidth: '200px',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                                    <span style={{ fontSize: '18px' }}>{getAssetIcon(asset.type)}</span>
                                    <strong>{asset.name}</strong>
                                </div>
                                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                    {asset.location.city}
                                </div>
                                {asset.streamId && (
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-success)', marginTop: 'var(--spacing-xs)' }}>
                                        Earned: ${asset.totalEarned.toLocaleString()}
                                    </div>
                                )}
                                <div
                                    style={{
                                        fontSize: 'var(--font-size-xs)',
                                        color: getStatusColor(asset.status),
                                        marginTop: 'var(--spacing-xs)',
                                        textTransform: 'uppercase',
                                        fontWeight: 600,
                                    }}
                                >
                                    {asset.status}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Legend */}
            <div
                style={{
                    position: 'absolute',
                    bottom: 'var(--spacing-md)',
                    right: 'var(--spacing-md)',
                    padding: 'var(--spacing-sm)',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                        <span>Active</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                        <span>Frozen</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6b7280' }} />
                        <span>Idle</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
