import React, { useState } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { createRealEstateStream, claimYield, flashAdvance } from '../services/aptosService';
import { ASSET_TYPES, ONE_APT, THIRTY_DAYS_SECONDS } from '../config/constants';

const StreamManagement: React.FC = () => {
    const { account } = useWallet();
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<string>('');
    const [error, setError] = useState<string>('');

    // Create Stream Form
    const [streamRegistryAddr, setStreamRegistryAddr] = useState('');
    const [yieldRegistryAddr, setYieldRegistryAddr] = useState('');
    const [complianceAddr, setComplianceAddr] = useState('');
    const [tokenAddr, setTokenAddr] = useState('');
    const [totalYield, setTotalYield] = useState(10 * ONE_APT); // 10 APT default
    const [duration, setDuration] = useState(THIRTY_DAYS_SECONDS); // 30 days default

    // Claim Yield Form
    const [claimStreamRegistry, setClaimStreamRegistry] = useState('');
    const [claimYieldRegistry, setClaimYieldRegistry] = useState('');
    const [claimCompliance, setClaimCompliance] = useState('');
    const [claimTokenAddr, setClaimTokenAddr] = useState('');
    const [claimAssetType, setClaimAssetType] = useState<number>(ASSET_TYPES.REAL_ESTATE);

    // Flash Advance Form
    const [flashStreamRegistry, setFlashStreamRegistry] = useState('');
    const [flashYieldRegistry, setFlashYieldRegistry] = useState('');
    const [flashCompliance, setFlashCompliance] = useState('');
    const [flashTokenAddr, setFlashTokenAddr] = useState('');
    const [flashAmount, setFlashAmount] = useState(0.5 * ONE_APT); // 0.5 APT default
    const [flashAssetType, setFlashAssetType] = useState<number>(ASSET_TYPES.REAL_ESTATE);

    const handleCreateStream = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError('');
        setResult('');

        try {
            const txn = await createRealEstateStream(
                account,
                streamRegistryAddr,
                yieldRegistryAddr,
                complianceAddr,
                tokenAddr,
                totalYield,
                duration
            );
            setResult(`Stream created! Transaction: ${txn.hash}`);
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleClaimYield = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError('');
        setResult('');

        try {
            const txn = await claimYield(
                account,
                claimStreamRegistry,
                claimYieldRegistry,
                claimCompliance,
                claimTokenAddr,
                claimAssetType
            );
            setResult(`Yield claimed! Transaction: ${txn.hash}`);
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFlashAdvance = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!account) {
            setError('Please connect your wallet first');
            return;
        }

        setLoading(true);
        setError('');
        setResult('');

        try {
            const txn = await flashAdvance(
                account,
                flashStreamRegistry,
                flashYieldRegistry,
                flashCompliance,
                flashTokenAddr,
                flashAmount,
                flashAssetType
            );
            setResult(`Flash advance executed! Transaction: ${txn.hash}`);
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section">
            <h2>Stream Management</h2>

            {/* Create Real Estate Stream */}
            <div className="card">
                <h3>Create Real Estate Stream</h3>
                <form onSubmit={handleCreateStream}>
                    <div className="form-group">
                        <label>Stream Registry Address:</label>
                        <input
                            type="text"
                            value={streamRegistryAddr}
                            onChange={(e) => setStreamRegistryAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Yield Registry Address:</label>
                        <input
                            type="text"
                            value={yieldRegistryAddr}
                            onChange={(e) => setYieldRegistryAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Compliance Address:</label>
                        <input
                            type="text"
                            value={complianceAddr}
                            onChange={(e) => setComplianceAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Token/NFT Object Address:</label>
                        <input
                            type="text"
                            value={tokenAddr}
                            onChange={(e) => setTokenAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Total Yield (in octas, 1 APT = 100000000):</label>
                        <input
                            type="number"
                            value={totalYield}
                            onChange={(e) => setTotalYield(Number(e.target.value))}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Duration (in seconds):</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(Number(e.target.value))}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading || !account}>
                        {loading ? 'Creating...' : 'Create Stream'}
                    </button>
                </form>
            </div>

            {/* Claim Yield */}
            <div className="card">
                <h3>Claim Yield</h3>
                <form onSubmit={handleClaimYield}>
                    <div className="form-group">
                        <label>Stream Registry Address:</label>
                        <input
                            type="text"
                            value={claimStreamRegistry}
                            onChange={(e) => setClaimStreamRegistry(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Yield Registry Address:</label>
                        <input
                            type="text"
                            value={claimYieldRegistry}
                            onChange={(e) => setClaimYieldRegistry(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Compliance Address:</label>
                        <input
                            type="text"
                            value={claimCompliance}
                            onChange={(e) => setClaimCompliance(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Token/NFT Object Address:</label>
                        <input
                            type="text"
                            value={claimTokenAddr}
                            onChange={(e) => setClaimTokenAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Asset Type:</label>
                        <select
                            value={claimAssetType}
                            onChange={(e) => setClaimAssetType(Number(e.target.value))}
                        >
                            <option value={ASSET_TYPES.REAL_ESTATE}>Real Estate (1)</option>
                            <option value={ASSET_TYPES.SECURITIES}>Securities (2)</option>
                            <option value={ASSET_TYPES.COMMODITIES}>Commodities (3)</option>
                            <option value={ASSET_TYPES.ART}>Art (4)</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading || !account}>
                        {loading ? 'Claiming...' : 'Claim Yield'}
                    </button>
                </form>
            </div>

            {/* Flash Advance */}
            <div className="card">
                <h3>Flash Advance</h3>
                <form onSubmit={handleFlashAdvance}>
                    <div className="form-group">
                        <label>Stream Registry Address:</label>
                        <input
                            type="text"
                            value={flashStreamRegistry}
                            onChange={(e) => setFlashStreamRegistry(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Yield Registry Address:</label>
                        <input
                            type="text"
                            value={flashYieldRegistry}
                            onChange={(e) => setFlashYieldRegistry(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Compliance Address:</label>
                        <input
                            type="text"
                            value={flashCompliance}
                            onChange={(e) => setFlashCompliance(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Token/NFT Object Address:</label>
                        <input
                            type="text"
                            value={flashTokenAddr}
                            onChange={(e) => setFlashTokenAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Amount Requested (in octas):</label>
                        <input
                            type="number"
                            value={flashAmount}
                            onChange={(e) => setFlashAmount(Number(e.target.value))}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Asset Type:</label>
                        <select
                            value={flashAssetType}
                            onChange={(e) => setFlashAssetType(Number(e.target.value))}
                        >
                            <option value={ASSET_TYPES.REAL_ESTATE}>Real Estate (1)</option>
                            <option value={ASSET_TYPES.SECURITIES}>Securities (2)</option>
                            <option value={ASSET_TYPES.COMMODITIES}>Commodities (3)</option>
                            <option value={ASSET_TYPES.ART}>Art (4)</option>
                        </select>
                    </div>

                    <button type="submit" disabled={loading || !account}>
                        {loading ? 'Requesting...' : 'Request Flash Advance'}
                    </button>
                </form>
            </div>

            {result && <div className="success">{result}</div>}
            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default StreamManagement;
