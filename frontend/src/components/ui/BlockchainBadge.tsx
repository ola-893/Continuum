// frontend/src/components/ui/BlockchainBadge.tsx
import React from 'react';
import { Shield, ExternalLink, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface BlockchainBadgeProps {
    /** Type of blockchain operation */
    type: 'registered' | 'pending' | 'failed' | 'identity' | 'transaction';
    /** Transaction hash (for transaction type) */
    txHash?: string;
    /** Agent ID or wallet address */
    identifier?: string;
    /** Show link to blockchain explorer */
    showLink?: boolean;
    /** Compact mode */
    compact?: boolean;
    /** Custom label */
    label?: string;
}

const BSC_TESTNET_EXPLORER = 'https://testnet.bscscan.com';

export const BlockchainBadge: React.FC<BlockchainBadgeProps> = ({
    type,
    txHash,
    identifier,
    showLink = true,
    compact = false,
    label,
}) => {
    const getConfig = () => {
        switch (type) {
            case 'registered':
                return {
                    icon: <CheckCircle size={compact ? 12 : 14} />,
                    color: 'rgb(34, 197, 94)',
                    bgColor: 'rgba(34, 197, 94, 0.1)',
                    borderColor: 'rgba(34, 197, 94, 0.3)',
                    text: label || 'Registered On-Chain',
                    tooltip: 'This agent is registered on BNB Chain blockchain. The registration is permanent and verifiable.',
                };
            case 'pending':
                return {
                    icon: <Clock size={compact ? 12 : 14} />,
                    color: 'rgb(251, 191, 36)',
                    bgColor: 'rgba(251, 191, 36, 0.1)',
                    borderColor: 'rgba(251, 191, 36, 0.3)',
                    text: label || 'Transaction Pending',
                    tooltip: 'Blockchain transaction is being processed. This usually takes 3-5 seconds.',
                };
            case 'failed':
                return {
                    icon: <XCircle size={compact ? 12 : 14} />,
                    color: 'rgb(239, 68, 68)',
                    bgColor: 'rgba(239, 68, 68, 0.1)',
                    borderColor: 'rgba(239, 68, 68, 0.3)',
                    text: label || 'Transaction Failed',
                    tooltip: 'Blockchain transaction failed. This could be due to insufficient gas or network issues.',
                };
            case 'identity':
                return {
                    icon: <Shield size={compact ? 12 : 14} />,
                    color: 'rgb(139, 92, 246)',
                    bgColor: 'rgba(139, 92, 246, 0.1)',
                    borderColor: 'rgba(139, 92, 246, 0.3)',
                    text: label || 'Blockchain Identity',
                    tooltip: 'This agent has a unique blockchain identity that is cryptographically secured and verifiable on BNB Chain.',
                };
            case 'transaction':
                return {
                    icon: <Shield size={compact ? 12 : 14} />,
                    color: 'rgb(59, 130, 246)',
                    bgColor: 'rgba(59, 130, 246, 0.1)',
                    borderColor: 'rgba(59, 130, 246, 0.3)',
                    text: label || 'View Transaction',
                    tooltip: 'Click to view this transaction on BSC Testnet Explorer',
                };
        }
    };

    const config = getConfig();

    const badge = (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-xs)',
                padding: compact ? '2px 6px' : '4px 10px',
                backgroundColor: config.bgColor,
                border: `1px solid ${config.borderColor}`,
                borderRadius: 'var(--radius-full)',
                color: config.color,
                fontSize: compact ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                fontWeight: 500,
                cursor: showLink && txHash ? 'pointer' : 'default',
                transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
                if (showLink && txHash) {
                    e.currentTarget.style.backgroundColor = config.bgColor.replace('0.1', '0.2');
                }
            }}
            onMouseLeave={(e) => {
                if (showLink && txHash) {
                    e.currentTarget.style.backgroundColor = config.bgColor;
                }
            }}
            onClick={() => {
                if (showLink && txHash) {
                    window.open(`${BSC_TESTNET_EXPLORER}/tx/${txHash}`, '_blank', 'noopener,noreferrer');
                }
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {config.icon}
            </div>
            <span>{config.text}</span>
            {showLink && txHash && (
                <ExternalLink size={compact ? 10 : 12} />
            )}
        </div>
    );

    if (config.tooltip) {
        return (
            <Tooltip content={config.tooltip} showIcon={false}>
                {badge}
            </Tooltip>
        );
    }

    return badge;
};

