import React from 'react';
import { ConnectionStatus } from './ConnectionStatus';

interface TopBarProps {
    walletButton?: React.ReactNode;
}

export const TopBar: React.FC<TopBarProps> = ({ walletButton }) => {
    return (
        <div className="top-bar">
            <div className="top-bar-content">
                <div className="top-bar-spacer" />
                <div className="top-bar-actions">
                    <ConnectionStatus />
                    {walletButton}
                </div>
            </div>

            <style>
                {`
                .top-bar {
                    position: sticky;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 70px;
                    background: rgba(10, 15, 30, 0.95);
                    backdrop-filter: blur(20px);
                    border-bottom: 1px solid rgba(0, 217, 255, 0.1);
                    z-index: 90;
                }

                .top-bar-content {
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 var(--spacing-xl);
                }

                .top-bar-spacer {
                    flex: 1;
                }

                .top-bar-actions {
                    display: flex;
                    align-items: center;
                    gap: var(--spacing-md);
                }

                @media (max-width: 768px) {
                    .top-bar-content {
                        padding: 0 var(--spacing-md);
                    }
                }
            `}
            </style>
        </div>
    );
};
