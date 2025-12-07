import React from 'react';

interface ProgressBarProps {
    progress: number; // 0-100
    message?: string;
    estimatedTime?: string;
    showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    progress,
    message,
    estimatedTime,
    showPercentage = true,
}) => {
    return (
        <div
            style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--spacing-sm)',
            }}
        >
            {(message || estimatedTime) && (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: 'var(--font-size-sm)',
                    }}
                >
                    {message && (
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                            {message}
                        </span>
                    )}
                    {estimatedTime && (
                        <span style={{ color: 'var(--color-text-secondary)' }}>
                            {estimatedTime}
                        </span>
                    )}
                </div>
            )}
            <div
                style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        width: `${Math.min(100, Math.max(0, progress))}%`,
                        height: '100%',
                        background: 'var(--gradient-primary)',
                        borderRadius: 'var(--radius-full)',
                        transition: 'width 0.3s ease-out',
                        boxShadow: '0 0 10px rgba(0, 217, 255, 0.5)',
                    }}
                />
            </div>
            {showPercentage && (
                <div
                    style={{
                        textAlign: 'right',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-primary)',
                        fontWeight: 'bold',
                    }}
                >
                    {Math.round(progress)}%
                </div>
            )}
        </div>
    );
};
