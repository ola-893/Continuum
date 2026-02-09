import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/ui/Navbar';
import { NetworkBanner } from './components/ui/NetworkBanner';
import { NetworkWarningBanner } from './components/ui/NetworkIndicator';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/Dashboard';
import { AssetDetails } from './pages/AssetDetails';
import { Rentals } from './pages/Rentals';
import { Admin } from './pages/Admin';
import './index.css';

const App: React.FC = () => {
    const [showWarningBanner, setShowWarningBanner] = React.useState(true);

    return (
        <BrowserRouter>
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                {/* Network warning banner - shown on all pages */}
                {showWarningBanner && (
                    <NetworkWarningBanner onDismiss={() => setShowWarningBanner(false)} />
                )}
                
                {/* Network info banner - shown on all pages */}
                <NetworkBanner />
                
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
                        path="/rentals"
                        element={
                            <>
                                <Navbar />
                                <Rentals />
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
    );
};

export default App;
