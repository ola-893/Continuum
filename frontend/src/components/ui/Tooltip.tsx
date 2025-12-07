// frontend/src/components/ui/Tooltip.tsx
import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
    content: string | React.ReactNode;
    children?: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
    showIcon?: boolean;
    iconSize?: number;
    maxWidth?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top',
    showIcon = true,
    iconSize = 16,
    maxWidth = '300px',
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isVisible && triggerRef.current && tooltipRef.current) {
            const triggerRect = triggerRef.current.getBoundingClientRect();
            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            
            let top = 0;
            let left = 0;

            switch (position) {
                case 'top':
                    top = triggerRect.top - tooltipRect.height - 8;
                    left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'bottom':
                    top = triggerRect.bottom + 8;
                    left = triggerRect.left + (triggerRect.width / 2) - (tooltipRect.width / 2);
                    break;
                case 'left':
                    top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                    left = triggerRect.left - tooltipRect.width - 8;
                    break;
                case 'right':
                    top = triggerRect.top + (triggerRect.height / 2) - (tooltipRect.height / 2);
                    left = triggerRect.right + 8;
                    break;
            }

            // Keep tooltip within viewport
            const padding = 8;
            if (left < padding) left = padding;
            if (left + tooltipRect.width > window.innerWidth - padding) {
                left = window.innerWidth - tooltipRect.width - padding;
            }
            if (top < padding) top = padding;
            if (top + tooltipRect.height > window.innerHeight - padding) {
                top = window.innerHeight - tooltipRect.height - padding;
            }

            setTooltipPosition({ top, left });
        }
    }, [isVisible, position]);

    return (
        <div
            ref={triggerRef}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                position: 'relative',
            }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children || (
                showIcon && (
                    <HelpCircle
                        size={iconSize}
                        style={{
                            color: 'var(--color-text-secondary)',
                            cursor: 'help',
                        }}
                    />
                )
            )}

            {isVisible && (
                <div
                    ref={tooltipRef}
                    style={{
                        position: 'fixed',
                        top: `${tooltipPosition.top}px`,
                        left: `${tooltipPosition.left}px`,
                        maxWidth,
                        padding: 'var(--spacing-sm) var(--spacing-md)',
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-text-primary)',
                        fontSize: 'var(--font-size-sm)',
                        lineHeight: 1.5,
                        zIndex: 10000,
                        pointerEvents: 'none',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                        animation: 'fadeIn 0.2s ease-out',
                    }}
                >
                    {content}
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                        transform: translateY(-4px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>
        </div>
    );
};

