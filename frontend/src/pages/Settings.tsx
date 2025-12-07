// Settings.tsx
import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

export const Settings: React.FC = () => {
    const { address } = useAccount();
    const [spendCap, setSpendCap] = useState<string>('');
    const [activityLog, setActivityLog] = useState<any[]>([]);

    useEffect(() => {
        if (address) {
            // Fetch spend cap
            axios.get(`${BACKEND_URL}/api/spend-cap/${address}`)
                .then(response => setSpendCap(response.data.spendCap.toString()))
                .catch(error => console.error("Failed to fetch spend cap:", error));

            // Fetch activity log
            axios.get(`${BACKEND_URL}/api/activity-log/${address}`)
                .then(response => setActivityLog(response.data))
                .catch(error => console.error("Failed to fetch activity log:", error));
        }
    }, [address]);

    const handleSaveSpendCap = async () => {
        if (address) {
            try {
                await axios.post(`${BACKEND_URL}/api/spend-cap`, { userAddress: address, spendCap });
                alert('Spend cap saved!');
            } catch (error) {
                console.error("Failed to save spend cap:", error);
                alert('Failed to save spend cap. See console for details.');
            }
        }
    };

    return (
        <div className="container">
            <h1>Settings</h1>

            <div className="card">
                <h2>Spend Cap</h2>
                <p>Set a server-enforced limit on the value of transactions the AI agent can initiate.</p>
                <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                    <input
                        type="number"
                        value={spendCap}
                        onChange={(e) => setSpendCap(e.target.value)}
                        className="input"
                    />
                    <button onClick={handleSaveSpendCap} className="btn-primary">Save</button>
                </div>
            </div>

            <div className="card">
                <h2>Activity Log</h2>
                <p>A persistent, server-side log of the AI agent's recent on-chain activities.</p>
                <div className="activity-log">
                    {activityLog.map((log, index) => (
                        <div className="log-item" key={index}>
                            <p><strong>Action:</strong> {log.action}</p>
                            <p><strong>Status:</strong> {log.status}</p>
                            {log.txHash && <p><strong>TxHash:</strong> <a href={`https://testnet.bscscan.com/tx/${log.txHash}`} target="_blank" rel="noopener noreferrer">{log.txHash}</a></p>}
                            {log.error && <p><strong>Error:</strong> {log.error}</p>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
