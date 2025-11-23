import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, Factory, Users, Radio, Shield, ArrowLeft } from 'lucide-react';
import { useContinuum } from '../hooks/useContinuum';
import { GodView } from './admin/GodView';
import { AssetFactory } from './admin/AssetFactory';
import { ComplianceDesk } from './admin/ComplianceDesk';
import { FleetControl } from './admin/FleetControl';

type AdminTab = 'god-view' | 'factory' | 'compliance' | 'fleet';

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const { complianceStatus, account } = useContinuum();
    const [activeTab, setActiveTab] = useState<AdminTab>('god-view');

    // Check if user is admin
    if (!account || !complianceStatus.isAdmin) {
        return (
            <div className="container" style={{ paddingTop: 'var(--spacing-2xl)' }}>
                <div
                    className="card"
                    style={{
                        maxWidth: '600px',
                        margin: '0 auto',
                        padding: 'var(--spacing-2xl)',
                        textAlign: 'center',
                        border: '2px solid var(--color-error)',
                    }}
                >
                    <Shield size={48} style={{ color: 'var(--color-error)', margin: '0 auto var(--spacing-lg)' }} />
                    <h2 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-error)' }}>
                        Access Denied
                    </h2>
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                        This area is restricted to administrators only. Your wallet address is not authorized.
                    </p>
                    <button
                        onClick={() => navigate('/dashboard')}
                        style={{
                            padding: 'var(--spacing-sm) var(--spacing-lg)',
                            background: 'var(--gradient-primary)',
                            border: 'none',
                            borderRadius: 'var(--border-radius-md)',
                            color: 'white',
                            cursor: 'pointer',
                            fontWeight: 600,
                        }}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
        { id: 'god-view', label: 'God View', icon: <LayoutDashboard size={18} /> },
        { id: 'factory', label: 'Asset Factory', icon: <Factory size={18} /> },
        { id: 'compliance', label: 'Compliance Desk', icon: <Users size={18} /> },
        { id: 'fleet', label: 'Fleet Control', icon: <Radio size={18} /> },
    ];

    return (
        <div
            style={{
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #0a0e27 0%, #1a1027 100%)',
            }}
        >
            {/* Admin Header */}
            <div
                className="glass"
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                }}
            >
                <div className="container">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--spacing-lg) 0',
                        }}
                    >
                        {/* Logo & Title */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-lg)' }}>
                            <button
                                onClick={() => navigate('/dashboard')}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    padding: 'var(--spacing-xs)',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 style={{ fontSize: 'var(--font-size-xl)', marginBottom: '4px' }}>
                                    Control: Continuum Command Center
                                </h2>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                    Operator: {account?.address.slice(0, 10)}...{account?.address.slice(-6)}
                                    <span
                                        style={{
                                            marginLeft: 'var(--spacing-sm)',
                                            padding: '2px 8px',
                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                            borderRadius: '4px',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                        }}
                                    >
                                        ADMIN
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div style={{ display: 'flex', gap: '4px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 'var(--spacing-md)' }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    background: activeTab === tab.id ? 'rgba(0, 217, 255, 0.1)' : 'none',
                                    border: 'none',
                                    borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
                                    padding: 'var(--spacing-sm) var(--spacing-lg)',
                                    color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--spacing-xs)',
                                    fontWeight: activeTab === tab.id ? 600 : 400,
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'god-view' && <GodView />}
                {activeTab === 'factory' && <AssetFactory />}
                {activeTab === 'compliance' && <ComplianceDesk />}
                {activeTab === 'fleet' && <FleetControl />}
            </div>
        </div>
    );
};
