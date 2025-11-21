import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { registerIdentity, whitelistAddress } from '../services/aptosService';
import { ASSET_TYPES } from '../config/constants';

const ComplianceSetup: React.FC = () => {
    const { account } = useWallet();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');

    // KYC Form state
    const [complianceAddr, setComplianceAddr] = useState('');
    const [userAddr, setUserAddr] = useState('');
    const [jurisdiction, setJurisdiction] = useState('US');
    const [verificationLevel, setVerificationLevel] = useState(1);
    const [expiryTime, setExpiryTime] = useState(1999999999);

    // Whitelist Form state
    const [whitelistComplianceAddr, setWhitelistComplianceAddr] = useState('');
    const [whitelistUserAddr, setWhitelistUserAddr] = useState('');
    const [selectedAssetTypes, setSelectedAssetTypes] = useState<number[]>([ASSET_TYPES.REAL_ESTATE]);

    const handleRegisterKYC = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError('');
        setResult('');

        try {
            const txn = await registerIdentity(
                account,
                complianceAddr,
                userAddr,
                true, // isKycVerified
                jurisdiction,
                verificationLevel,
                expiryTime
            );
            setResult(`KYC registered! Transaction: ${txn.hash}`);
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleWhitelist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError('');
        setResult('');

        try {
            const txn = await whitelistAddress(
                account,
                whitelistComplianceAddr,
                whitelistUserAddr,
                selectedAssetTypes
            );
            setResult(`Address whitelisted! Transaction: ${txn.hash}`);
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleAssetType = (assetType: number) => {
        if (selectedAssetTypes.includes(assetType)) {
            setSelectedAssetTypes(selectedAssetTypes.filter(t => t !== assetType));
        } else {
            setSelectedAssetTypes([...selectedAssetTypes, assetType]);
        }
    };

    return (
        <div className="section">
            <h2>Compliance Setup</h2>

            {/* Register KYC */}
            <div className="card">
                <h3>Register Identity (KYC)</h3>
                <form onSubmit={handleRegisterKYC}>
                    <div className="form-group">
                        <label>Compliance Registry Address:</label>
                        <input
                            type="text"
                            value={complianceAddr}
                            onChange={(e) => setComplianceAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>User Address:</label>
                        <input
                            type="text"
                            value={userAddr}
                            onChange={(e) => setUserAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Jurisdiction:</label>
                        <input
                            type="text"
                            value={jurisdiction}
                            onChange={(e) => setJurisdiction(e.target.value)}
                            placeholder="US"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Verification Level:</label>
                        <input
                            type="number"
                            value={verificationLevel}
                            onChange={(e) => setVerificationLevel(Number(e.target.value))}
                            min="1"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Expiry Time (Unix timestamp):</label>
                        <input
                            type="number"
                            value={expiryTime}
                            onChange={(e) => setExpiryTime(Number(e.target.value))}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading || !account}>
                        {loading ? 'Registering...' : 'Register KYC'}
                    </button>
                </form>
            </div>

            {/* Whitelist Address */}
            <div className="card">
                <h3>Whitelist Address</h3>
                <form onSubmit={handleWhitelist}>
                    <div className="form-group">
                        <label>Compliance Registry Address:</label>
                        <input
                            type="text"
                            value={whitelistComplianceAddr}
                            onChange={(e) => setWhitelistComplianceAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>User Address to Whitelist:</label>
                        <input
                            type="text"
                            value={whitelistUserAddr}
                            onChange={(e) => setWhitelistUserAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Asset Types:</label>
                        <div>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedAssetTypes.includes(ASSET_TYPES.REAL_ESTATE)}
                                    onChange={() => toggleAssetType(ASSET_TYPES.REAL_ESTATE)}
                                />
                                {' '}Real Estate (1)
                            </label>
                            <br />
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedAssetTypes.includes(ASSET_TYPES.SECURITIES)}
                                    onChange={() => toggleAssetType(ASSET_TYPES.SECURITIES)}
                                />
                                {' '}Securities (2)
                            </label>
                            <br />
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedAssetTypes.includes(ASSET_TYPES.COMMODITIES)}
                                    onChange={() => toggleAssetType(ASSET_TYPES.COMMODITIES)}
                                />
                                {' '}Commodities (3)
                            </label>
                            <br />
                            <label>
                                <input
                                    type="checkbox"
                                    checked={selectedAssetTypes.includes(ASSET_TYPES.ART)}
                                    onChange={() => toggleAssetType(ASSET_TYPES.ART)}
                                />
                                {' '}Art (4)
                            </label>
                        </div>
                    </div>

                    <button type="submit" disabled={loading || !account || selectedAssetTypes.length === 0}>
                        {loading ? 'Whitelisting...' : 'Whitelist Address'}
                    </button>
                </form>
            </div>

            {result && <div className="success">{result}</div>}
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default ComplianceSetup;
