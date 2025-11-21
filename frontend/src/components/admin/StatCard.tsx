import React from 'react';

interface StatCardProps {
    label: string;
    value: string | number;
    trend?: 'up' | 'down';
    trendValue?: string;
    glow?: boolean;
    icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    trend,
    trendValue,
    glow = false,
    icon,
}) => {
    return (
        <div
            className={`card ${glow ? 'glow-green' : ''}`}
            style={{
                padding: 'var(--spacing-lg)',
                textAlign: 'center',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
        >
            {icon && (
                <div style={{ marginBottom: 'var(--spacing-sm)', opacity: 0.7 }}>
                    {icon}
                </div>
            )}
            <div
                style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: 'var(--spacing-xs)',
                }}
            >
                {label}
            </div>
            <div
                style={{
                    fontSize: 'var(--font-size-3xl)',
                    fontWeight: 700,
                    color: glow ? 'var(--color-success)' : 'var(--color-text)',
                    marginBottom: 'var(--spacing-xs)',
                }}
            >
                {value}
            </div>
            {trend && trendValue && (
                <div
                    style={{
                        fontSize: 'var(--font-size-sm)',
                        color: trend === 'up' ? 'var(--color-success)' : 'var(--color-error)',
                    }}
                >
                    {trend === 'up' ? '↗' : '↘'} {trendValue}
                </div>
            )}
        </div>
    );
};
