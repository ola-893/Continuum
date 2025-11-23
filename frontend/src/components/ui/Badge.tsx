import React from 'react';
import { CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export interface BadgeProps {
    children: React.ReactNode;
    variant?: 'success' | 'warning' | 'error' | 'info';
    showIcon?: boolean;
    className?: string;
}

const iconMap = {
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
    info: CheckCircle,
};

export const Badge: React.FC<BadgeProps> = ({
    children,
    variant = 'info',
    showIcon = true,
    className = '',
}) => {
    const variantClass = `badge-${variant}`;
    const Icon = iconMap[variant];

    return (
        <span className={`badge ${variantClass} ${className}`}>
            {showIcon && <Icon size={12} />}
            {children}
        </span>
    );
};
