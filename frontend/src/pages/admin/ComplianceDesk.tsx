import React, { useState } from 'react';
import { CheckCircle, XCircle, Search, Users, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useTezosWallet } from '../../hooks/useTezosWallet';
import * as TezosContract from '../../services/tezosContractService';
import { truncateAddress } from '../../utils/formatting';

// Mock pending KYC requests (in production, this would come from an API/indexer)
const mockPendingKYCRequests = [
    {
        address: 'tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb',
        jurisdiction: 'US',
        verificationLevel: 1,
        riskScore: 'low' as const,
        requestedAt: Date.now() - 86400000,
    },
    {
        address: 'tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6',
        jurisdiction: 'UK',
        verificationLevel: 2,
        riskScore: 'medium' as const,
        requestedAt: Date.now() - 172800000,
    },
];

export const ComplianceDesk: React.FC = () => {
    const { isConnected } = useTezosWallet();
    const [pendingRequests, setPendingRequests] = useState(mockPendingKYCRequests);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedAssetTypes, setSelectedAssetTypes] = useState<number[]>([
        TezosContract.AssetType.REAL_ESTATE,
    ]);

    // Batch whitelist state
    const [batchAddresses, setBatchAddresses] = useState<string>('');
    const [batchAssetTypes, setBatchAssetTypes] = useState<number[]>([
        TezosContract.AssetType.REAL_ESTATE,
    ]);
    const [batchProcessing, setBatchProcessing] = useState(false);
    const [showBatchSection, setShowBatchSection] = useState(false);

    const handleApprove = async (address: string, jurisdiction: string, verificationLevel: number) => {
        setProcessing(address);
        try {
            // Step 1: Register identity
            const expiryDate = new Date();
            expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year expiry

            const registerOpHash = await TezosContract.registerIdentity({
                user: address,
                jurisdiction,
                verificationLevel,
                expiryTime: expiryDate,
            });

            console.log('Identity registered:', registerOpHash);

            // Step 2: Whitelist for selected asset types
            const whitelistOpHash = await TezosContract.whitelistAddress(
                address,
                selectedAssetTypes
            );

            console.log('Address whitelisted:', whitelistOpHash);

            // Remove from pending
            setPendingRequests(prev => prev.filter(req => req.address !== address));
            alert(`Success: User ${truncateAddress(address)} approved and whitelisted!`);
        } catch (error) {
            console.error('Approval failed:', error);
            alert(`Error: Failed to approve user - ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = (address: string) => {
        if (confirm(`Reject KYC request for ${truncateAddress(address)}?`)) {
            setPendingRequests(prev => prev.filter(req => req.address !== address));
        }
    };

    const getRiskColor = (score: string) => {
        switch (score) {
            case 'low':
                return 'success';
            case 'medium':
                return 'warning';
            case 'high':
                return 'error';
            default:
                return 'info';
        }
    };

    const toggleAssetType = (assetType: number) => {
        setSelectedAssetTypes(prev =>
            prev.includes(assetType)
                ? prev.filter(t => t !== assetType)
                : [...prev, assetType]
        );
    };

    const toggleBatchAssetType = (assetType: number) => {
        setBatchAssetTypes(prev =>
            prev.includes(assetType)
                ? prev.filter(t => t !== assetType)
                : [...prev, assetType]
        );
    };

    const handleBatchWhitelist = async () => {
        if (!batchAddresses.trim()) {
            alert('Please enter at least one address');
            return;
        }

        if (batchAssetTypes.length === 0) {
            alert('Please select at least one asset type');
            return;
        }

        // Parse addresses (one per line or comma-separated)
        const addresses = batchAddresses
            .split(/[\n,]/)
            .map(addr => addr.trim())
            .filter(addr => addr.length > 0);

        if (addresses.length === 0) {
            alert('No valid addresses found');
            return;
        }

        // Validate addresses
        const invalidAddresses = addresses.filter(addr => !addr.startsWith('tz') && !addr.startsWith('KT'));
        if (invalidAddresses.length > 0) {
            alert(`Invalid addresses found: ${invalidAddresses.join(', ')}`);
            return;
        }

        setBatchProcessing(true);
        try {
            const opHash = await TezosContract.batchWhitelist(addresses, batchAssetTypes);
            console.log('Batch whitelist operation:', opHash);
            
            alert(
                `Success! Whitelisted ${addresses.length} address(es) for ${batchAssetTypes.length} asset type(s).\n\n` +
                `Operation Hash: ${opHash}\n\n` +
                `Addresses: ${addresses.map(a => truncateAddress(a)).join(', ')}`
            );

            // Clear form
            setBatchAddresses('');
            setShowBatchSection(false);
        } catch (error) {
            console.error('Batch whitelist failed:', error);
            alert(`Error: Failed to batch whitelist - ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
            setBatchProcessing(false);
        }
    };

    const clearBatchForm = () => {
        setBatchAddresses('');
        setBatchAssetTypes([TezosContract.AssetType.REAL_ESTATE]);
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Compliance Desk</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Review and approve KYC requests for ecosystem access on Tezos
                </p>
            </div>

            {/* Asset Type Selection */}
            <div className="card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Whitelist Asset Types</h3>
                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                    Select which asset types to whitelist when approving KYC requests
                </p>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={selectedAssetTypes.includes(TezosContract.AssetType.REAL_ESTATE)}
                            onChange={() => toggleAssetType(TezosContract.AssetType.REAL_ESTATE)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span>Real Estate</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={selectedAssetTypes.includes(TezosContract.AssetType.VEHICLES)}
                            onChange={() => toggleAssetType(TezosContract.AssetType.VEHICLES)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span>Vehicles</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={selectedAssetTypes.includes(TezosContract.AssetType.COMMODITIES)}
                            onChange={() => toggleAssetType(TezosContract.AssetType.COMMODITIES)}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <span>Commodities</span>
                    </label>
                </div>
            </div>

            {/* Batch Whitelist Section */}
            <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-xl)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                    <div>
                        <h3 style={{ marginBottom: 'var(--spacing-xs)' }}>
                            <Users size={20} style={{ display: 'inline', marginRight: 'var(--spacing-xs)', verticalAlign: 'middle' }} />
                            Batch Whitelist
                        </h3>
                        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                            Whitelist multiple addresses at once for selected asset types
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={() => setShowBatchSection(!showBatchSection)}
                    >
                        {showBatchSection ? 'Hide' : 'Show'}
                    </Button>
                </div>

                {showBatchSection && (
                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                        {/* Asset Type Selection for Batch */}
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                                Select Asset Types
                            </label>
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={batchAssetTypes.includes(TezosContract.AssetType.REAL_ESTATE)}
                                        onChange={() => toggleBatchAssetType(TezosContract.AssetType.REAL_ESTATE)}
                                        style={{ width: '18px', height: '18px' }}
                                        disabled={batchProcessing}
                                    />
                                    <span>Real Estate</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={batchAssetTypes.includes(TezosContract.AssetType.VEHICLES)}
                                        onChange={() => toggleBatchAssetType(TezosContract.AssetType.VEHICLES)}
                                        style={{ width: '18px', height: '18px' }}
                                        disabled={batchProcessing}
                                    />
                                    <span>Vehicles</span>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={batchAssetTypes.includes(TezosContract.AssetType.COMMODITIES)}
                                        onChange={() => toggleBatchAssetType(TezosContract.AssetType.COMMODITIES)}
                                        style={{ width: '18px', height: '18px' }}
                                        disabled={batchProcessing}
                                    />
                                    <span>Commodities</span>
                                </label>
                            </div>
                        </div>

                        {/* Address Input */}
                        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                            <label style={{ display: 'block', marginBottom: 'var(--spacing-sm)', fontWeight: 600 }}>
                                Addresses to Whitelist
                            </label>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                                Enter one address per line or separate with commas
                            </p>
                            <textarea
                                className="input"
                                placeholder="tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb&#10;tz1aSkwEot3L2kmUvcoxzjMomb9mvBNuzFK6&#10;KT1..."
                                value={batchAddresses}
                                onChange={(e) => setBatchAddresses(e.target.value)}
                                disabled={batchProcessing}
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    fontFamily: 'monospace',
                                    fontSize: 'var(--font-size-sm)',
                                    resize: 'vertical',
                                }}
                            />
                            {batchAddresses && (
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-xs)' }}>
                                    {batchAddresses.split(/[\n,]/).filter(a => a.trim()).length} address(es) entered
                                </p>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <Button
                                variant="primary"
                                leftIcon={<CheckCircle size={16} />}
                                onClick={handleBatchWhitelist}
                                disabled={!isConnected || batchProcessing || !batchAddresses.trim() || batchAssetTypes.length === 0}
                                isLoading={batchProcessing}
                                style={{ flex: 1 }}
                            >
                                {batchProcessing ? 'Processing...' : 'Batch Whitelist'}
                            </Button>
                            <Button
                                variant="ghost"
                                leftIcon={<Trash2 size={16} />}
                                onClick={clearBatchForm}
                                disabled={batchProcessing}
                            >
                                Clear
                            </Button>
                        </div>

                        {!isConnected && (
                            <p style={{ 
                                fontSize: 'var(--font-size-sm)', 
                                color: 'var(--color-warning)', 
                                marginTop: 'var(--spacing-md)',
                                textAlign: 'center'
                            }}>
                                Please connect your wallet to use batch whitelist
                            </p>
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-xl">
                {/* Left Panel - Pending Requests */}
                <div>
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
                            Pending Requests ({pendingRequests.length})
                        </h3>

                        {pendingRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
                                <p>No pending requests</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                {pendingRequests.map((request) => (
                                    <div
                                        key={request.address}
                                        className="card"
                                        style={{ padding: 'var(--spacing-md)', background: 'rgba(255, 255, 255, 0.02)' }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 'var(--spacing-sm)' }}>
                                            <div>
                                                <p style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                                                    {truncateAddress(request.address)}
                                                </p>
                                                <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                                                    <Badge variant="info">{request.jurisdiction}</Badge>
                                                    <Badge variant={getRiskColor(request.riskScore) as any}>
                                                        {request.riskScore.toUpperCase()} RISK
                                                    </Badge>
                                                    <Badge variant="warning">Level {request.verificationLevel}</Badge>
                                                </div>
                                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                                    Requested {new Date(request.requestedAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-md)' }}>
                                            <Button
                                                variant="secondary"
                                                leftIcon={<CheckCircle size={16} />}
                                                onClick={() => handleApprove(request.address, request.jurisdiction, request.verificationLevel)}
                                                disabled={processing === request.address || !isConnected || selectedAssetTypes.length === 0}
                                                isLoading={processing === request.address}
                                                style={{ flex: 1 }}
                                            >
                                                Approve & Whitelist
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                leftIcon={<XCircle size={16} />}
                                                onClick={() => handleReject(request.address)}
                                                disabled={processing !== null}
                                                style={{ flex: 1 }}
                                            >
                                                Reject
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Active Whitelist */}
                <div>
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Active Whitelist</h3>

                        {/* Search */}
                        <div style={{ marginBottom: 'var(--spacing-lg)', position: 'relative' }}>
                            <Search
                                size={18}
                                style={{
                                    position: 'absolute',
                                    left: 'var(--spacing-sm)',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    color: 'var(--color-text-secondary)',
                                }}
                            />
                            <input
                                type="text"
                                className="input"
                                placeholder="Search by address..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ width: '100%', paddingLeft: 'var(--spacing-2xl)' }}
                            />
                        </div>

                        {/* Info */}
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
                            <p style={{ marginBottom: 'var(--spacing-sm)' }}>
                                {isConnected 
                                    ? 'Active whitelist requires indexer integration'
                                    : 'Connect wallet to view active whitelist'}
                            </p>
                            <p style={{ fontSize: 'var(--font-size-xs)' }}>
                                In production, this would query the compliance_guard contract storage via TzKT API
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
