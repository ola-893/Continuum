import React, { useEffect, useState, useCallback } from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config/api';

/**
 * Connection Status Component
 * 
 * Displays real-time connection status for:
 * - Backend (Node.js) connection
 * - Python microservice status
 * - Memory Hub connection status
 * 
 * Features:
 * - Automatic health checks every 30 seconds
 * - Manual reconnection button
 * - Visual indicators for each service
 * - Tooltip with detailed status information
 * 
 * Requirements: 3.4, 5.4, 5.5
 */

export type ServiceStatus = 'connected' | 'disconnected' | 'checking';

export interface ConnectionStatusState {
    backend: ServiceStatus;
    pythonService: ServiceStatus;
    memoryHub: ServiceStatus;
    lastChecked: Date | null;
}

export interface ConnectionStatusProps {
    /** Check interval in milliseconds (default: 30000 = 30 seconds) */
    checkInterval?: number;
    /** Show detailed status tooltip (default: true) */
    showTooltip?: boolean;
    /** Compact mode (smaller display) */
    compact?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
    checkInterval = 30000,
    showTooltip = true,
    compact = false,
}) => {
    const [status, setStatus] = useState<ConnectionStatusState>({
        backend: 'checking',
        pythonService: 'checking',
        memoryHub: 'checking',
        lastChecked: null,
    });
    const [showDetails, setShowDetails] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    /**
     * Check backend health
     */
    const checkBackendHealth = useCallback(async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000), // 5 second timeout
            });
            return response.ok;
        } catch (error) {
            console.error('[ConnectionStatus] Backend health check failed:', error);
            return false;
        }
    }, []);

    /**
     * Check all services health via dedicated health endpoint
     */
    const checkServicesHealth = useCallback(async (): Promise<{
        pythonService: boolean;
        memoryHub: boolean;
    }> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            
            if (response.ok) {
                const data = await response.json();
                return {
                    pythonService: data.pythonService === 'connected',
                    memoryHub: data.memoryHub === 'connected',
                };
            }
            
            return { pythonService: false, memoryHub: false };
        } catch (error) {
            console.error('[ConnectionStatus] Services health check failed:', error);
            return { pythonService: false, memoryHub: false };
        }
    }, []);

    /**
     * Perform health checks for all services
     */
    const performHealthChecks = useCallback(async () => {
        setIsChecking(true);
        
        try {
            // Check backend first
            const backendHealthy = await checkBackendHealth();
            
            setStatus(prev => ({
                ...prev,
                backend: backendHealthy ? 'connected' : 'disconnected',
            }));

            // Only check Python service and Memory Hub if backend is up
            if (backendHealthy) {
                const servicesHealth = await checkServicesHealth();

                setStatus({
                    backend: 'connected',
                    pythonService: servicesHealth.pythonService ? 'connected' : 'disconnected',
                    memoryHub: servicesHealth.memoryHub ? 'connected' : 'disconnected',
                    lastChecked: new Date(),
                });
            } else {
                // Backend is down, can't check other services
                setStatus({
                    backend: 'disconnected',
                    pythonService: 'disconnected',
                    memoryHub: 'disconnected',
                    lastChecked: new Date(),
                });
            }
        } catch (error) {
            console.error('[ConnectionStatus] Health check failed:', error);
            setStatus({
                backend: 'disconnected',
                pythonService: 'disconnected',
                memoryHub: 'disconnected',
                lastChecked: new Date(),
            });
        } finally {
            setIsChecking(false);
        }
    }, [checkBackendHealth, checkServicesHealth]);

    /**
     * Manual reconnection attempt
     */
    const handleReconnect = useCallback(() => {
        performHealthChecks();
    }, [performHealthChecks]);

    /**
     * Set up automatic health checks
     */
    useEffect(() => {
        // Initial check
        performHealthChecks();

        // Set up interval for periodic checks
        const intervalId = setInterval(performHealthChecks, checkInterval);

        return () => {
            clearInterval(intervalId);
        };
    }, [performHealthChecks, checkInterval]);

    /**
     * Get overall connection status
     */
    const getOverallStatus = (): ServiceStatus => {
        if (status.backend === 'checking') return 'checking';
        if (status.backend === 'disconnected') return 'disconnected';
        if (status.pythonService === 'disconnected') return 'disconnected';
        return 'connected';
    };

    /**
     * Get status icon
     */
    const getStatusIcon = (serviceStatus: ServiceStatus) => {
        switch (serviceStatus) {
            case 'connected':
                return <CheckCircle size={compact ? 12 : 16} />;
            case 'disconnected':
                return <XCircle size={compact ? 12 : 16} />;
            case 'checking':
                return <AlertCircle size={compact ? 12 : 16} />;
        }
    };

    /**
     * Get status color
     */
    const getStatusColor = (serviceStatus: ServiceStatus): string => {
        switch (serviceStatus) {
            case 'connected':
                return 'rgb(34, 197, 94)'; // green
            case 'disconnected':
                return 'rgb(239, 68, 68)'; // red
            case 'checking':
                return 'rgb(251, 191, 36)'; // yellow
        }
    };

    const overallStatus = getOverallStatus();
    const overallColor = getStatusColor(overallStatus);

    return (
        <div
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: compact ? 'var(--spacing-xs)' : 'var(--spacing-sm)',
            }}
            onMouseEnter={() => showTooltip && setShowDetails(true)}
            onMouseLeave={() => showTooltip && setShowDetails(false)}
        >
            {/* Main status indicator */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    padding: compact ? 'var(--spacing-xs)' : 'var(--spacing-sm) var(--spacing-md)',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid ${overallColor}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: showTooltip ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                }}
            >
                <div style={{ color: overallColor, display: 'flex', alignItems: 'center' }}>
                    {overallStatus === 'connected' ? (
                        <Wifi size={compact ? 14 : 18} />
                    ) : overallStatus === 'disconnected' ? (
                        <WifiOff size={compact ? 14 : 18} />
                    ) : (
                        <RefreshCw size={compact ? 14 : 18} className="spin" />
                    )}
                </div>
                {!compact && (
                    <span
                        style={{
                            color: 'var(--color-text-primary)',
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 500,
                        }}
                    >
                        {overallStatus === 'connected'
                            ? 'Connected'
                            : overallStatus === 'disconnected'
                            ? 'Disconnected'
                            : 'Checking...'}
                    </span>
                )}
            </div>

            {/* Reconnect button */}
            {!compact && overallStatus === 'disconnected' && (
                <button
                    onClick={handleReconnect}
                    disabled={isChecking}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: 'var(--spacing-sm)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: 'rgb(59, 130, 246)',
                        cursor: isChecking ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s',
                        opacity: isChecking ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if (!isChecking) {
                            e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                    }}
                >
                    <RefreshCw size={16} className={isChecking ? 'spin' : ''} />
                </button>
            )}

            {/* Detailed status tooltip */}
            {showTooltip && showDetails && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + var(--spacing-sm))',
                        right: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 'var(--spacing-md)',
                        minWidth: '280px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                        zIndex: 1000,
                        animation: 'fadeIn 0.2s ease-out',
                    }}
                >
                    <div
                        style={{
                            fontSize: 'var(--font-size-xs)',
                            fontWeight: 600,
                            color: 'var(--color-text-primary)',
                            marginBottom: 'var(--spacing-sm)',
                        }}
                    >
                        Service Status
                    </div>

                    {/* Backend status */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--spacing-xs) 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                    >
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            Backend (Node.js)
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                            <span
                                style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: getStatusColor(status.backend),
                                    fontWeight: 500,
                                }}
                            >
                                {status.backend}
                            </span>
                            <div style={{ color: getStatusColor(status.backend) }}>
                                {getStatusIcon(status.backend)}
                            </div>
                        </div>
                    </div>

                    {/* Python service status */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--spacing-xs) 0',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                    >
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            Python Service
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                            <span
                                style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: getStatusColor(status.pythonService),
                                    fontWeight: 500,
                                }}
                            >
                                {status.pythonService}
                            </span>
                            <div style={{ color: getStatusColor(status.pythonService) }}>
                                {getStatusIcon(status.pythonService)}
                            </div>
                        </div>
                    </div>

                    {/* Memory Hub status */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: 'var(--spacing-xs) 0',
                        }}
                    >
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            Memory Hub
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                            <span
                                style={{
                                    fontSize: 'var(--font-size-xs)',
                                    color: getStatusColor(status.memoryHub),
                                    fontWeight: 500,
                                }}
                            >
                                {status.memoryHub}
                            </span>
                            <div style={{ color: getStatusColor(status.memoryHub) }}>
                                {getStatusIcon(status.memoryHub)}
                            </div>
                        </div>
                    </div>

                    {/* Last checked timestamp */}
                    {status.lastChecked && (
                        <div
                            style={{
                                marginTop: 'var(--spacing-sm)',
                                paddingTop: 'var(--spacing-sm)',
                                borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                                fontSize: 'var(--font-size-xs)',
                                color: 'var(--color-text-tertiary)',
                                textAlign: 'center',
                            }}
                        >
                            Last checked: {status.lastChecked.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            )}

            {/* Add CSS for animations */}
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

                @keyframes spin {
                    from {
                        transform: rotate(0deg);
                    }
                    to {
                        transform: rotate(360deg);
                    }
                }

                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

