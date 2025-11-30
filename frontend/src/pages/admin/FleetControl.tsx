import React, { useState } from 'react';
import { AlertTriangle, X, Lock, Rocket } from 'lucide-react'; 
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatCurrency } from '../../utils/formatting';
import { ContinuumService } from '../../services/continuumService';
import { LoadingScreen } from '../../components/ui/LoadingScreen';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACT_CONFIG } from '../../config/contracts';
import { AssetData, useAssetList } from '../../hooks/useAssetList';
import { Car, Home, Wrench, MapPin } from 'lucide-react'; // Moved here for getAssetIcon

export const FleetControl: React.FC = () => {
    const { isConnected, address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [selectedAsset, setSelectedAsset] = useState<AssetData | null>(null);
    const [showFreezeModal, setShowFreezeModal] = useState(false);
    const { assets, loading, error } = useAssetList();
    const [txStatus, setTxStatus] = useState('');
    // Removed processing state as it's unused

    const getStatusBadgeVariant = (asset: AssetData): 'success' | 'warning' | 'error' | 'info' => {
        if (!asset.streamInfo) return 'warning'; 
        if (!asset.streamInfo.isActive) return 'error'; 
        return 'success'; 
    };

    const getAssetIcon = (assetType: string) => {
        const iconSize = 20;
        switch (assetType) {
            case 'Vehicle': return <Car size={iconSize} />;
            case 'Real Estate': return <Home size={iconSize} />;
            case 'Heavy Machinery': return <Wrench size={iconSize} />;
            default: return <MapPin size={iconSize} />;
        }
    };

    const handleFreeze = async () => {
        if (!selectedAsset || !selectedAsset.streamId) {
            alert('Cannot freeze: stream ID not found');
            return;
        }
        if (!isConnected || !address) {
            setTxStatus("Error: Please connect your wallet first.");
            return;
        }

        setTxStatus('Simulating freeze action...');
        try {
            setShowFreezeModal(false);
            await ContinuumService.freezeAsset(selectedAsset.streamId, 'Frozen by admin via Command Center (Simulated)');

            await writeContractAsync({
                address: CONTRACT_CONFIG.RWA_HUB_ADDRESS as `0x${string}`, 
                abi: CONTRACT_CONFIG.ABIS.RWAHub,
                functionName: 'owner', 
                args: [],
            });

            setTxStatus(`Success: Asset ${selectedAsset.title} frozen (simulated)!`);
            setSelectedAsset(null);
        } catch (error: any) {
            console.error('Freeze failed (simulated):', error);
            setTxStatus(`Error: ${error.message || "Simulated freeze failed"}`);
        } finally {
            setTimeout(() => setTxStatus(''), 5000);
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Fleet Control (EVM Simulated)</h1>
                <p className="text-secondary">
                    Monitor all assets and execute emergency actions ({assets.length} asset{assets.length !== 1 ? 's' : ''} registered). All actions are simulated for the EVM demo.
                </p>
            </div>

            {txStatus && <div className="card mb-xl p-md">{txStatus}</div>}

            {!isConnected ? (
                <div className="card text-center p-xl">
                    <h2 className="mb-md">Connect Your Wallet</h2>
                    <p className="text-secondary">Connect your wallet to manage assets in the fleet.</p>
                </div>
            ) : loading ? (
                <LoadingScreen message="Loading fleet from blockchain..." />
            ) : error ? (
                <div className="card text-center p-xl">
                    <h2 className="mb-md">Error Loading Assets</h2>
                    <p className="text-secondary">{error}</p>
                </div>
            ) : assets.length === 0 ? (
                <div className="card text-center p-xl">
                    <Rocket size={48} className="mx-auto mb-md opacity-30" />
                    <h3 className="mb-sm">No Assets Registered</h3>
                    <p className="text-secondary">Assets will appear here once they are registered in the token registry.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-lg">
                    <div className="col-span-2">
                        <div className="card p-lg">
                            <h3 className="mb-md">All Assets</h3>
                            <div className="flex flex-col gap-sm">
                                {assets.map((asset) => (
                                    <div
                                        key={asset.tokenId}
                                        className={`card p-md cursor-pointer transition-all ${selectedAsset?.tokenId === asset.tokenId ? 'bg-primary--muted border-primary' : 'bg-base-200'}`}
                                        onClick={() => setSelectedAsset(asset)}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-md">
                                                <span className="text-2xl">{getAssetIcon(asset.assetType)}</span>
                                                <div>
                                                    <p className="font-semibold mb-xs">{asset.title}</p>
                                                    <p className="text-xs text-secondary">{'San Francisco Bay Area'}</p> {/* Simplified */}
                                                </div>
                                            </div>
                                            <Badge variant={getStatusBadgeVariant(asset)}>{asset.streamInfo?.isActive ? "Active" : "Frozen"}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div>
                        {selectedAsset ? (
                            <div className="card p-lg sticky top-2xl">
                                <div className="flex justify-between items-start mb-lg">
                                    <h3>{selectedAsset.title}</h3>
                                    <button onClick={() => setSelectedAsset(null)} className="btn-ghost p-xs"><X size={20} /></button>
                                </div>
                                <div className="mb-lg">
                                    <p className="text-sm text-secondary mb-xs">Location</p>
                                    <p className="font-semibold">{'San Francisco Bay Area'}</p> {/* Simplified */}
                                </div>
                                <div className="mb-lg">
                                    <p className="text-sm text-secondary mb-xs">Asset Value</p>
                                    <p className="font-semibold">{formatCurrency(selectedAsset.streamInfo?.totalAmount || 0, 2)}</p>
                                </div>
                                {selectedAsset.streamId !== undefined && selectedAsset.streamId > 0 && (
                                    <>
                                        <div className="mb-lg">
                                            <p className="text-sm text-secondary mb-xs">Stream Status</p>
                                            <Badge variant={selectedAsset.streamInfo?.isActive ? 'success' : 'error'}>{selectedAsset.streamInfo?.isActive ? 'Streaming' : 'Frozen'}</Badge>
                                        </div>
                                        <div className="mb-lg">
                                            <p className="text-sm text-secondary mb-xs">Total Earned</p>
                                            <p className="font-semibold text-success">{formatCurrency(selectedAsset.streamInfo?.amountWithdrawn || 0, 2)}</p>
                                        </div>
                                    </>
                                )}
                                {selectedAsset.streamInfo?.isActive && (
                                    <div className="p-md bg-error-muted border-2 border-error rounded-md mt-xl">
                                        <div className="flex items-center gap-xs mb-sm">
                                            <AlertTriangle size={18} className="text-error" />
                                            <strong className="text-error">Emergency Controls</strong>
                                        </div>
                                        <p className="text-xs text-secondary mb-md">Stop the payment stream and disable this asset immediately</p>
                                        <Button variant="ghost" onClick={() => setShowFreezeModal(true)} className="w-full bg-error-muted border-error text-error">
                                            FREEZE ASSET (Sim)
                                        </Button>
                                    </div>
                                )}
                                {!selectedAsset.streamInfo?.isActive && (
                                    <div className="p-md bg-error-muted border border-error rounded-md mt-xl">
                                        <p className="text-sm text-error"><Lock size={16} className="inline mr-2" />This asset is currently frozen (Simulated)</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="card p-xl text-center text-secondary">
                                <p>Select an asset to view details</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {showFreezeModal && selectedAsset && (
                <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowFreezeModal(false)}>
                    <div className="card max-w-md p-2xl border-2 border-error" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-md mb-lg">
                            <AlertTriangle size={32} className="text-error" />
                            <h2 className="text-error">Emergency Freeze (Simulated)</h2>
                        </div>
                        <p className="mb-md">Are you sure you want to freeze <strong>{selectedAsset.title}</strong>? This is a simulated action.</p>
                        <p className="text-sm text-secondary mb-xl">This simulated action will stop the payment stream.</p>
                        <div className="flex gap-md">
                            <Button variant="ghost" onClick={() => setShowFreezeModal(false)} className="flex-1">Cancel</Button>
                            <Button variant="primary" onClick={handleFreeze} className="flex-1 bg-error border-error">Confirm Freeze (Sim)</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};