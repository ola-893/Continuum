import React, { useState } from 'react';
import { CheckCircle, XCircle, Search, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ContinuumService } from '../../services/continuumService';
import { useAccount, useWriteContract } from 'wagmi';
import { CONTRACT_CONFIG } from '../../config/contracts';
import { truncateAddress } from '../../utils/formatting';

// Mock data for pending requests (for demonstration purposes)
const MOCK_PENDING_REQUESTS = [
    { address: "0x70997970C51812dc3A01088e6d530de32a4e0a", jurisdiction: "US", riskScore: "medium", verificationLevel: 1, requestedAt: Date.now() - 86400000 },
    { address: "0x3C44CdDdB6a900fa2b585dd299e03d12fa4293", jurisdiction: "EU", riskScore: "low", verificationLevel: 2, requestedAt: Date.now() - 172800000 },
];

export const ComplianceDesk: React.FC = () => {
    const { isConnected, address } = useAccount();
    const { writeContractAsync } = useWriteContract();
    const [pendingRequests, setPendingRequests] = useState(MOCK_PENDING_REQUESTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);
    const [txStatus, setTxStatus] = useState('');

    const handleApprove = async (userAddr: string, jurisdiction: string, verificationLevel: number) => {
        if (!isConnected || !address) {
            setTxStatus("Error: Please connect your wallet first.");
            return;
        }

        setProcessing(userAddr);
        setTxStatus('Simulating approval...');

        try {
            // Call the placeholder service function for identity registration
            await ContinuumService.registerIdentity(userAddr, jurisdiction, verificationLevel);
            
            // Call the placeholder service function for whitelisting (assuming asset types 0, 1, 2 for demo)
            await ContinuumService.whitelistUser(userAddr, [0, 1, 2]);

            // Simulate a transaction confirmation
            await writeContractAsync({
                address: CONTRACT_CONFIG.RWA_HUB_ADDRESS as `0x${string}`, 
                abi: CONTRACT_CONFIG.ABIS.RWAHub,
                functionName: 'owner', 
                args: [],
            });

            setPendingRequests(prev => prev.filter(req => req.address !== userAddr));
            setTxStatus(`Success: User ${truncateAddress(userAddr)} approved and whitelisted (simulated)!`);
            setTimeout(() => setTxStatus(''), 3000);
        } catch (error: any) {
            console.error('Approval failed (simulated):', error);
            setTxStatus(`Error: ${error.message || "Simulated approval failed"}`);
            setTimeout(() => setTxStatus(''), 5000);
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = (userAddr: string) => {
        if (confirm(`Reject KYC request for ${truncateAddress(userAddr)}? This is a simulated action.`)) {
            setPendingRequests(prev => prev.filter(req => req.address !== userAddr));
            setTxStatus(`User ${truncateAddress(userAddr)} request rejected (simulated).`);
            setTimeout(() => setTxStatus(''), 3000);
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)' }}>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1 style={{ marginBottom: 'var(--spacing-sm)' }}>Compliance Desk (EVM Simulated)</h1>
                <p className="text-secondary">Review and approve KYC requests for ecosystem access. All actions are simulated for the EVM demo.</p>
            </div>

            {txStatus && <div className="card mb-xl p-md">{txStatus}</div>}

            <div className="grid grid-cols-2 gap-xl">
                {/* Left Panel - Pending Requests */}
                <div>
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>
                            Pending Requests ({pendingRequests.length})
                        </h3>

                        {pendingRequests.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-secondary)' }}>
                                <p>No pending requests (all actions simulated)</p>
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
                                                    <Badge variant={request.riskScore === 'low' ? 'success' : request.riskScore === 'medium' ? 'warning' : 'error'}>
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
                                                leftIcon={processing === request.address ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                                onClick={() => handleApprove(request.address, request.jurisdiction, request.verificationLevel)}
                                                disabled={processing !== null || !isConnected}
                                                isLoading={processing === request.address}
                                                style={{ flex: 1 }}
                                            >
                                                {processing === request.address ? 'Approving...' : 'Approve (Sim)'}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                leftIcon={<XCircle size={16} />}
                                                onClick={() => handleReject(request.address)}
                                                disabled={processing !== null || !isConnected}
                                                style={{ flex: 1 }}
                                            >
                                                Reject (Sim)
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel - Active Whitelist (Simulated) */}
                <div>
                    <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
                        <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Active Whitelist (Simulated)</h3>
                        <p className="text-secondary mb-lg">This list is simulated. Real data would come from a ComplianceGuard contract.</p>

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
                                    <tr>
                                        <td style={{ padding: 'var(--spacing-sm)' }}>
                                            {truncateAddress(address || "0x0")}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm)' }}>
                                            <Badge variant="success">Connected User (Simulated)</Badge>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ padding: 'var(--spacing-sm)' }}>
                                            {truncateAddress(CONTRACT_CONFIG.RWA_HUB_ADDRESS)}
                                        </td>
                                        <td style={{ padding: 'var(--spacing-sm)' }}>
                                            <Badge variant="info">RWA Hub (Contract)</Badge>
                                        </td>
                                    </tr>
                                    {MOCK_PENDING_REQUESTS.filter(req => !pendingRequests.includes(req)).map((req, index) => (
                                        <tr key={index}>
                                            <td style={{ padding: 'var(--spacing-sm)' }}>{truncateAddress(req.address)}</td>
                                            <td style={{ padding: 'var(--spacing-sm)' }}><Badge variant="success">Whitelisted (Sim)</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComplianceDesk;