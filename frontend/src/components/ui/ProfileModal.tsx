import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { X, Shield, CheckCircle } from 'lucide-react';
import { Button } from './Button';
import { LoadingScreen } from './LoadingScreen';
import { useContinuum } from '../../hooks/useContinuum';
import { ContinuumService } from '../../services/continuumService';
import { truncateAddress } from '../../utils/formatting';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
    const { account, signAndSubmitTransaction } = useWallet();
    const { complianceStatus } = useContinuum();
    const [verifying, setVerifying] = useState(false);
    const [txStatus, setTxStatus] = useState('');

    if (!isOpen || !account) return null;

    const handleVerifyIdentity = async () => {
        setVerifying(true);
        setTxStatus('Initiating KYC verification...');

        try {
            // Use simulateKYC for testnet
            const transaction = ContinuumService.simulateKYC();
            await signAndSubmitTransaction(transaction);

            setTxStatus('✅ Identity Verified Successfully!');
            setTimeout(() => {
                setVerifying(false);
                setTxStatus('');
                // Ideally refresh compliance status here, but page reload works too
                window.location.reload();
            }, 2000);
        } catch (error) {
            console.error('KYC verification failed:', error);
            setTxStatus('❌ Verification Failed');
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
                                    {account.address.slice(2, 4).toUpperCase()}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0 }}>{truncateAddress(account.address)}</h4>
                                    <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                                        Connected via Petra
                                    </span>
                                </div>
                            </div>

                            {/* KYC Status Card */}
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
                                        {complianceStatus.hasKYC ? 'Identity Verified' : 'Identity Not Verified'}
                                    </h4>
                                </div>

                                <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                                    {complianceStatus.hasKYC
                                        ? 'Your identity has been verified. You have full access to trade Real World Assets.'
                                        : 'You need to verify your identity to trade Real World Assets on Continuum Protocol.'}
                                </p>

                                {!complianceStatus.hasKYC && (
                                    <div style={{ marginTop: 'var(--spacing-md)' }}>
                                        <Button onClick={handleVerifyIdentity} className="w-full">
                                            Verify Identity Now
                                        </Button>
                                        <p style={{
                                            marginTop: 'var(--spacing-sm)',
                                            fontSize: '10px',
                                            color: 'var(--color-text-muted)',
                                            textAlign: 'center'
                                        }}>
                                            * Testnet Mode: This will simulate KYC verification
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Additional Details */}
                            {complianceStatus.hasKYC && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                                    <div className="card" style={{ padding: 'var(--spacing-md)', background: 'rgba(255,255,255,0.03)' }}>
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Jurisdiction</span>
                                        <div style={{ fontWeight: 600 }}>United States</div>
                                    </div>
                                    <div className="card" style={{ padding: 'var(--spacing-md)', background: 'rgba(255,255,255,0.03)' }}>
                                        <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>Level</span>
                                        <div style={{ fontWeight: 600 }}>Tier 1</div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
