import React from 'react';
import { useStreamProgress } from '../../hooks/useStreamBalance';
import type { StreamInfo } from '../../hooks/useStreamBalance';

export interface StreamVisualizationProps {
    streamInfo: StreamInfo | null;
    className?: string;
}

export const StreamVisualization: React.FC<StreamVisualizationProps> = ({
    streamInfo,
    className = '',
}) => {
    const progress = useStreamProgress(streamInfo);

    if (!streamInfo) {
        return null;
    }

    const statusColor = streamInfo.isActive ? 'var(--color-success)' : 'var(--color-warning)';
    const statusText = streamInfo.isActive ? 'Active' : 'Paused';

    return (
        <div className={`${className}`}>
            {/* Status Indicator */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-sm">
                    <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: statusColor }}
                    />
                    <span className="text-sm font-medium" style={{ color: statusColor }}>
                        {statusText}
                    </span>
                </div>
                <span className="text-sm text-muted">{progress.toFixed(1)}% Complete</span>
            </div>

            {/* Progress Bar "Water Tank" */}
            <div className="relative w-full h-3 bg-tertiary rounded-full overflow-hidden">
                <div
                    className="absolute top-0 left-0 h-full transition-all duration-1000 ease-linear"
                    style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, var(--color-primary) 0%, var(--color-secondary) 100%)`,
                        boxShadow: '0 0 10px var(--color-primary-glow)',
                    }}
                />
            </div>
        </div>
    );
};
