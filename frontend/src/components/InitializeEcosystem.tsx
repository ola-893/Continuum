import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { initializeEcosystem } from '../services/aptosService';

const InitializeEcosystem: React.FC = () => {
    const { account, signAndSubmitTransaction } = useWallet();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');

    const handleInitialize = async () => {
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError('');
        setResult('');

        try {
            const transaction = initializeEcosystem(account.address);
            const result = await signAndSubmitTransaction(transaction);
            setResult(`Ecosystem initialized! Transaction: ${(result as any).hash}`);
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h2>Initialize RWA Ecosystem</h2>
            <p>Initialize the StreamRegistry, AssetYieldRegistry, and ComplianceRegistry. This only needs to be done once per deployer.</p>

            <button onClick={handleInitialize} disabled={loading || !account}>
                {loading ? 'Initializing...' : 'Initialize Ecosystem'}
            </button>

            {result && <div className="success">{result}</div>}
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default InitializeEcosystem;
