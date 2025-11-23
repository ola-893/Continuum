import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { Infinity, Wallet } from 'lucide-react';
import { truncateAddress } from '../../utils/formatting';
import { useContinuum } from '../../hooks/useContinuum';
import { ProfileModal } from './ProfileModal';

export const Navbar: React.FC = () => {
    const { account, connected } = useWallet();
    const { complianceStatus } = useContinuum();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const [showWalletModal, setShowWalletModal] = React.useState(false);

    return (
        <>
            <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                <div className="container">
                    <div className="flex justify-between items-center" style={{ height: '70px' }}>
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-md">
                            <Infinity
                                size={32}
                                className="animate-float"
                                style={{ color: 'var(--color-primary)' }}
                            />
                            <span className="text-2xl font-bold gradient-text">Continuum</span>
                        </Link>

                        {/* Wallet Connection */}
                        <div className="flex items-center gap-md">
                            {connected && account ? (
                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-md)',
                                        cursor: 'pointer',
                                        transition: 'opacity 0.2s ease',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: 0,
                                    }}
                                    onClick={() => setIsProfileOpen(true)}
                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                                >
                                    {/* Avatar */}
                                    <div
                                        className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-base font-bold"
                                        style={{ flexShrink: 0 }}
                                    >
                                        {account.address.slice(2, 4).toUpperCase()}
                                    </div>

                                    {/* Wallet Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <span className="text-sm font-medium">
                                                {truncateAddress(account.address)}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: '10px',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px',
                                                    background: 'rgba(59, 130, 246, 0.2)',
                                                    color: '#60a5fa',
                                                    fontWeight: 500,
                                                }}
                                            >
                                                Testnet
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            {complianceStatus.hasKYC ? (
                                                <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>
                                                    ✓ KYC Verified
                                                </span>
                                            ) : (
                                                <span style={{ fontSize: '11px', color: 'var(--color-warning)' }}>
                                                    ⚠ No KYC
                                                </span>
                                            )}
                                            {complianceStatus.isAdmin && (
                                                <span style={{ fontSize: '11px', color: 'var(--color-primary)' }}>
                                                    • Admin
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Custom Connect Wallet CTA Button */}
                                    <button
                                        onClick={() => setShowWalletModal(true)}
                                        className="btn-primary"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 'var(--spacing-sm)',
                                            padding: 'var(--spacing-md) var(--spacing-xl)',
                                            fontSize: 'var(--font-size-base)',
                                            fontWeight: 600,
                                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                                            border: 'none',
                                            borderRadius: 'var(--border-radius-md)',
                                            color: 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 217, 255, 0.5)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.3)';
                                        }}
                                    >
                                        <Wallet size={18} />
                                        <span>Connect Wallet</span>
                                    </button>

                                    {/* Wallet Modal */}
                                    {showWalletModal && (
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
                                            onClick={() => setShowWalletModal(false)}
                                        >
                                            <div
                                                className="card"
                                                style={{
                                                    maxWidth: '400px',
                                                    width: '90%',
                                                    padding: 'var(--spacing-2xl)',
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Connect Wallet</h3>
                                                <WalletSelector />
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Profile Modal */}
            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
            />
        </>
    );
};
