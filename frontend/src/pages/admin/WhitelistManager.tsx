// WhitelistManager.tsx
import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { ContinuumService } from '../../services/continuumService';

export const WhitelistManager: React.FC = () => {
    const [userAddress, setUserAddress] = useState('');
    const [isWhitelisted, setIsWhitelisted] = useState(false);
    const [status, setStatus] = useState('');

    const checkWhitelistStatus = async () => {
        if (userAddress) {
            try {
                const whitelisted = await ContinuumService.isWhitelisted(userAddress);
                setIsWhitelisted(whitelisted);
            } catch (error) {
                console.error("Failed to check whitelist status:", error);
            }
        }
    };

    const handleAddToWhitelist = async () => {
        setStatus('Adding to whitelist...');
        try {
            await ContinuumService.addToWhitelist(userAddress);
            setStatus('Successfully added to whitelist!');
            checkWhitelistStatus();
        } catch (error) {
            console.error("Failed to add to whitelist:", error);
            setStatus('Failed to add to whitelist. See console for details.');
        }
    };

    const handleRemoveFromWhitelist = async () => {
        setStatus('Removing from whitelist...');
        try {
            await ContinuumService.removeFromWhitelist(userAddress);
            setStatus('Successfully removed from whitelist!');
            checkWhitelistStatus();
        } catch (error) {
            console.error("Failed to remove from whitelist:", error);
            setStatus('Failed to remove from whitelist. See console for details.');
        }
    };

    return (
        <div className="card">
            <h2>Whitelist Manager</h2>
            <p>Add or remove users from the whitelist for creating property streams.</p>
            
            <div className="form-group">
                <label>User Address</label>
                <input
                    type="text"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    className="input"
                    placeholder="0x..."
                />
                <Button onClick={checkWhitelistStatus} variant="secondary" style={{marginTop: '10px'}}>Check Status</Button>
            </div>
            
            {userAddress && <p>Status: {isWhitelisted ? 'Whitelisted' : 'Not Whitelisted'}</p>}

            <div style={{ display: 'flex', gap: 'var(--spacing-md)', marginTop: '20px' }}>
                <Button onClick={handleAddToWhitelist} disabled={!userAddress || isWhitelisted}>Add to Whitelist</Button>
                <Button onClick={handleRemoveFromWhitelist} disabled={!userAddress || !isWhitelisted} variant="danger">Remove from Whitelist</Button>
            </div>

            {status && <p style={{marginTop: '20px'}}>{status}</p>}
        </div>
    );
};
