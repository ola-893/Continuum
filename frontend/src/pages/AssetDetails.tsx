import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react'; // Corrected to use named export QRCodeSVG
import { ArrowLeft, Zap, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LiveBalance } from '../components/ui/LiveBalance';
import { StreamVisualization } from '../components/ui/StreamVisualization';
import { FlashAdvanceModal } from '../components/ui/FlashAdvanceModal';
import { formatCurrency } from '../utils/formatting';
import { useContinuum } from '../hooks/useContinuum';
import { useAssetStream } from '../hooks/useRealAssetStream';
import { fetchIpfsMetadata, IPFS_GATEWAY } from '../utils/ipfs';
import { CONTRACT_CONFIG } from '../config/contracts';
import { StreamInfo as EVMStreamInfo } from '../types/continuum'; 
import { ethers } from 'ethers';
import { ContinuumService } from '../services/continuumService'; 

interface AssetMetadata {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string | number }>;
}

interface FlashAdvanceAsset {
    tokenAddress: string;
    tokenId: number;
    title: string;
    streamId?: number;
    streamInfo?: { 
        flowRate: number;
        totalAmount: number;
        amountWithdrawn: number;
        isActive: boolean;
    };
}

export const AssetDetails: React.FC = () => {
    const { tokenId: tokenIdParam } = useParams<{ tokenId: string }>();
    const navigate = useNavigate();
    const { claimYield, flashAdvance, loading: continuumLoading } = useContinuum();
    const [showFlashModal, setShowFlashModal] = useState(false);
    const [txStatus, setTxStatus] = useState('');
    const [assetMetadata, setAssetMetadata] = useState<AssetMetadata | null>(null);
    const [currentStreamStatus, setCurrentStreamStatus] = useState<{ claimable: number, escrowBalance: number, remaining: number, isFrozen: boolean } | null>(null); 

    const numericTokenId = Number(tokenIdParam);
    const { streamId, streamInfo, loading: loadingAsset, error } = useAssetStream(tokenIdParam || null);

    useEffect(() => {
        const fetchLiveStreamStatus = async () => {
            if (streamId) {
                try {
                    const status = await ContinuumService.getStreamStatus(streamId);
                    setCurrentStreamStatus({
                        claimable: Number(ethers.formatUnits(status.claimable, 18)),
                        escrowBalance: Number(ethers.formatUnits(status.escrowBalance, 18)),
                        remaining: Number(ethers.formatUnits(status.remaining, 18)),
                        isFrozen: status.isFrozen,
                    });
                } catch (err) {
                    console.error('Error fetching live stream status:', err);
                    setCurrentStreamStatus(null);
                }
            }
        };
        fetchLiveStreamStatus();
        const interval = setInterval(fetchLiveStreamStatus, 5000); 
        return () => clearInterval(interval);
    }, [streamId]);

    const liveBalanceStreamInfo: EVMStreamInfo | null = streamInfo ? {
        sender: streamInfo.sender,
        recipient: streamInfo.recipient,
        totalAmount: streamInfo.totalAmount,
        flowRate: streamInfo.flowRate,
        startTime: streamInfo.startTime,
        stopTime: streamInfo.stopTime,
        amountWithdrawn: streamInfo.amountWithdrawn,
        isActive: streamInfo.isActive,
    } : null;

    useEffect(() => {
        const getIpfsData = async () => {
            if (streamInfo?.metadataUri) {
                const metadata = await fetchIpfsMetadata(streamInfo.metadataUri);
                if (metadata) {
                    if (metadata.image && metadata.image.startsWith('ipfs://')) {
                        metadata.image = `${IPFS_GATEWAY}${metadata.image.replace('ipfs://', '')}`;
                    }
                    setAssetMetadata(metadata);
                }
            }
        };
        getIpfsData();
    }, [streamInfo?.metadataUri]);

    const handleClaimYield = async () => {
        if (!streamId) {
            setTxStatus("Error: Stream ID not available for claiming.");
            return;
        }
        setTxStatus('Preparing claim transaction...');
        try {
            await claimYield(streamId);
            setTxStatus('Successfully claimed all available yield!');
        } catch (err: any) {
            console.error('Claim failed:', err);
            setTxStatus(`Claim failed: ${err?.message || 'Please try again'}`);
        }
    };

    const handleFlashAdvance = async (amount: number) => {
        if (!streamId) {
            setTxStatus("Error: Stream ID not available for flash advance.");
            return;
        }
        setTxStatus('Preparing flash advance...');
        try {
            await flashAdvance(streamId, amount);
            setTxStatus(`Flash advance of ${amount} BUSD/USDC successful! Remember to repay.`);
            setShowFlashModal(false);
        }
        catch (err: any) {
            console.error('Flash advance failed:', err);
            setTxStatus(`Flash advance failed: ${err?.message || 'Please try again'}`);
        }
    };

    if (loadingAsset) return <div className="container card text-center p-xl">Loading asset data...</div>;
    if (!streamInfo || error) return <div className="container card text-center p-xl">{error || 'Asset not found'}</div>;

    const getAssetTypeName = (type: number | undefined) => {
        switch (type) {
            case 0: return 'Real Estate';
            case 1: return 'Vehicle';
            case 2: return 'Commodities';
            default: return 'Unknown Asset';
        }
    };

    const assetForModal: FlashAdvanceAsset = {
        tokenAddress: CONTRACT_CONFIG.TOKEN_REGISTRY_ADDRESS,
        tokenId: numericTokenId,
        title: assetMetadata?.name || `Asset #${tokenIdParam?.slice(0, 6)}...`,
        streamId: streamId || undefined,
        streamInfo: liveBalanceStreamInfo ? {
            flowRate: liveBalanceStreamInfo.flowRate,
            totalAmount: liveBalanceStreamInfo.totalAmount,
            amountWithdrawn: liveBalanceStreamInfo.amountWithdrawn,
            isActive: liveBalanceStreamInfo.isActive,
        } : undefined,
    };

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-2xl)', paddingBottom: 'var(--spacing-2xl)' }}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Button variant="ghost" leftIcon={<ArrowLeft size={18} />} onClick={() => navigate('/dashboard')} style={{ marginBottom: 'var(--spacing-xl)' }}>
                    Back to Dashboard
                </Button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-xl">
                    <div className="md:col-span-2 space-y-xl">
                        <div className="card" style={{ height: '450px', background: assetMetadata?.image ? `url(${assetMetadata.image}) center/cover` : 'var(--gradient-primary)' }} />
                        <div className="card">
                            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Asset Details</h3>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-lg)' }}>{assetMetadata?.description || 'No description available.'}</p>
                            <div className="grid grid-cols-2 gap-lg">
                                <div className="flex justify-between items-center"><span className="text-secondary">Asset Type</span><Badge variant="info">{getAssetTypeName(streamInfo.assetType)}</Badge></div>
                                <div className="flex justify-between items-center"><span className="text-secondary">Owner</span><span>You</span></div>
                                {(assetMetadata?.attributes || []).map(attr => (
                                    <div key={attr.trait_type} className="flex justify-between items-center"><span className="text-secondary">{attr.trait_type}</span><span>{attr.value}</span></div>
                                ))}
                                <div className="flex justify-between items-center col-span-2"><span className="text-secondary">Token ID</span><a href={`https://testnet.bscscan.com/token/${CONTRACT_CONFIG.TOKEN_REGISTRY_ADDRESS}?a=${numericTokenId}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-xs text-primary">{tokenIdParam?.slice(0, 10)}...{tokenIdParam?.slice(-8)} <ExternalLink size={14} /></a></div>
                                <div className="flex justify-between items-center col-span-2"><span className="text-secondary">Metadata URI</span><a href={streamInfo.metadataUri ? `${IPFS_GATEWAY}${streamInfo.metadataUri.replace('ipfs://', '')}` : '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-xs text-primary">{streamInfo.metadataUri} <ExternalLink size={14} /></a></div>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-xl">
                        <div className="card">
                            <div className="flex justify-between items-center mb-md">
                                <h2>{assetMetadata?.name || `Asset #${tokenIdParam?.slice(0, 6)}...`}</h2>
                                <Badge variant={streamInfo.isActive ? 'success' : 'warning'}>Stream #{streamId}</Badge>
                            </div>
                            {liveBalanceStreamInfo && <LiveBalance streamInfo={liveBalanceStreamInfo} showRate decimals={4} />}
                        </div>
                        <div className="card">
                            <h4>Stream Overview</h4>
                            {streamInfo && <StreamVisualization streamInfo={liveBalanceStreamInfo || null} />}
                            <div className="flex justify-between mt-md">
                                <span className="text-secondary">Total Streamed</span>
                                <span className="font-semibold text-primary">
                                    {formatCurrency(streamInfo.amountWithdrawn, 2)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">Total Value Locked</span>
                                <span>{formatCurrency(streamInfo.totalAmount, 2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">Claimable (Live)</span>
                                <span className="font-semibold text-success">
                                    {currentStreamStatus ? formatCurrency(currentStreamStatus.claimable, 2) : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-secondary">Remaining to Vest</span>
                                <span className="text-secondary">
                                    {currentStreamStatus ? formatCurrency(currentStreamStatus.remaining, 2) : 'N/A'}
                                </span>
                            </div>
                        </div>
                        <div className="card">
                            <h4>Scan for Details</h4>
                            <div className="flex justify-center p-md">
                                {streamInfo.metadataUri && <QRCodeSVG value={streamInfo.metadataUri} size={200} level="H" includeMargin />}
                            </div>
                        </div>
                        {txStatus && (
                            <div className="card" style={{ marginBottom: 'var(--spacing-lg)', background: txStatus.includes('Success') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', border: `1px solid ${txStatus.includes('Success') ? 'var(--color-success)' : 'var(--color-danger)'}` }}>
                                <p style={{ color: txStatus.includes('Success') ? 'var(--color-success)' : 'var(--color-danger)' }}>{txStatus}</p>
                            </div>
                        )}
                         <div className="flex gap-md">
                            <Button
                                variant="secondary"
                                onClick={handleClaimYield}
                                disabled={continuumLoading}
                                isLoading={continuumLoading}
                                style={{ flex: 1 }}
                            >
                                Claim Yield
                            </Button>
                            <Button
                                variant="primary"
                                leftIcon={<Zap size={18} />}
                                onClick={() => setShowFlashModal(true)}
                                disabled={continuumLoading}
                                isLoading={continuumLoading}
                                style={{ flex: 1 }}
                            >
                                Flash Advance
                            </Button>
                        </div>
                    </div>
                </div>
            </motion.div>
            {showFlashModal && streamInfo && <FlashAdvanceModal asset={assetForModal} onClose={() => setShowFlashModal(false)} onConfirm={handleFlashAdvance} />}
        </div>
    );
};