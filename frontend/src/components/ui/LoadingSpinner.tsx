import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
    size?: number;
    color?: string;
    message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    size = 24,
    color = 'var(--color-primary)',
    message,
}) => {
    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
            }}
        >
            <Loader2
                size={size}
                style={{
                    color,
                    animation: 'spin 1s linear infinite',
                }}
            />
            {message && (
                <span
                    style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-text-secondary)',
                    }}
                >
                    {message}
                </span>
            )}
        </div>
    );
};
