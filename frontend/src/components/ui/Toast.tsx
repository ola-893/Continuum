import React, { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    type: ToastType;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    message,
    duration = 5000,
    onClose,
}) => {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id);
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [id, duration, onClose]);

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} />;
            case 'error':
                return <XCircle size={20} />;
            case 'warning':
                return <AlertCircle size={20} />;
            case 'info':
                return <Info size={20} />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success':
                return {
                    bg: 'rgba(34, 197, 94, 0.1)',
                    border: 'rgba(34, 197, 94, 0.3)',
                    color: 'rgb(34, 197, 94)',
                };
            case 'error':
                return {
                    bg: 'rgba(239, 68, 68, 0.1)',
                    border: 'rgba(239, 68, 68, 0.3)',
                    color: 'rgb(239, 68, 68)',
                };
            case 'warning':
                return {
                    bg: 'rgba(251, 191, 36, 0.1)',
                    border: 'rgba(251, 191, 36, 0.3)',
                    color: 'rgb(251, 191, 36)',
                };
            case 'info':
                return {
                    bg: 'rgba(59, 130, 246, 0.1)',
                    border: 'rgba(59, 130, 246, 0.3)',
                    color: 'rgb(59, 130, 246)',
                };
        }
    };

    const colors = getColors();

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                backgroundColor: colors.bg,
                border: `1px solid ${colors.border}`,
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                minWidth: '300px',
                maxWidth: '500px',
                animation: 'slideIn 0.3s ease-out',
            }}
        >
            <div style={{ color: colors.color, flexShrink: 0 }}>
                {getIcon()}
            </div>
            <div style={{ flex: 1, color: 'var(--color-text-primary)', fontSize: 'var(--font-size-sm)' }}>
                {message}
            </div>
            <button
                onClick={() => onClose(id)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
            >
                <X size={16} />
            </button>
        </div>
    );
};
