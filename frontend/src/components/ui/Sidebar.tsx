import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Infinity, LayoutDashboard, Package, Rocket, Shield, MessageSquare, HelpCircle } from 'lucide-react';

export const Sidebar: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/rentals', label: 'Rentals', icon: Package },
        { path: '/launch-agent', label: 'Launch Agent', icon: Rocket },
        { path: '/chat', label: 'AI Matcher', icon: MessageSquare },
        { path: '/admin', label: 'Admin', icon: Shield },
        { path: '/help', label: 'Help', icon: HelpCircle },
    ];

    return (
        <aside className="sidebar">
            {/* Logo */}
            <Link to="/" className="sidebar-logo">
                <Infinity size={28} style={{ color: 'var(--color-primary)' }} />
                <span className="sidebar-logo-text gradient-text">YieldStream</span>
            </Link>

            {/* Navigation Links */}
            <nav className="sidebar-nav">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname.startsWith(item.path);
                    
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                        >
                            <Icon size={20} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <style>
                {`
                .sidebar {
                    position: fixed;
                    left: 0;
                    top: 0;
                    bottom: 0;
                    width: 240px;
                    background: rgba(10, 15, 30, 0.95);
                    backdrop-filter: blur(20px);
                    border-right: 1px solid rgba(0, 217, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    padding: var(--spacing-lg);
                    z-index: 50;
                }

                .sidebar-logo {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-sm);
                    padding: var(--spacing-md);
                    margin-bottom: var(--spacing-xl);
                    text-decoration: none;
                    border-bottom: 1px solid rgba(0, 217, 255, 0.1);
                }

                .sidebar-logo-text {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .sidebar-nav {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: var(--spacing-xs);
                }

                .sidebar-link {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                    padding: var(--spacing-md);
                    border-radius: var(--border-radius-md);
                    background: transparent;
                    border: 1px solid transparent;
                    transition: all 0.2s ease;
                    text-decoration: none;
                    color: var(--color-text-secondary);
                    font-weight: 500;
                }

                .sidebar-link:hover {
                    color: var(--color-text-primary);
                    background: rgba(0, 217, 255, 0.05);
                    border-color: rgba(0, 217, 255, 0.2);
                }

                .sidebar-link.active {
                    color: var(--color-primary);
                    background: rgba(0, 217, 255, 0.1);
                    border-color: var(--color-primary);
                }

                @media (max-width: 768px) {
                    .sidebar {
                        width: 60px;
                        padding: var(--spacing-md);
                    }

                    .sidebar-logo-text,
                    .sidebar-link span {
                        display: none;
                    }

                    .sidebar-link {
                        justify-content: center;
                    }
                }
            `}
            </style>
        </aside>
    );
};
