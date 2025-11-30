import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Infinity } from 'lucide-react';

interface NavbarProps {
    walletButton?: React.ReactNode;
}

export const Navbar: React.FC<NavbarProps> = ({ walletButton }) => {
    const location = useLocation();

    return (
        <nav className="glass" style={{ position: 'sticky', top: 0, zIndex: 100 }}>
            <div className="container">
                <div className="flex justify-between items-center" style={{ height: '70px' }}>
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-md">
                        <Infinity size={32} style={{ color: 'var(--color-primary)' }} />
                        <span className="text-2xl font-bold gradient-text">YieldStream</span>
                    </Link>

                    {/* Navigation Links */}
                    <div style={{ display: 'flex', gap: 'var(--spacing-lg)' }}>
                        <Link
                            to="/dashboard"
                            className={`nav-link ${location.pathname.startsWith('/dashboard') ? 'active' : ''}`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            to="/admin"
                            className={`nav-link ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                        >
                            Admin
                        </Link>
                    </div>

                    {/* Wallet Connection */}
                    <div className="flex items-center gap-md">
                        {walletButton}
                    </div>
                </div>
            </div>
            <style>
                {`
                .nav-link {
                    padding: var(--spacing-sm) var(--spacing-md);
                    border-radius: var(--border-radius-md);
                    background: transparent;
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    font-weight: 500;
                }
                .nav-link:hover {
                    color: var(--color-text-primary);
                }
                .nav-link.active {
                    background: rgba(0, 217, 255, 0.1);
                    border-color: var(--color-primary);
                }
            `}
            </style>
        </nav>
    );
};
