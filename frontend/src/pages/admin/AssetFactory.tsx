import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { CheckCircle, UploadCloud } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { NFTMintingService } from '../../services/nftMintingService';
import { useContinuum } from '../../hooks/useContinuum';

const styles = `
  .form-label { display: block; margin-bottom: var(--spacing-xs); font-weight: 500; font-size: 14px; }
  .form-hint { font-size: var(--font-size-sm); color: var(--color-text-muted); margin-top: var(--spacing-xs); }
`;

export const AssetFactory: React.FC = () => {
    const { createYieldStream, loading } = useContinuum();
    const { isConnected } = useAccount();
    const [assetType, setAssetType] = useState(0);
    const [mintData, setMintData] = useState({ tokenName: '', description: '', imageUrl: '' });
    const [streamData, setStreamData] = useState({ totalYield: '', duration: '' });
    const [pinataJwt, setPinataJwt] = useState(import.meta.env.VITE_PINATA_JWT || ''); // Corrected import.meta.env access
    const [txStatus, setTxStatus] = useState('');
    const [currentStep, setCurrentStep] = useState(0);

    const handleMintAndCreateStream = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isConnected) {
            setTxStatus("Error: Please connect your wallet first.");
            return;
        }
        if (!pinataJwt) {
            setTxStatus("Error: Pinata JWT is required for IPFS upload.");
            return;
        }

        try {
            setCurrentStep(1);
            setTxStatus('Step 1/2: Uploading metadata to IPFS...');
            const tokenUri = await NFTMintingService.generateTokenMetadata(mintData.tokenName, mintData.description, mintData.imageUrl, [], pinataJwt);

            setCurrentStep(2);
            setTxStatus('Step 2/2: Calling smart contract to mint NFT and create stream...');
            const yieldInNumber = parseFloat(streamData.totalYield);
            const durationInSeconds = parseInt(streamData.duration) * 86400;

            await createYieldStream("0x0", yieldInNumber, durationInSeconds, assetType, tokenUri);

            setCurrentStep(0);
            setTxStatus('Success: Asset created and stream initiated!');
            setMintData({ tokenName: '', description: '', imageUrl: '' });
            setStreamData({ totalYield: '', duration: '' });

        } catch (error: any) {
            console.error('Asset creation failed:', error);
            setCurrentStep(0);
            setTxStatus(`Error: ${error?.message || 'Check console for details'}`);
        }
    };

    return (
        <div style={{ padding: 'var(--spacing-2xl)', maxWidth: '1200px', margin: '0 auto' }}>
            <style>{styles}</style>
            <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                <h1>Asset Factory</h1>
                <p className="text-secondary">Mint new Real-World Assets and create their yield streams on BNB Smart Chain.</p>
            </div>

            {txStatus && <div className="card mb-xl p-md">{txStatus}</div>}

            <form onSubmit={handleMintAndCreateStream}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
                    <div className="card md:col-span-2 p-xl">
                        <h3>1. Asset & Metadata</h3>
                        <div className="card" style={{ marginBottom: 'var(--spacing-lg)', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--color-success)' }}>
                            <p style={{ color: 'var(--color-success)' }}><CheckCircle size={16} style={{ display: 'inline', marginRight: '4px' }} />Collection is ready (Managed by RWAHub).</p>
                        </div>

                        <div className="grid grid-cols-2 gap-lg">
                            <div>
                                <label className="form-label">Asset Type</label>
                                <select className="input" value={assetType} onChange={(e) => setAssetType(parseInt(e.target.value))}>
                                    <option value={0}>Real Estate</option>
                                    <option value={1}>Vehicle</option>
                                    <option value={2}>Heavy Machinery</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">NFT Name</label>
                                <input type="text" className="input" placeholder="e.g., Downtown Office Space" value={mintData.tokenName} onChange={(e) => setMintData({ ...mintData, tokenName: e.target.value })} required />
                            </div>
                            <div className="col-span-2">
                                <label className="form-label">Description</label>
                                <textarea className="input" placeholder="Asset description" value={mintData.description} onChange={(e) => setMintData({ ...mintData, description: e.target.value })} required rows={3} />
                            </div>
                            <div className="col-span-2">
                                <label className="form-label">Image URL</label>
                                <input type="url" className="input" placeholder="https://example.com/image.jpg" value={mintData.imageUrl} onChange={(e) => setMintData({ ...mintData, imageUrl: e.target.value })} required />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-xl">
                        <div className="card p-xl">
                            <h3>2. Yield Parameters</h3>
                            <div>
                                <label className="form-label">Total Yield (BUSD/USDC)</label>
                                <input type="number" step="0.01" className="input" placeholder="1000" value={streamData.totalYield} onChange={(e) => setStreamData({ ...streamData, totalYield: e.target.value })} required />
                            </div>
                            <div className="mt-md">
                                <label className="form-label">Duration (Days)</label>
                                <input type="number" className="input" placeholder="365" value={streamData.duration} onChange={(e) => setStreamData({ ...streamData, duration: e.target.value })} required />
                            </div>
                        </div>

                        <div className="card p-xl">
                            <h3>3. IPFS Configuration</h3>
                            <div>
                                <label className="form-label">Pinata JWT</label>
                                <input type="password" className="input" placeholder="Paste your Pinata JWT" value={pinataJwt} onChange={(e) => setPinataJwt(e.target.value)} required />
                                <p className="form-hint">Required for production IPFS uploads.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-2xl">
                    {currentStep > 0 ? (
                        <div>
                            <p className="text-secondary">{txStatus}</p>
                        </div>
                    ) : (
                        <>
                            <Button type="submit" variant="primary" leftIcon={<UploadCloud size={20} />} disabled={loading || !isConnected} isLoading={loading}>
                                Create Asset & Stream
                            </Button>
                            <p className="form-hint mt-sm">This will trigger multiple transactions. Please confirm them in your wallet.</p>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
};