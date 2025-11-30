import React, { useState } from 'react';
import { Wallet, Compass, Zap } from 'lucide-react';
import { Portfolio } from '../pages/Portfolio';
import { AssetExplorer } from '../pages/AssetExplorer';
import { MyRentals } from '../pages/MyRentals';

type TabType = 'portfolio' | 'explore' | 'rentals';

export const Dashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('portfolio');

    const tabs = [
        { id: 'portfolio' as TabType, label: 'My Portfolio', icon: Wallet },
        { id: 'explore' as TabType, label: 'Explore Assets', icon: Compass },
        { id: 'rentals' as TabType, label: 'My Rentals', icon: Zap },
    ];

    return (
        <div style={{ minHeight: 'calc(100vh - 80px)' }}>
            {/* Tab Navigation */}
            <div
                style={{
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    background: 'rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(10px)',
                }}
            >
                <div className="container" style={{ padding: 0 }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--spacing-sm)',
                                        padding: 'var(--spacing-lg) var(--spacing-xl)',
                                        background: 'none',
                                        border: 'none',
                                        color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                        cursor: 'pointer',
                                        borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                                        transition: 'all 0.2s ease',
                                        fontSize: 'var(--font-size-base)',
                                        fontWeight: isActive ? 600 : 400,
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.color = 'var(--color-text-primary)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!isActive) {
                                            e.currentTarget.style.color = 'var(--color-text-secondary)';
                                        }
                                    }}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'portfolio' && <Portfolio />}
                {activeTab === 'explore' && <AssetExplorer />}
                {activeTab === 'rentals' && <MyRentals />}
            </div>
        </div>
    );
};
