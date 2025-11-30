import React, { useState } from 'react';
import type { AssetLocation } from '@/types/continuum'; // Corrected import path
import { Car, Home, Wrench, MapPin, Map } from 'lucide-react';

interface AssetMapProps {
    assets: AssetLocation[];
    onAssetClick?: (asset: AssetLocation) => void;
}

export const AssetMap: React.FC<AssetMapProps> = ({ assets, onAssetClick }) => {
    const [hoveredAsset, setHoveredAsset] = useState<string | null>(null);

    const latLngToPosition = (lat: number, lng: number) => {
        const latMin = 37.2;
        const latMax = 38.1;
        const lngMin = -122.7;
        const lngMax = -121.6;

        const x = ((lng - lngMin) / (lngMax - lngMin)) * 100;
        const y = ((latMax - lat) / (latMax - latMin)) * 100;

        return { x: `${Math.max(2, Math.min(98, x))}% `, y: `${Math.max(2, Math.min(98, y))}% ` };
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

    const getAssetMarker = (assetType: string) => {
        const iconSize = 20;
        const iconColor = 'white';
        switch (assetType) {
            case 'Vehicle': // Updated to match GodView.tsx
                return <Car size={iconSize} color={iconColor} />;
            case 'Real Estate': // Updated to match GodView.tsx
                return <Home size={iconSize} color={iconColor} />;
            case 'Heavy Machinery': // Updated to match GodView.tsx
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
                height: '600px',
                background: '#0f172a',
                borderRadius: 'var(--border-radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                overflow: 'hidden',
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)',
            }}
        >
            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.2,
                    backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 0%, #0f172a 100%)',
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: `
                        linear-gradient(rgba(56, 189, 248, 0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(56, 189, 248, 0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px',
                    opacity: 0.3,
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: '100%',
                    height: '100%',
                    transform: 'translate(-50%, -50%)',
                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(56, 189, 248, 0.1) 60deg, transparent 60deg)',
                    borderRadius: '50%',
                    animation: 'spin 10s linear infinite',
                    opacity: 0.1,
                    pointerEvents: 'none',
                }}
            />

            <div
                style={{
                    position: 'absolute',
                    top: 'var(--spacing-md)',
                    left: 'var(--spacing-md)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-primary)',
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    zIndex: 20,
                }}
            >
                <Map size={20} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
                <span style={{ fontWeight: 600, letterSpacing: '0.5px' }}>SAN FRANCISCO BAY AREA</span>
                <div style={{ fontSize: '10px', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    LIVE SATELLITE FEED • ACTIVE
                </div>
            </div>

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
                            zIndex: isHovered ? 30 : 10,
                        }}
                        onMouseEnter={() => setHoveredAsset(asset.id)}
                        onMouseLeave={() => setHoveredAsset(null)}
                        onClick={() => onAssetClick?.(asset)}
                    >
                        <div
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                                transition: 'transform 0.2s ease',
                            }}
                        >
                            <div
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50% 50% 50% 0',
                                    background: getStatusColor(asset.status),
                                    transform: 'rotate(-45deg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 4px 12px ${getStatusColor(asset.status)}66`,
                                    border: '2px solid white',
                                }}
                            >
                                <div style={{ transform: 'rotate(45deg)' }}>
                                    {getAssetMarker(asset.assetType)}
                                </div>
                            </div>
                            {asset.status === 'active' && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '50%',
                                        background: getStatusColor(asset.status),
                                        opacity: 0.5,
                                        animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
                                        zIndex: -1,
                                    }}
                                />
                            )}
                        </div>

                        {isHovered && (
                            <div
                                className="glass"
                                style={{
                                    position: 'absolute',
                                    left: '50%',
                                    bottom: '45px',
                                    transform: 'translateX(-50%)',
                                    padding: 'var(--spacing-md)',
                                    borderRadius: 'var(--border-radius-md)',
                                    whiteSpace: 'nowrap',
                                    fontSize: 'var(--font-size-sm)',
                                    pointerEvents: 'none',
                                    minWidth: '220px',
                                    background: 'rgba(15, 23, 42, 0.9)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                                    backdropFilter: 'blur(12px)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-xs)' }}>
                                    <div style={{
                                        padding: '6px',
                                        borderRadius: '8px',
                                        background: `${getStatusColor(asset.status)}22`,
                                        color: getStatusColor(asset.status)
                                    }}>
                                        {getAssetMarker(asset.assetType)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>{asset.title}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>ID: {asset.id}</div>
                                    </div>
                                </div>

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                                    <div>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>LOCATION</div>
                                        <div>{asset.location.city}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>STATUS</div>
                                        <div style={{ color: getStatusColor(asset.status), fontWeight: 600, textTransform: 'uppercase' }}>
                                            {asset.status}
                                        </div>
                                    </div>
                                    {asset.streamId && (
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '10px' }}>YIELD GENERATED</div>
                                            <div style={{ color: 'var(--color-success)', fontWeight: 600 }}>
                                                ${asset.totalEarned.toLocaleString()}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            <div
                style={{
                    position: 'absolute',
                    bottom: 'var(--spacing-md)',
                    right: 'var(--spacing-md)',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(8px)',
                    borderRadius: 'var(--border-radius-md)',
                    fontSize: 'var(--font-size-xs)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
                        <span style={{ color: '#e2e8f0' }}>Active</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 8px #ef4444' }} />
                        <span style={{ color: '#e2e8f0' }}>Frozen</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6b7280' }} />
                        <span style={{ color: '#e2e8f0' }}>Idle</span>
                    </div>
                </div>
            </div>

            <style>
                {`
                    @keyframes spin {
                        from { transform: translate(-50%, -50%) rotate(0deg); }
                        to { transform: translate(-50%, -50%) rotate(360deg); }
                    }
                    @keyframes ping {
                        75%, 100% { transform: scale(2); opacity: 0; }
                    }
                `}
            </style>
        </div>
    );
};