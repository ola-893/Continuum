import React, { useState } from 'react';
import { compliantClaimYield } from '../../services/tezosContractService';
import { mutezToTokens } from '../../services/tezosContractService';

export interface ClaimYieldButtonProps {
    tokenAddress: string;
    claimableBalance: number;
    tokenSymbol?: string;
    tokenDecimals?: number;
    onClaimSuccess?: () => void;
    onClaimError?: (error: Error) => void;
    disabled?: boolean;
    className?: string;
}

/**
 * Button component for claiming yield with transaction status display
 * - Shows claimable amount
 * - Handles transaction submission
 * - Displays transaction status (pending, success, error)
 * - Calls onClaimSuccess to reset balance display after successful claim
 */
export const ClaimYieldButton: React.FC<ClaimYieldButtonProps> = ({
    tokenAddress,
    claimableBalance,
    tokenSymbol = 'USDT',
    tokenDecimals = 6,
    onClaimSuccess,
    onClaimError,
    disabled = false,
    className = '',
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
    const [txHash, setTxHash] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const claimableTokens = mutezToTokens(claimableBalance, tokenDecimals);
    const hasClaimableBalance = claimableBalance > 0;

    const handleClaim = async () => {
        if (!hasClaimableBalance || disabled || isSubmitting) {
            return;
        }

        setIsSubmitting(true);
        setTxStatus('pending');
        setErrorMessage(null);
        setTxHash(null);

        try {
            // Submit claim transaction
            const opHash = await compliantClaimYield(tokenAddress);
            setTxHash(opHash);
            
            // Transaction submitted successfully
            setTxStatus('success');
            
            // Call success callback to refresh data
            if (onClaimSuccess) {
                onClaimSuccess();
            }
        } catch (error) {
            console.error('Error claiming yield:', error);
            setTxStatus('error');
            
            const errorMsg = error instanceof Error ? error.message : 'Failed to claim yield';
            setErrorMessage(errorMsg);
            
            if (onClaimError && error instanceof Error) {
                onClaimError(error);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const getButtonText = () => {
        if (txStatus === 'pending') {
            return 'Claiming...';
        }
        if (txStatus === 'success') {
            return '✓ Claimed Successfully';
        }
        if (!hasClaimableBalance) {
            return 'No Yield to Claim';
        }
        return `Claim ${claimableTokens.toFixed(2)} ${tokenSymbol}`;
    };

    const getButtonStyle = () => {
        if (txStatus === 'success') {
            return 'bg-success hover:bg-success/80';
        }
        if (txStatus === 'error') {
            return 'bg-error hover:bg-error/80';
        }
        if (!hasClaimableBalance || disabled) {
            return 'bg-muted cursor-not-allowed opacity-50';
        }
        return 'bg-primary hover:bg-primary/80';
    };

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Claim Button */}
            <button
                onClick={handleClaim}
                disabled={!hasClaimableBalance || disabled || isSubmitting}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${getButtonStyle()}`}
            >
                {getButtonText()}
            </button>

            {/* Transaction Status */}
            {txStatus === 'pending' && (
                <div className="bg-tertiary p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                        <div className="text-sm">
                            <div className="font-semibold">Transaction Pending</div>
                            <div className="text-xs text-muted">
                                Please confirm in your wallet and wait for confirmation...
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {txStatus === 'success' && txHash && (
                <div className="bg-success/10 border border-success/30 p-3 rounded-lg">
                    <div className="text-sm">
                        <div className="font-semibold text-success mb-1">✓ Claim Successful!</div>
                        <div className="text-xs text-muted break-all">
                            Transaction: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                        </div>
                        <a
                            href={`https://ghostnet.tzkt.io/${txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline mt-1 inline-block"
                        >
                            View on Explorer →
                        </a>
                    </div>
                </div>
            )}

            {txStatus === 'error' && errorMessage && (
                <div className="bg-error/10 border border-error/30 p-3 rounded-lg">
                    <div className="text-sm">
                        <div className="font-semibold text-error mb-1">✕ Claim Failed</div>
                        <div className="text-xs text-muted">{errorMessage}</div>
                        <button
                            onClick={() => setTxStatus('idle')}
                            className="text-xs text-primary hover:underline mt-2"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            )}

            {/* Info Text */}
            {txStatus === 'idle' && hasClaimableBalance && (
                <div className="text-xs text-muted text-center">
                    Click to claim your accumulated yield
                </div>
            )}
        </div>
    );
};
