// frontend/src/pages/LaunchAgent.tsx
import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/Button';

const BACKEND_URL = 'http://localhost:3001';

export const LaunchAgent: React.FC = () => {
    const [agentName, setAgentName] = useState('');
    const [agentTicker, setAgentTicker] = useState('');
    const [status, setStatus] = useState('');

    const handleLaunch = async () => {
        setStatus('Launching agent...');
        try {
            const response = await axios.post(`${BACKEND_URL}/api/launch-agent`, { agentName, agentTicker });
            setStatus(`Agent launched with mock ID: ${response.data.agentId}`);
        } catch (error) {
            console.error("Failed to launch agent:", error);
            setStatus('Failed to launch agent. See console for details.');
        }
    };

    return (
        <div className="container card">
            <h2>Launch a New Agent (Simulated)</h2>
            <p>This interface simulates the launching of a new agent on the BitAgent launchpad.</p>
            
            <div className="form-group">
                <label>Agent Name</label>
                <input
                    type="text"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="input"
                    placeholder="My Continuum Agent"
                />
            </div>
            
            <div className="form-group">
                <label>Agent Ticker</label>
                <input
                    type="text"
                    value={agentTicker}
                    onChange={(e) => setAgentTicker(e.target.value)}
                    className="input"
                    placeholder="MCA"
                />
            </div>

            <Button onClick={handleLaunch}>Launch Agent</Button>

            {status && <p style={{marginTop: '20px'}}>{status}</p>}
        </div>
    );
};
