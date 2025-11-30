import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect, usePublicClient, useWalletClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { Navbar } from './components/ui/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AssetDetails } from './pages/AssetDetails';
import { Admin } from './pages/Admin';
import { Button } from './components/ui/Button';
import { ContinuumService } from './services/continuumService';
import './index.css';

const App: React.FC = () => {
    const { address, isConnected } = useAccount();
    const { connect } = useConnect();
    const { disconnect } = useDisconnect();
    const publicClient = usePublicClient();
    const { data: walletClient } = useWalletClient();

    useEffect(() => {
        if (publicClient) {
            ContinuumService.setClients(publicClient, walletClient || undefined);
        }
    }, [publicClient, walletClient]);

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
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                <Routes>
                    <Route
                        path="/"
                        element={<Navigate to="/dashboard" replace />}
                    />
                    <Route
                        path="/dashboard"
                        element={
                            <>
                                <Navbar walletButton={<WalletConnectButton />} />
                                <Dashboard />
                            </>
                        }
                    />
                    <Route
                        path="/asset/:tokenId"
                        element={
                            <>
                                <Navbar walletButton={<WalletConnectButton />} />
                                <AssetDetails />
                            </>
                        }
                    />

                    <Route 
                        path="/admin/*" 
                        element={
                            <>
                                <Navbar walletButton={<WalletConnectButton />} />
                                <Admin />
                            </>
                        } 
                    />

                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
};

export default App;
