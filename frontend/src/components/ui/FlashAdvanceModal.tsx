import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Loader2 } from 'lucide-react';
import { Button } from './Button';
import { formatCurrency, formatDuration } from '../../utils/formatting';
import { ContinuumService } from '../../services/continuumService';
import { ethers } from 'ethers';

interface Asset {
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

export interface FlashAdvanceModalProps {
    asset: Asset;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

export const FlashAdvanceModal: React.FC<FlashAdvanceModalProps> = ({ asset, onClose, onConfirm }) => {
    const [escrowBalance, setEscrowBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [amount, setAmount] = useState(0);
    const [pauseDuration, setPauseDuration] = useState(0);

    useEffect(() => {
        const fetchEscrowBalance = async () => {
            if (!asset.streamId || !asset.streamInfo) { 
                const calculatedMax = (asset.streamInfo?.totalAmount || 0) - (asset.streamInfo?.amountWithdrawn || 0); 
                setEscrowBalance(calculatedMax);
                setAmount(calculatedMax * 0.5);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const streamStatus = await ContinuumService.getStreamStatus(asset.streamId);

                if (streamStatus) {
                    const balance = Number(ethers.formatUnits(streamStatus.escrowBalance, 18)); 
                    setEscrowBalance(balance);
                    setAmount(balance * 0.5);
                } else {
                    const calculatedMax = (asset.streamInfo?.totalAmount || 0) - (asset.streamInfo?.amountWithdrawn || 0); 
                    setEscrowBalance(calculatedMax);
                    setAmount(calculatedMax * 0.5);
                }
            } catch (error) {
                console.error('Error fetching escrow balance:', error);
                const calculatedMax = (asset.streamInfo?.totalAmount || 0) - (asset.streamInfo?.amountWithdrawn || 0); 
                setEscrowBalance(calculatedMax);
                setAmount(calculatedMax * 0.5);
            } finally {
                setLoading(false);
            }
        };

        fetchEscrowBalance();
    }, [asset.streamId, asset.streamInfo]);

    useEffect(() => {
        const calculateDuration = () => {
            if (asset.streamInfo?.flowRate && asset.streamInfo.flowRate > 0) { 
                const durationSeconds = amount / asset.streamInfo.flowRate;
                setPauseDuration(durationSeconds);
            } else {
                setPauseDuration(0);
            }
        };
        calculateDuration();
    }, [amount, asset.streamInfo?.flowRate]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(parseFloat(e.target.value));
    }; // Added handleSliderChange

    const maxAdvance = escrowBalance || 0;
    const minAdvance = maxAdvance * 0.01; 
    const sliderStep = maxAdvance * 0.005;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(8px)',
                    zIndex: 9999,
                    padding: 'var(--spacing-xl)',
                }}
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.9, y: 20 }}
                    className="glass"
                    style={{
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        padding: 'var(--spacing-2xl)',
                        borderRadius: 'var(--border-radius-xl)',
                        border: '1px solid var(--color-primary)',
                        boxShadow: '0 20px 60px rgba(0, 217, 255, 0.3)',
                        position: 'relative',
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div className="flex items-center gap-sm">
                            <Zap size={24} style={{ color: 'var(--color-primary)' }} />
                            <h3>Unlock Future Yield</h3>
                        </div>
                        <button
                            onClick={onClose}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-text-secondary)',
                            }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-4xl)' }}>
                            <Loader2 size={48} style={{ color: 'var(--color-primary)', margin: '0 auto', animation: 'spin 1s linear infinite' }} />
                            <p style={{ marginTop: 'var(--spacing-lg)', color: 'var(--color-text-secondary)' }}>
                                Checking available balance in smart contract...
                            </p>
                        </div>
                    ) : (
                        <>
                            <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                                Borrow against your future earnings. The stream will automatically repay the advance.
                            </p>

                            <div
                                className="card"
                                style={{
                                    background: 'rgba(16, 185, 129, 0.1)',
                                    border: '1px solid var(--color-success)',
                                    marginBottom: 'var(--spacing-lg)',
                                    padding: 'var(--spacing-md)',
                                }}
                            >
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                    💰 Smart Contract Balance (Escrow)
                                </p>
                                <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-success)' }}>
                                    {formatCurrency(maxAdvance, 2)} Available
                                </p>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-xs)' }}>
                                    This is the actual amount held in the stream's escrow that you can borrow
                                </p>
                            </div>

                            <div
                                className="card"
                                style={{
                                    background: 'rgba(0, 217, 255, 0.1)',
                                    border: '1px solid var(--color-primary)',
                                    marginBottom: 'var(--spacing-lg)',
                                    textAlign: 'center',
                                }}
                            >
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                    You Receive Now
                                </p>
                                <p className="gradient-text" style={{ fontSize: 'var(--font-size-4xl)', fontWeight: 800 }}>
                                    {formatCurrency(amount, 2)}
                                </p>
                            </div>

                            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                                <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                    Select Amount (min: {formatCurrency(minAdvance, 2)} - max: {formatCurrency(maxAdvance, 2)})
                                </label>
                                <input
                                    type="range"
                                    min={minAdvance}
                                    max={maxAdvance}
                                    step={sliderStep}
                                    value={amount}
                                    onChange={handleSliderChange}
                                    style={{
                                        width: '100%',
                                        height: '8px',
                                        borderRadius: 'var(--radius-full)',
                                        background: 'var(--gradient-primary)',
                                        outline: 'none',
                                        opacity: 0.9,
                                        cursor: 'pointer',
                                    }}
                                />
                                <div className="flex justify-between" style={{ marginTop: 'var(--spacing-xs)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                                    <span>{formatCurrency(minAdvance, 2)}</span>
                                    <span>{formatCurrency(maxAdvance, 2)}</span>
                                </div>
                            </div>

                            <div
                                className="card"
                                style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid var(--color-warning)',
                                    marginBottom: 'var(--spacing-xl)',
                                }}
                            >
                                <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                                    Stream Will Be Paused For:
                                </p>
                                <p style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-warning)' }}>
                                    {formatDuration(pauseDuration)}
                                </p>
                                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-sm)' }}>
                                    The stream will automatically resume after the advance is fully repaid
                                </p>
                            </div>

                            <div className="flex gap-md">
                                <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    leftIcon={<Zap size={18} />}
                                    onClick={() => onConfirm(amount)}
                                    style={{ flex: 1 }}
                                    disabled={maxAdvance <= 0 || amount <= 0}
                                >
                                    Confirm Advance
                                </Button>
                            </div>
                        </>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};