import React from 'react';
import { Infinity } from 'lucide-react';

interface LoadingScreenProps {
    message?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'Loading...',
    size = 'md'
}) => {
    const iconSize = size === 'sm' ? 32 : size === 'md' ? 48 : 64;
    const containerPadding = size === 'sm' ? 'var(--spacing-lg)' : 'var(--spacing-2xl)';

    return (
        <div
            className="card"
            style={{
                padding: containerPadding,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            <div
                style={{
                    display: 'inline-block',
                    animation: 'spin 2s linear infinite',
                    marginBottom: 'var(--spacing-md)',
                }}
            >
                <Infinity
                    size={iconSize}
                    style={{ color: 'var(--color-primary)' }}
                />
            </div>
            <p style={{ color: 'var(--color-text-secondary)', margin: 0 }}>
                {message}
            </p>
        </div>
    );
};
