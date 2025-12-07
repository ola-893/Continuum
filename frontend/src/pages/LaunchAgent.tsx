// frontend/src/pages/LaunchAgent.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { useAccount } from 'wagmi';
import { Button } from '../components/ui/Button';
import { ExternalLink, RefreshCw, Shield, Database, Zap, Info } from 'lucide-react';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { ToastContainer } from '../components/ui/ToastContainer';
import { useToast } from '../hooks/useToast';
import { BlockchainBadge } from '../components/ui/BlockchainBadge';
import { Tooltip } from '../components/ui/Tooltip';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const BSC_TESTNET_EXPLORER = 'https://testnet.bscscan.com';

interface LaunchResult {
    success: boolean;
    agentName: string;
    agentTicker: string;
    unibaseId: string;
    transactionHash: string;
    walletAddress: string;
    status: string;
    message: string;
}

interface AgentStatus {
    success: boolean;
    agentId: string;
    status: string;
    registered: boolean;
    walletAddress: string;
    memoryHubConnected: boolean;
}

export const LaunchAgent: React.FC = () => {
    const { address: userAddress } = useAccount();
    const [agentName, setAgentName] = useState('');
    const [agentTicker, setAgentTicker] = useState('');
    const [status, setStatus] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [launchResult, setLaunchResult] = useState<LaunchResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
    const [isLoadingStatus, setIsLoadingStatus] = useState(false);
    const [statusError, setStatusError] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [estimatedTime, setEstimatedTime] = useState('');
    const { toasts, removeToast, success, error: showError, info } = useToast();

    const handleLaunch = async () => {
        if (!agentName || !agentTicker) {
            showError('Please provide both agent name and ticker');
            return;
        }

        setIsLoading(true);
        setStatus('Preparing to launch agent...');
        setError(null);
        setLaunchResult(null);
        setProgress(0);
        setEstimatedTime('Estimated time: 10-15 seconds');

        try {
            // Generate unique agent ID
            const unibaseId = userAddress 
                ? `continuum_agent_${userAddress.toLowerCase()}_${Date.now()}`
                : `continuum_agent_${Date.now()}`;

            // Progress: 20% - Preparing
            setProgress(20);
            info('Preparing agent registration...');
            await new Promise(resolve => setTimeout(resolve, 500));

            // Progress: 40% - Registering on blockchain
            setProgress(40);
            setStatus('Registering agent on BNB Chain...');
            setEstimatedTime('Estimated time: 5-10 seconds');
            info('Submitting transaction to BNB Chain...');
            
            const response = await axios.post<LaunchResult>(
                `${BACKEND_URL}/api/launch-agent`, 
                { 
                    agentName, 
                    agentTicker,
                    unibaseId 
                },
                {
                    timeout: 60000 // 60 second timeout for blockchain operations
                }
            );

            // Progress: 70% - Transaction submitted
            setProgress(70);
            setStatus('Transaction submitted, waiting for confirmation...');
            setEstimatedTime('Estimated time: 3-5 seconds');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Progress: 90% - Initializing agent
            setProgress(90);
            setStatus('Initializing agent with Memory Hub...');
            setEstimatedTime('Almost done...');
            await new Promise(resolve => setTimeout(resolve, 500));

            if (response.data.success) {
                // Progress: 100% - Complete
                setProgress(100);
                setLaunchResult(response.data);
                setStatus('Agent launched successfully!');
                setEstimatedTime('');
                success(`Agent "${agentName}" launched successfully!`, 7000);
                info('You can now chat with your agent on the Chat page.', 7000);
            } else {
                throw new Error('Launch failed: Invalid response from server');
            }
        } catch (err) {
            console.error("Failed to launch agent:", err);
            
            setProgress(0);
            setEstimatedTime('');
            
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 503) {
                    const errorMsg = 'Backend service temporarily unavailable. Please try again in a moment.';
                    setError(errorMsg);
                    showError(errorMsg);
                } else if (err.response?.status === 504) {
                    const errorMsg = 'Request timed out. The blockchain transaction may still be processing. Please check back in a moment.';
                    setError(errorMsg);
                    showError(errorMsg, 8000);
                } else if (err.response?.status === 402) {
                    const errorMsg = 'Insufficient BNB for gas fees. Please add BNB to your wallet.';
                    setError(errorMsg);
                    showError(errorMsg);
                } else if (err.response?.status === 409) {
                    const errorMsg = 'This agent ID is already registered. Please try again.';
                    setError(errorMsg);
                    showError(errorMsg);
                } else if (err.response?.data?.message) {
                    const errorMsg = `Failed to launch agent: ${err.response.data.message}`;
                    setError(errorMsg);
                    showError(errorMsg);
                } else {
                    const errorMsg = 'Failed to launch agent. Please check console for details.';
                    setError(errorMsg);
                    showError(errorMsg);
                }
            } else {
                const errorMsg = 'An unexpected error occurred. Please try again.';
                setError(errorMsg);
                showError(errorMsg);
            }
            
            setStatus('');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCheckStatus = async () => {
        if (!launchResult?.unibaseId) {
            const errorMsg = 'No agent ID available. Please launch an agent first.';
            setStatusError(errorMsg);
            showError(errorMsg);
            return;
        }

        setIsLoadingStatus(true);
        setStatusError(null);
        info('Checking agent status...');

        try {
            const response = await axios.get<AgentStatus>(
                `${BACKEND_URL}/api/agent/status/${launchResult.unibaseId}`,
                {
                    timeout: 10000 // 10 second timeout
                }
            );

            if (response.data.success) {
                setAgentStatus(response.data);
                success('Agent status retrieved successfully!');
            } else {
                throw new Error('Failed to retrieve agent status');
            }
        } catch (err) {
            console.error("Failed to get agent status:", err);
            
            if (axios.isAxiosError(err)) {
                if (err.response?.status === 503) {
                    const errorMsg = 'Backend service temporarily unavailable. Please try again in a moment.';
                    setStatusError(errorMsg);
                    showError(errorMsg);
                } else if (err.response?.status === 504) {
                    const errorMsg = 'Request timed out. Please try again.';
                    setStatusError(errorMsg);
                    showError(errorMsg);
                } else if (err.response?.status === 404) {
                    const errorMsg = 'Agent not found. The agent may not be initialized yet.';
                    setStatusError(errorMsg);
                    showError(errorMsg);
                } else if (err.response?.data?.message) {
                    const errorMsg = `Failed to get status: ${err.response.data.message}`;
                    setStatusError(errorMsg);
                    showError(errorMsg);
                } else {
                    const errorMsg = 'Failed to get agent status. Please check console for details.';
                    setStatusError(errorMsg);
                    showError(errorMsg);
                }
            } else {
                const errorMsg = 'An unexpected error occurred. Please try again.';
                setStatusError(errorMsg);
                showError(errorMsg);
            }
        } finally {
            setIsLoadingStatus(false);
        }
    };

    return (
        <>
            <ToastContainer toasts={toasts} onClose={removeToast} />
            <div className="container card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ margin: 0 }}>Launch a New Agent</h2>
                    <Tooltip content="Create an AI agent with a permanent blockchain identity on BNB Chain. Your agent will have decentralized memory storage and can be accessed from any AIP-compatible platform.">
                        <Info size={20} style={{ color: 'var(--color-text-secondary)', cursor: 'help' }} />
                    </Tooltip>
                </div>
                <p>Create an AI agent with blockchain identity and decentralized memory on BNB Chain.</p>
                
                {/* Feature Highlights */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: 'var(--spacing-md)',
                    marginTop: 'var(--spacing-lg)',
                    marginBottom: 'var(--spacing-lg)',
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'rgba(0, 217, 255, 0.05)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid rgba(0, 217, 255, 0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Shield size={20} style={{ color: 'var(--color-primary)' }} />
                        <div>
                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>On-Chain Identity</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                Permanent & Verifiable
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Database size={20} style={{ color: 'var(--color-success)' }} />
                        <div>
                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Decentralized Memory</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                Stored in Membase
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <Zap size={20} style={{ color: 'rgb(251, 191, 36)' }} />
                        <div>
                            <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>Cross-Platform</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                AIP Compatible
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                        <label style={{ margin: 0 }}>Agent Name</label>
                        <Tooltip content="A human-readable name for your AI agent. This will be used to identify your agent in the interface.">
                            <Info size={14} style={{ color: 'var(--color-text-secondary)', cursor: 'help' }} />
                        </Tooltip>
                    </div>
                    <input
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="input"
                        placeholder="e.g., My Property Assistant"
                        disabled={isLoading}
                    />
                </div>
                
                <div className="form-group">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                        <label style={{ margin: 0 }}>Agent Ticker</label>
                        <Tooltip content="A short identifier for your agent (2-5 characters). Similar to a stock ticker symbol.">
                            <Info size={14} style={{ color: 'var(--color-text-secondary)', cursor: 'help' }} />
                        </Tooltip>
                    </div>
                    <input
                        type="text"
                        value={agentTicker}
                        onChange={(e) => setAgentTicker(e.target.value)}
                        className="input"
                        placeholder="e.g., MPA"
                        maxLength={5}
                        disabled={isLoading}
                    />
                </div>
                
                {/* Cost Information */}
                <div style={{
                    padding: 'var(--spacing-md)',
                    backgroundColor: 'rgba(251, 191, 36, 0.1)',
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--spacing-md)',
                    fontSize: 'var(--font-size-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                        <Info size={16} style={{ color: 'rgb(251, 191, 36)' }} />
                        <strong style={{ color: 'rgb(251, 191, 36)' }}>Transaction Cost</strong>
                    </div>
                    <div style={{ color: 'var(--color-text-secondary)' }}>
                        Launching an agent requires a one-time blockchain transaction fee of approximately <strong>0.00015 BNB</strong> (~$0.10 USD).
                        This registers your agent permanently on BNB Chain.
                    </div>
                    <div style={{ marginTop: 'var(--spacing-xs)' }}>
                        <a 
                            href="https://testnet.bnbchain.org/faucet-smart" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: 'rgb(251, 191, 36)', textDecoration: 'underline', fontSize: 'var(--font-size-xs)' }}
                        >
                            Need testnet BNB? Get it from the faucet →
                        </a>
                    </div>
                </div>

                <Button 
                    onClick={handleLaunch} 
                    disabled={isLoading || !agentName || !agentTicker}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}
                >
                    {isLoading && <LoadingSpinner size={16} color="white" />}
                    {isLoading ? 'Launching...' : 'Launch Agent'}
                </Button>

                {isLoading && progress > 0 && (
                    <div style={{ marginTop: '20px' }}>
                        <ProgressBar 
                            progress={progress} 
                            message={status}
                            estimatedTime={estimatedTime}
                        />
                    </div>
                )}

            {status && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '12px', 
                    backgroundColor: 'rgba(0, 217, 255, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(0, 217, 255, 0.3)'
                }}>
                    <p style={{ margin: 0, color: 'var(--color-primary)' }}>{status}</p>
                </div>
            )}

            {error && (
                <div style={{ 
                    marginTop: '20px', 
                    padding: '12px', 
                    backgroundColor: 'rgba(255, 68, 68, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 68, 68, 0.3)'
                }}>
                    <p style={{ margin: 0, color: '#ff4444' }}>{error}</p>
                </div>
            )}

            {launchResult && (
                <div style={{ 
                    marginTop: '24px', 
                    padding: '20px', 
                    backgroundColor: 'rgba(0, 255, 136, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(0, 255, 136, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                        <h3 style={{ margin: 0, color: 'var(--color-success)' }}>
                            ✓ Agent Launched Successfully
                        </h3>
                        <BlockchainBadge type="registered" />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <strong>Agent Name:</strong> {launchResult.agentName}
                        </div>
                        <div>
                            <strong>Agent Ticker:</strong> {launchResult.agentTicker}
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                                <strong>Agent ID:</strong>
                                <Tooltip content="This is your unique agent identifier. Use this ID to access your agent from any AIP-compatible platform.">
                                    <Info size={14} style={{ color: 'var(--color-text-secondary)', cursor: 'help' }} />
                                </Tooltip>
                            </div>
                            <code style={{ 
                                display: 'block',
                                padding: '8px 12px', 
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '4px',
                                fontSize: '0.9em',
                                wordBreak: 'break-all'
                            }}>
                                {launchResult.unibaseId}
                            </code>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                                <strong>Owner Wallet Address:</strong>
                                <Tooltip content="This is the BNB Chain wallet address that owns and controls this agent. Only this wallet can modify the agent.">
                                    <Info size={14} style={{ color: 'var(--color-text-secondary)', cursor: 'help' }} />
                                </Tooltip>
                            </div>
                            <code style={{ 
                                display: 'block',
                                padding: '8px 12px', 
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                borderRadius: '4px',
                                fontSize: '0.9em',
                                wordBreak: 'break-all'
                            }}>
                                {launchResult.walletAddress}
                            </code>
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                                <strong>Blockchain Transaction:</strong>
                                <Tooltip content="This transaction hash proves your agent is registered on BNB Chain. Click to view on the blockchain explorer.">
                                    <Info size={14} style={{ color: 'var(--color-text-secondary)', cursor: 'help' }} />
                                </Tooltip>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <code style={{ 
                                    padding: '8px 12px', 
                                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                    borderRadius: '4px',
                                    fontSize: '0.9em',
                                    wordBreak: 'break-all',
                                    flex: 1,
                                    minWidth: '200px'
                                }}>
                                    {launchResult.transactionHash}
                                </code>
                                <BlockchainBadge 
                                    type="transaction" 
                                    txHash={launchResult.transactionHash}
                                    label="View on Explorer"
                                />
                            </div>
                        </div>
                        <div style={{ 
                            marginTop: '8px', 
                            padding: '12px', 
                            backgroundColor: 'rgba(0, 217, 255, 0.1)',
                            borderRadius: '8px',
                            fontSize: '0.95em',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 'var(--spacing-sm)'
                        }}>
                            <Shield size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                                    Your Agent is Now Live on BNB Chain
                                </div>
                                <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                                    {launchResult.message} You can now chat with your agent on the AI Matcher page. 
                                    Your agent's memory is stored in decentralized Membase and will persist forever.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {launchResult && (
                <div style={{ marginTop: '24px' }}>
                    <Button 
                        onClick={handleCheckStatus} 
                        disabled={isLoadingStatus}
                        style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            width: 'auto'
                        }}
                    >
                        {isLoadingStatus ? (
                            <LoadingSpinner size={16} color="white" />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {isLoadingStatus ? 'Checking Status...' : 'Check Agent Status'}
                    </Button>

                    {statusError && (
                        <div style={{ 
                            marginTop: '12px', 
                            padding: '12px', 
                            backgroundColor: 'rgba(255, 68, 68, 0.1)',
                            borderRadius: '8px',
                            border: '1px solid rgba(255, 68, 68, 0.3)'
                        }}>
                            <p style={{ margin: 0, color: '#ff4444' }}>{statusError}</p>
                        </div>
                    )}

                    {agentStatus && (
                        <div style={{ 
                            marginTop: '16px', 
                            padding: '20px', 
                            backgroundColor: 'rgba(0, 217, 255, 0.05)',
                            borderRadius: '12px',
                            border: '1px solid rgba(0, 217, 255, 0.2)'
                        }}>
                            <h3 style={{ marginTop: 0, marginBottom: '16px', color: 'var(--color-primary)' }}>
                                Agent Status
                            </h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px' 
                                }}>
                                    <strong>Registration Status:</strong>
                                    <span style={{ 
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.85em',
                                        fontWeight: 'bold',
                                        backgroundColor: agentStatus.registered 
                                            ? 'rgba(0, 255, 136, 0.2)' 
                                            : 'rgba(255, 136, 0, 0.2)',
                                        color: agentStatus.registered 
                                            ? 'var(--color-success)' 
                                            : '#ff8800'
                                    }}>
                                        {agentStatus.registered ? '✓ Registered On-Chain' : '⚠ Not Registered'}
                                    </span>
                                </div>

                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px' 
                                }}>
                                    <strong>Memory Hub Connection:</strong>
                                    <span style={{ 
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.85em',
                                        fontWeight: 'bold',
                                        backgroundColor: agentStatus.memoryHubConnected 
                                            ? 'rgba(0, 255, 136, 0.2)' 
                                            : 'rgba(255, 68, 68, 0.2)',
                                        color: agentStatus.memoryHubConnected 
                                            ? 'var(--color-success)' 
                                            : '#ff4444'
                                    }}>
                                        {agentStatus.memoryHubConnected ? '✓ Connected' : '✗ Disconnected'}
                                    </span>
                                </div>

                                <div style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '8px' 
                                }}>
                                    <strong>Initialization Status:</strong>
                                    <span style={{ 
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        fontSize: '0.85em',
                                        fontWeight: 'bold',
                                        backgroundColor: agentStatus.status === 'active' 
                                            ? 'rgba(0, 255, 136, 0.2)' 
                                            : agentStatus.status === 'initializing'
                                            ? 'rgba(255, 136, 0, 0.2)'
                                            : 'rgba(255, 68, 68, 0.2)',
                                        color: agentStatus.status === 'active' 
                                            ? 'var(--color-success)' 
                                            : agentStatus.status === 'initializing'
                                            ? '#ff8800'
                                            : '#ff4444'
                                    }}>
                                        {agentStatus.status === 'active' && '✓ Active'}
                                        {agentStatus.status === 'initializing' && '⏳ Initializing'}
                                        {agentStatus.status === 'inactive' && '✗ Inactive'}
                                        {!['active', 'initializing', 'inactive'].includes(agentStatus.status) && agentStatus.status}
                                    </span>
                                </div>

                                <div>
                                    <strong>Owner Wallet Address:</strong>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                        <code style={{ 
                                            padding: '4px 8px', 
                                            backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                            borderRadius: '4px',
                                            fontSize: '0.9em',
                                            wordBreak: 'break-all'
                                        }}>
                                            {agentStatus.walletAddress}
                                        </code>
                                    </div>
                                </div>

                                {launchResult.transactionHash && (
                                    <div style={{ marginTop: '8px' }}>
                                        <Button
                                            onClick={() => window.open(
                                                `${BSC_TESTNET_EXPLORER}/tx/${launchResult.transactionHash}`,
                                                '_blank',
                                                'noopener,noreferrer'
                                            )}
                                            style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                width: 'auto',
                                                fontSize: '0.9em',
                                                padding: '8px 16px'
                                            }}
                                        >
                                            View Transaction on BSC Testnet Explorer
                                            <ExternalLink size={14} />
                                        </Button>
                                    </div>
                                )}

                                <div style={{ 
                                    marginTop: '12px', 
                                    padding: '12px', 
                                    backgroundColor: 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '8px',
                                    fontSize: '0.9em'
                                }}>
                                    <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)' }}>
                                        <strong>Agent ID:</strong> {agentStatus.agentId}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            </div>
        </>
    );
};
