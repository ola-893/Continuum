import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { Button } from './Button';
import { formatCurrency, formatDuration } from '../../utils/formatting';

interface Asset {
    tokenAddress: string;
    title: string;
    streamInfo: {
        flowRate: number;
        totalAmount: number;
        amountWithdrawn: number;
    };
}

export interface FlashAdvanceModalProps {
    asset: Asset;
    onClose: () => void;
    onConfirm: (amount: number) => void;
}

export const FlashAdvanceModal: React.FC<FlashAdvanceModalProps> = ({ asset, onClose, onConfirm }) => {
    const maxAdvance = asset.streamInfo.totalAmount - asset.streamInfo.amountWithdrawn;
    const [amount, setAmount] = useState(maxAdvance * 0.5); // Default to 50%
    const [pauseDuration, setPauseDuration] = useState(0);

    useEffect(() => {
        // Calculate pause duration based on amount and flow rate
        const durationSeconds = amount / asset.streamInfo.flowRate;
        setPauseDuration(durationSeconds);
    }, [amount, asset.streamInfo.flowRate]);

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(parseFloat(e.target.value));
    };

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
                    {/* Header */}
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

                    {/* Explanation */}
                    <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xl)' }}>
                        Borrow against your future earnings. The stream will automatically repay the advance.
                    </p>

                    {/* Amount Display */}
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

                    {/* Slider */}
                    <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <label style={{ display: 'block', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-sm)' }}>
                            Select Amount (max: {formatCurrency(maxAdvance, 2)})
                        </label>
                        <input
                            type="range"
                            min={100}
                            max={maxAdvance}
                            step={50}
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
                            <span>$100</span>
                            <span>{formatCurrency(maxAdvance, 0)}</span>
                        </div>
                    </div>

                    {/* Trade-off Display */}
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

                    {/* Action Buttons */}
                    <div className="flex gap-md">
                        <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            leftIcon={<Zap size={18} />}
                            onClick={() => onConfirm(amount)}
                            style={{ flex: 1 }}
                        >
                            Confirm Advance
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
