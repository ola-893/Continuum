import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, usePublicClient, useWalletClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Sidebar } from './components/ui/Sidebar';
import { TopBar } from './components/ui/TopBar';
import { Dashboard } from './pages/Dashboard';
import { AssetDetails } from './pages/AssetDetails';
import { Admin } from './pages/Admin';
import Rentals from './pages/Rentals';
import MyStreams from './pages/MyStreams';
import { ChatInterface } from './pages/ChatInterface';
import { LaunchAgent } from './pages/LaunchAgent';
import { Help } from './pages/Help';
import { Button } from './components/ui/Button';
import { ContinuumService } from './services/continuumService';
import { useNetwork } from './contexts/NetworkContext';
import { LandingPage } from './pages/LandingPage';
import './index.css';

const AppLayout: React.FC<{ children: React.ReactNode; walletButton: React.ReactNode }> = ({ children, walletButton }) => {
    const location = useLocation();
    const isLandingPage = location.pathname === '/';

    if (isLandingPage) {
        return <>{children}</>;
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{ 
                marginLeft: '240px', 
                flex: 1,
                width: 'calc(100% - 240px)',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <TopBar walletButton={walletButton} />
                <main style={{ flex: 1 }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

const App: React.FC = () => {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();
    const { network } = useNetwork();

    useEffect(() => {
        if (publicClient) {
            ContinuumService.setClients(publicClient, network, walletClient || undefined);
        }
    }, [publicClient, walletClient, network]);

    const WalletConnectButton = () => {
        if (isConnected) {
            return (
                <div className="flex items-center gap-md">
                    <span className="text-sm font-mono">{`${address?.slice(0, 6)}...${address?.slice(-4)}`}</span>
                    <Button onClick={() => disconnect()} variant="secondary">Disconnect</Button>
                </div>
            );
        }
        return <Button onClick={() => connect({ connector: injected() })}>Connect Wallet</Button>;
    };

    return (
        <BrowserRouter>
            <AppLayout walletButton={<WalletConnectButton />}>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/asset/:tokenId" element={<AssetDetails />} />
                    <Route path="/rentals" element={<Rentals />} />
                    <Route path="/my-streams" element={<MyStreams />} />
                    <Route path="/chat" element={<ChatInterface />} />
                    <Route path="/launch-agent" element={<LaunchAgent />} />
                    <Route path="/help" element={<Help />} />
                    <Route path="/admin/*" element={<Admin />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </AppLayout>
        </BrowserRouter>
    );
};

export default App;
