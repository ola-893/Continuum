import React from 'react';
import { Link } from 'react-router-dom';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import { Infinity } from 'lucide-react';
import { truncateAddress } from '../../utils/formatting';
import { useContinuum } from '../../hooks/useContinuum';

export const Navbar: React.FC = () => {
    const { account, connected } = useWallet();
    const { complianceStatus } = useContinuum();

    return (
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
                                className="glass"
                                style={{
                                    padding: 'var(--spacing-md) var(--spacing-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-md)',
                                    borderRadius: 'var(--radius-lg)',
                                }}
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
                            <WalletSelector />
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
