import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { LayoutDashboard, Factory, Users, Radio, Shield, ArrowLeft } from 'lucide-react';
import { GodView } from './admin/GodView';
import { AssetFactory } from './admin/AssetFactory';
import { ComplianceDesk } from './admin/ComplianceDesk';
import { FleetControl } from './admin/FleetControl';
import { truncateAddress } from '../utils/formatting';
// import { CONTRACT_CONFIG } from '../config/contracts'; // Removed as it's not directly used for admin address here

type AdminTab = 'god-view' | 'factory' | 'compliance' | 'fleet';

const ADMIN_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const { address, isConnected } = useAccount();
    const [activeTab, setActiveTab] = useState<AdminTab>('god-view'); // Corrected useState usage

    const isAdmin = isConnected && address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

    if (!isConnected || !isAdmin) {
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
                        This area is restricted to administrators only. Your connected wallet address is not authorized.
                        Please connect with the admin wallet: {truncateAddress(ADMIN_ADDRESS)}
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
                                    Control: YieldStream Command Center
                                </h2>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                    Operator: {address ? truncateAddress(address) : "Not Connected"}
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

            <div>
                {activeTab === 'god-view' && <GodView />}
                {activeTab === 'factory' && <AssetFactory />}
                {activeTab === 'compliance' && <ComplianceDesk />}
                {activeTab === 'fleet' && <FleetControl />}
            </div>
        </div>
    );
};
