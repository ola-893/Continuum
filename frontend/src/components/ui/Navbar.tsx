import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Infinity, Wallet, Zap } from 'lucide-react';
import { truncateAddress } from '../../utils/formatting';
import { useTezosWallet } from '../../hooks/useTezosWallet';
import { ProfileModal } from './ProfileModal';

export const Navbar: React.FC = () => {
    const { address, connected, connect } = useTezosWallet();
    const [isProfileOpen, setIsProfileOpen] = React.useState(false);
    const location = useLocation();

    const handleConnectWallet = async () => {
        try {
            await connect();
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    };

    return (
        <>
            <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
                <div className="container">
                    <div className="flex justify-between items-center" style={{ height: '70px' }}>
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-md">
                            <Infinity
                                size={32}
                                style={{ color: 'var(--color-primary)' }}
                            />
                            <span className="text-2xl font-bold gradient-text">Continuum</span>
                        </Link>

                        {/* Navigation Links */}
                        {connected && (
                            <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                                <Link
                                    to="/dashboard"
                                    style={{
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        borderRadius: 'var(--border-radius-md)',
                                        background: location.pathname === '/dashboard' ? 'rgba(0, 217, 255, 0.1)' : 'transparent',
                                        border: location.pathname === '/dashboard' ? '1px solid var(--color-primary)' : '1px solid transparent',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                    }}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    to="/rentals"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-xs)',
                                        padding: 'var(--spacing-sm) var(--spacing-md)',
                                        borderRadius: 'var(--border-radius-md)',
                                        background: location.pathname === '/rentals' ? 'rgba(0, 217, 255, 0.1)' : 'transparent',
                                        border: location.pathname === '/rentals' ? '1px solid var(--color-primary)' : '1px solid transparent',
                                        transition: 'all 0.2s ease',
                                        textDecoration: 'none',
                                        fontWeight: 500,
                                    }}
                                >
                                    <Zap size={16} />
                                    Rent Assets
                                </Link>
                            </div>
                        )}

                        {/* Wallet Connection */}
                        <div className="flex items-center gap-md">
                            {connected && address ? (
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
                                        {address ? address.slice(0, 2).toUpperCase() : 'TZ'}
                                    </div>

                                    {/* Wallet Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <span className="text-sm font-medium">
                                                {address ? truncateAddress(address) : ''}
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
                                                Ghostnet
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>
                                                Connected
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnectWallet}
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
