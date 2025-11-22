import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { Navbar } from './components/ui/Navbar';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { AssetDetails } from './pages/AssetDetails';
import { Admin } from './pages/Admin';
import './index.css';

const wallets = [new PetraWallet()];

const App: React.FC = () => {
    return (
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
            <BrowserRouter>
                <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                    <Routes>
                        {/* Landing Page - No Navbar */}
                        <Route path="/" element={<LandingPage />} />

                        {/* App Routes - With Navbar */}
                        <Route
                            path="/dashboard"
                            element={
                                <>
                                    <Navbar />
                                    <Dashboard />
                                </>
                            }
                        />
                        <Route
                            path="/asset/:tokenId"
                            element={
                                <>
                                    <Navbar />
                                    <AssetDetails />
                                </>
                            }
                        />

                        {/* Admin Route - No Navbar (has its own header) */}
                        <Route path="/admin" element={<Admin />} />

                        {/* Redirect unknown routes to landing */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </BrowserRouter>
        </AptosWalletAdapterProvider>
    );
};

export default App;
