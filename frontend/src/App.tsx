import React from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { WalletSelector } from '@aptos-labs/wallet-adapter-ant-design';
import '@aptos-labs/wallet-adapter-ant-design/dist/index.css';
import InitializeEcosystem from './InitializeEcosystem';
import ComplianceSetup from './ComplianceSetup';
import StreamManagement from './StreamManagement';
import ViewFunctions from './ViewFunctions';

const App: React.FC = () => {
    const { account, connected, disconnect } = useWallet();

    return (
        <div className="container">
            <h1>♾️ YieldStream - RWA Protocol</h1>

            {/* Wallet Connection */}
            <div className="wallet-info">
                {connected && account ? (
                    <>
                        <div>
                            <strong>Connected:</strong> {account.address}
                        </div>
                        <button onClick={disconnect}>Disconnect</button>
                    </>
                ) : (
                    <div>
                        <WalletSelector />
                    </div>
                )}
            </div>

            {!connected && (
                <div className="info">
                    Please connect your Aptos wallet to interact with the smart contracts.
                </div>
            )}

            {/* Main Content */}
            <InitializeEcosystem />
            <ComplianceSetup />
            <StreamManagement />
            <ViewFunctions />

            {/* Info Footer */}
            <div className="card" style={{ marginTop: '2rem', opacity: 0.7 }}>
                <h3>💡 Usage Notes</h3>
                <ul>
                    <li>All registry addresses (Stream, Yield, Compliance) are typically your deployer address</li>
                    <li>Initialize the ecosystem first before creating streams</li>
                    <li>Register KYC and whitelist addresses before they can participate</li>
                    <li>Amounts are in octas: 1 APT = 100,000,000 octas</li>
                    <li>You need a real NFT/Token Object address to create streams</li>
                </ul>
            </div>
        </div>
    );
};

export default App;
