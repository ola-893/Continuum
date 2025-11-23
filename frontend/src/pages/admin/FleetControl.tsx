import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Lock, Car, Home, Wrench, MapPin, Rocket } from 'lucide-react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { AssetLocation } from '../../types/continuum';
import { formatCurrency } from '../../utils/formatting';
import { ContinuumService } from '../../services/continuumService';
import { LoadingScreen } from '../../components/ui/LoadingScreen';

export const FleetControl: React.FC = () => {
    const { signAndSubmitTransaction } = useWallet();
    const [selectedAsset, setSelectedAsset] = useState<AssetLocation | null>(null);
    const [showFreezeModal, setShowFreezeModal] = useState(false);
    const [assets, setAssets] = useState<AssetLocation[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch real assets from blockchain
    useEffect(() => {
        const fetchRealAssets = async () => {
            setLoading(true);
            try {
                const tokens = await ContinuumService.getAllRegisteredTokens();
                console.log('Fetched tokens for fleet control:', tokens);

                const transformedAssets: AssetLocation[] = await Promise.all(
                    tokens.map(async (token: any, index: number) => {
                        const tokenAddress = token.token_address || token.tokenAddress;
                        const streamId = Number(token.stream_id || token.streamId);
                        const assetType = token.asset_type !== undefined ? Number(token.asset_type) : (token.assetType !== undefined ? Number(token.assetType) : undefined);

                        let streamInfo = null;
                        let streamStatus = null;
                        if (streamId) {
                            try {
                                streamInfo = await ContinuumService.getStreamInfo(streamId);
                                streamStatus = await ContinuumService.getStreamStatus(streamId);
                            } catch (error) {
                                console.warn(`Failed to fetch stream info for stream ${streamId}:`, error);
                            }
                        }

                        const typeMap: Record<number, 'real_estate' | 'car' | 'machinery'> = {
                            0: 'real_estate',
                            1: 'car',
                            2: 'machinery',
                        };

                        const getAssetTypeOrDefault = (type: number | undefined): 'real_estate' | 'car' | 'machinery' => {
                            if (type === undefined) return 'machinery'; // Unknown assets default to machinery
                            return typeMap[type] || 'machinery';
                        };

                        return {
                            id: `TOKEN-${index + 1}`,
                            type: getAssetTypeOrDefault(assetType),
                            name: `Asset #${index + 1}`,
                            tokenAddress,
                            status: streamStatus?.isFrozen ? 'frozen' : streamInfo ? 'active' : 'idle',
                            location: {
                                lat: 37.7749 + (Math.random() - 0.5) * 0.5,
                                lng: -122.4194 + (Math.random() - 0.5) * 0.5,
                                city: 'San Francisco Bay Area',
                            },
                            streamId: streamId || undefined,
                            currentValue: streamInfo ? Number(streamInfo.totalAmount) : 0,
                            yieldRate: streamInfo ? Number(streamInfo.flowRate) : 0,
                            totalEarned: streamInfo ? Number(streamInfo.amountWithdrawn) : 0,
                            lastUpdate: Date.now(),
                        };
                    })
                );

                setAssets(transformedAssets);
            } catch (error) {
                console.error('Error fetching real assets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRealAssets();
    }, []);


    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'active':
                return 'success';
            case 'frozen':
                return 'error';
            case 'idle':
                return 'warning';
            default:
                return 'info';
        }
    };

    const getAssetIcon = (type: string) => {
        const iconSize = 20;
        switch (type) {
            case 'car':
                return <Car size={iconSize} />;
            case 'real_estate':
                return <Home size={iconSize} />;
            case 'machinery':
                return <Wrench size={iconSize} />;
            default:
                return <MapPin size={iconSize} />;
        }
    };

    const handleFreeze = async () => {
        if (!selectedAsset || !selectedAsset.streamId) {
            alert('Cannot freeze: stream ID not found');
            return;
        }

        try {
            setShowFreezeModal(false);

            // Call the real blockchain freeze function
            const transaction = ContinuumService.freezeAsset(
                selectedAsset.streamId,
                'Frozen by admin via Command Center'
            );

            await signAndSubmitTransaction(transaction);
            alert(`Success: Asset ${selectedAsset.name} has been frozen on-chain!`);
            setSelectedAsset(null);

            // In production, refresh asset list here
        } catch (error) {
            console.error('Freeze failed:', error);
            alert('Error: Failed to freeze asset. Check console for details.');
        }
    };

    if (loading) {
        return <LoadingScreen message="Loading fleet from blockchain..." />;
    }

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Fleet Control</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Monitor all assets and execute emergency actions ({assets.length} asset{assets.length !== 1 ? 's' : ''} registered)
                </p>
            </div>

            {assets.length === 0 ? (
                <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
                    <Rocket size={48} style={{ margin: '0 auto var(--spacing-md)', opacity: 0.3 }} />
                    <h3 style={{ marginBottom: 'var(--spacing-sm)' }}>No Assets Registered</h3>
                    <p style={{ color: 'var(--color-text-secondary)' }}>
                        Assets will appear here once they are registered in the token registry
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-lg">
                    {/* Asset List */}
                    <div className="col-span-2">
                        <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>All Assets</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                {assets.map((asset) => (
                                    <div
                                        key={asset.id}
                                        className="card"
                                        style={{
                                            padding: 'var(--spacing-md)',
                                            background: selectedAsset?.id === asset.id ? 'rgba(0, 217, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
                                            border: selectedAsset?.id === asset.id ? '1px solid var(--color-primary)' : '1px solid rgba(255, 255, 255, 0.05)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                        onClick={() => setSelectedAsset(asset)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                                <span style={{ fontSize: '24px' }}>{getAssetIcon(asset.type)}</span>
                                                <div>
                                                    <p style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                                                        {asset.name}
                                                    </p>
                                                    <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                                        {asset.location.city}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={getStatusBadgeVariant(asset.status) as any}>
                                                {asset.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Detail Panel */}
                    <div>
                        {selectedAsset ? (
                            <div className="card" style={{ padding: 'var(--spacing-lg)', position: 'sticky', top: 'var(--spacing-2xl)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-lg)' }}>
                                    <h3>{selectedAsset.name}</h3>
                                    <button
                                        onClick={() => setSelectedAsset(null)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--color-text-secondary)',
                                            cursor: 'pointer',
                                            padding: 'var(--spacing-xs)',
                                        }}
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        Location
                                    </p>
                                    <p style={{ fontWeight: 600 }}>{selectedAsset.location.city}</p>
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                        Asset Value
                                    </p>
                                    <p style={{ fontWeight: 600 }}>{formatCurrency(selectedAsset.currentValue, 0)}</p>
                                </div>

                                {selectedAsset.streamId && (
                                    <>
                                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                                Stream Status
                                            </p>
                                            <Badge variant={selectedAsset.status === 'active' ? 'success' : 'error'}>
                                                {selectedAsset.status === 'active' ? 'Streaming' : 'Frozen'}
                                            </Badge>
                                        </div>

                                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                                Total Earned
                                            </p>
                                            <p style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                                                {formatCurrency(selectedAsset.totalEarned, 2)}
                                            </p>
                                        </div>
                                    </>
                                )}

                                {/* Emergency Zone */}
                                {selectedAsset.status === 'active' && (
                                    <div
                                        className="emergency-zone"
                                        style={{
                                            marginTop: 'var(--spacing-xl)',
                                            padding: 'var(--spacing-md)',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '2px solid #ef4444',
                                            borderRadius: 'var(--border-radius-md)',
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)' }}>
                                            <AlertTriangle size={18} style={{ color: '#ef4444' }} />
                                            <strong style={{ color: '#ef4444' }}>Emergency Controls</strong>
                                        </div>
                                        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                                            Stop the payment stream and disable this asset immediately
                                        </p>
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowFreezeModal(true)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                border: '1px solid #ef4444',
                                                color: '#ef4444',
                                            }}
                                        >
                                            FREEZE ASSET
                                        </Button>
                                    </div>
                                )}

                                {selectedAsset.status === 'frozen' && (
                                    <div
                                        className="card"
                                        style={{
                                            marginTop: 'var(--spacing-xl)',
                                            padding: 'var(--spacing-md)',
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid #ef4444',
                                        }}
                                    >
                                        <p style={{ color: '#ef4444', fontSize: 'var(--font-size-sm)' }}>
                                            <Lock size={16} style={{ display: 'inline', marginRight: '4px' }} />
                                            This asset is currently frozen
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                <p>Select an asset to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Freeze Confirmation Modal */}
            {showFreezeModal && selectedAsset && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0, 0, 0, 0.8)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                    }}
                    onClick={() => setShowFreezeModal(false)}
                >
                    <div
                        className="card"
                        style={{
                            maxWidth: '500px',
                            padding: 'var(--spacing-2xl)',
                            border: '2px solid #ef4444',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                            <AlertTriangle size={32} style={{ color: '#ef4444' }} />
                            <h2 style={{ color: '#ef4444' }}>Emergency Freeze</h2>
                        </div>

                        <p style={{ marginBottom: 'var(--spacing-md)' }}>
                            Are you sure you want to freeze <strong>{selectedAsset.name}</strong>?
                        </p>

                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                            This will:
                        </p>
                        <ul style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)', paddingLeft: 'var(--spacing-lg)' }}>
                            <li>Stop the payment stream immediately</li>
                            <li>Disable the vehicle/asset</li>
                            <li>Freeze all investor withdrawals</li>
                        </ul>

                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <Button
                                variant="ghost"
                                onClick={() => setShowFreezeModal(false)}
                                style={{ flex: 1 }}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleFreeze}
                                style={{
                                    flex: 1,
                                    background: '#ef4444',
                                    borderColor: '#ef4444',
                                }}
                            >
                                Confirm Freeze
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
