import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { X, Shield, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { LoadingScreen } from './LoadingScreen';
import { useContinuum } from '../../hooks/useContinuum';
import { truncateAddress } from '../../utils/formatting';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { address, isConnected } = useAccount();
    const { complianceStatus } = useContinuum();
    const [verifying, setVerifying] = useState(false);
    const [txStatus, setTxStatus] = useState('');

    if (!isOpen || !isConnected || !address) return null; // Render only if connected

    const handleVerifyIdentity = async () => {
        setVerifying(true);
        setTxStatus('Simulating KYC verification for EVM...');

        try {
            // In a real EVM implementation, this would involve calling a compliance contract.
            // For now, we simulate success.
            await new Promise(resolve => setTimeout(resolve, 1500)); 

            setTxStatus('Success: Identity Verified (Simulated)!');
            setTimeout(() => {
                setVerifying(false);
                setTxStatus('');
                onClose(); // Close modal after simulated verification
            }, 2000);
        } catch (error) {
            console.error('KYC verification failed (simulated):', error);
            setTxStatus('Error: Verification Failed (Simulated)');
            setTimeout(() => {
                setVerifying(false);
                setTxStatus('');
            }, 3000);
        }
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    width: '100%',
                    maxWidth: '450px',
                    padding: 0,
                    overflow: 'hidden',
                    position: 'relative',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="card-header"
                    style={{
                        padding: 'var(--spacing-lg)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: 0,
                    }}
                >
                    <h3 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>User Profile</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: 'var(--spacing-xl)' }}>
                    {verifying ? (
                        <LoadingScreen message={txStatus || "Verifying Identity..."} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>

                            {/* User Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                <div
                                    className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center text-2xl font-bold"
                                    style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        background: 'var(--gradient-primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}
                                >
                                    {address.slice(2, 4).toUpperCase()} 
                                </div>
                                <div>
                                    <h4 style={{ margin: 0 }}>{truncateAddress(address)}</h4>
                                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        Connected to BNB Smart Chain
                                    </span>
                                </div>
                            </div>

                            {/* Simplified Status Card */}
                            <div
                                style={{
                                    background: complianceStatus.hasKYC
                                        ? 'rgba(16, 185, 129, 0.1)'
                                        : 'rgba(245, 158, 11, 0.1)',
                                    border: `1px solid ${complianceStatus.hasKYC ? 'var(--color-success)' : 'var(--color-warning)'}`,
                                    borderRadius: 'var(--radius-lg)',
                                    padding: 'var(--spacing-lg)',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-sm)' }}>
                                    {complianceStatus.hasKYC ? (
                                        <CheckCircle size={24} color="var(--color-success)" />
                                    ) : (
                                        <Shield size={24} color="var(--color-warning)" />
                                    )}
                                    <h4 style={{ margin: 0, color: complianceStatus.hasKYC ? 'var(--color-success)' : 'var(--color-warning)' }}>
                                        {complianceStatus.hasKYC ? 'Identity Verified (Simulated)' : 'Identity Not Verified (Simulated)'}
                                    </h4>
                                </div>

                                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                                    {complianceStatus.hasKYC
                                        ? 'Your identity has been simulated as verified for EVM demo.'
                                        : 'Identity verification is simulated for EVM demo. This feature requires a ComplianceGuard contract.'}
                                </p>

                                {!complianceStatus.hasKYC && (
                                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                                        <Button onClick={handleVerifyIdentity} className="w-full">
                                            Simulate Identity Verification
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};