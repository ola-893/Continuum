import React, { useState } from 'react';
import { CheckCircle, XCircle, Search } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { pendingKYCRequests } from '../../data/mockAdminData';
import { ContinuumService } from '../../services/continuumService';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { truncateAddress } from '../../utils/formatting';

export const ComplianceDesk: React.FC = () => {
    const { signAndSubmitTransaction } = useWallet();
    const [pendingRequests, setPendingRequests] = useState(pendingKYCRequests);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    const handleApprove = async (address: string, jurisdiction: string, verificationLevel: number) => {
        setProcessing(address);
        try {
            const transaction = ContinuumService.registerKYC(address, jurisdiction, verificationLevel);
            await signAndSubmitTransaction(transaction);

            // Remove from pending
            setPendingRequests(prev => prev.filter(req => req.address !== address));
            alert(`✅ User ${truncateAddress(address)} approved!`);
        } catch (error) {
            console.error('Approval failed:', error);
            alert('❌ Failed to approve user');
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

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Compliance Desk</h1>
                <p style={{ color: 'var(--color-text-secondary)' }}>
                    Review and approve KYC requests for ecosystem access
                </p>
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
                                                disabled={processing === request.address}
                                                isLoading={processing === request.address}
                                                style={{ flex: 1 }}
                                            >
                                                Approve
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

                        {/* Table */}
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', fontSize: 'var(--font-size-sm)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                                            Address
                                        </th>
                                        <th style={{ padding: 'var(--spacing-sm)', textAlign: 'left', color: 'var(--color-text-secondary)' }}>
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <td style={{ padding: 'var(--spacing-sm)' }}>
                                            {truncateAddress(CONTRACT_CONFIG.MODULE_ADDRESS)}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm)' }}>
                                            <Badge variant="success">Admin</Badge>
                                        </td>
                                    </tr>
                                    <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <td colSpan={2} style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                                            Connect to blockchain to view active whitelist
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Import needed at top
import { CONTRACT_CONFIG } from '../../config/contracts';
