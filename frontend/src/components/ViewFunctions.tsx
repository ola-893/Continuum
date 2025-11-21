import React, { useState } from 'react';
import {
    getStreamInfo,
    getAssetStreamId,
    isAssetRegistered,
    getStreamStatus,
    getUserComplianceStatus,
    canParticipate,
    getClaimableBalance
} from '../services/aptosService';
import { ASSET_TYPES } from '../config/constants';

const ViewFunctions: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string>('');

    // Form states
    const [streamRegistryAddr, setStreamRegistryAddr] = useState('');
    const [streamId, setStreamId] = useState<number>(0);
    const [yieldRegistryAddr, setYieldRegistryAddr] = useState('');
    const [tokenAddr, setTokenAddr] = useState('');
    const [complianceAddr, setComplianceAddr] = useState('');
    const [userAddr, setUserAddr] = useState('');
    const [assetType, setAssetType] = useState<number>(ASSET_TYPES.REAL_ESTATE);

    const handleGetStreamInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const info = await getStreamInfo(streamRegistryAddr, streamId);
            setResult({
                type: 'Stream Info',
                data: info
            });
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGetAssetStreamId = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const id = await getAssetStreamId(yieldRegistryAddr, tokenAddr);
            setResult({
                type: 'Asset Stream ID',
                data: { streamId: id }
            });
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleIsAssetRegistered = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const registered = await isAssetRegistered(yieldRegistryAddr, tokenAddr);
            setResult({
                type: 'Asset Registration Status',
                data: { isRegistered: registered }
            });
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGetStreamStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const status = await getStreamStatus(streamRegistryAddr, complianceAddr, streamId);
            setResult({
                type: 'Stream Status',
                data: status
            });
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGetUserCompliance = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const status = await getUserComplianceStatus(complianceAddr, userAddr);
            setResult({
                type: 'User Compliance Status',
                data: status
            });
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleCanParticipate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const can = await canParticipate(complianceAddr, userAddr, assetType);
            setResult({
                type: 'Can Participate',
                data: { canParticipate: can, assetType }
            });
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGetClaimable = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const claimable = await getClaimableBalance(streamRegistryAddr, streamId);
            setResult({
                type: 'Claimable Balance',
                data: { claimable }
            });
        } catch (err: any) {
            setError(`Error: ${err.message || err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section">
            <h2>View Functions (Read-Only Queries)</h2>

            {/* Get Stream Info */}
            <div className="card">
                <h3>Get Stream Info</h3>
                <form onSubmit={handleGetStreamInfo}>
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
                        <label>Stream ID:</label>
                        <input
                            type="number"
                            value={streamId}
                            onChange={(e) => setStreamId(Number(e.target.value))}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading}>Query</button>
                </form>
            </div>

            {/* Get Asset Stream ID */}
            <div className="card">
                <h3>Get Asset Stream ID</h3>
                <form onSubmit={handleGetAssetStreamId}>
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
                        <label>Token/NFT Address:</label>
                        <input
                            type="text"
                            value={tokenAddr}
                            onChange={(e) => setTokenAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading}>Query</button>
                </form>
            </div>

            {/* Is Asset Registered */}
            <div className="card">
                <h3>Check Asset Registration</h3>
                <form onSubmit={handleIsAssetRegistered}>
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
                        <label>Token/NFT Address:</label>
                        <input
                            type="text"
                            value={tokenAddr}
                            onChange={(e) => setTokenAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading}>Query</button>
                </form>
            </div>

            {/* Get Stream Status */}
            <div className="card">
                <h3>Get Stream Status</h3>
                <form onSubmit={handleGetStreamStatus}>
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
                        <label>Stream ID:</label>
                        <input
                            type="number"
                            value={streamId}
                            onChange={(e) => setStreamId(Number(e.target.value))}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading}>Query</button>
                </form>
            </div>

            {/* Get User Compliance Status */}
            <div className="card">
                <h3>Get User Compliance Status</h3>
                <form onSubmit={handleGetUserCompliance}>
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
                        <label>User Address:</label>
                        <input
                            type="text"
                            value={userAddr}
                            onChange={(e) => setUserAddr(e.target.value)}
                            placeholder="0x..."
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading}>Query</button>
                </form>
            </div>

            {/* Can Participate */}
            <div className="card">
                <h3>Check Participation Authorization</h3>
                <form onSubmit={handleCanParticipate}>
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
                        <label>Asset Type:</label>
                        <select
                            value={assetType}
                            onChange={(e) => setAssetType(Number(e.target.value))}
                        >
                            <option value={ASSET_TYPES.REAL_ESTATE}>Real Estate (1)</option>
                            <option value={ASSET_TYPES.SECURITIES}>Securities (2)</option>
                            <option value={ASSET_TYPES.COMMODITIES}>Commodities (3)</option>
                            <option value={ASSET_TYPES.ART}>Art (4)</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading}>Query</button>
                </form>
            </div>

            {/* Get Claimable Balance */}
            <div className="card">
                <h3>Get Claimable Balance</h3>
                <form onSubmit={handleGetClaimable}>
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
                        <label>Stream ID:</label>
                        <input
                            type="number"
                            value={streamId}
                            onChange={(e) => setStreamId(Number(e.target.value))}
                            required
                        />
                    </div>
                    <button type="submit" disabled={loading}>Query</button>
                </form>
            </div>

            {/* Results Display */}
            {result && (
                <div className="card">
                    <h3>Query Result: {result.type}</h3>
                    <pre style={{
                        background: '#333',
                        padding: '1rem',
                        borderRadius: '4px',
                        overflow: 'auto'
                    }}>
                        {JSON.stringify(result.data, null, 2)}
                    </pre>
                </div>
            )}

            {error && <div className="error">{error}</div>}
        </div>
    );
};

export default ViewFunctions;
