import React, { useState, useEffect } from 'react';
import { X, Brain, Clock, Target, History, TrendingUp } from 'lucide-react';
import { agentService } from '../../services/agentService';
import { AgentState } from '../../types/agent';
import { LoadingScreen } from './LoadingScreen';

interface AgentMemoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    userAddress: string;
}

export const AgentMemoryModal: React.FC<AgentMemoryModalProps> = ({ isOpen, onClose, userAddress }) => {
    const [agentState, setAgentState] = useState<AgentState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && userAddress) {
            loadAgentMemory();
        }
    }, [isOpen, userAddress]);

    const loadAgentMemory = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const state = await agentService.getAgentState(userAddress);
            setAgentState(state);
        } catch (err) {
            console.error('Failed to load agent memory:', err);
            setError(err instanceof Error ? err.message : 'Failed to load agent memory');
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatPreferences = (preferences: Record<string, any>) => {
        if (!preferences || Object.keys(preferences).length === 0) {
            return 'No preferences learned yet';
        }
        
        return Object.entries(preferences).map(([key, value]) => {
            const displayValue = Array.isArray(value) ? value.join(', ') : 
                                typeof value === 'object' ? JSON.stringify(value) : 
                                String(value);
            return `${key}: ${displayValue}`;
        }).join('\n');
    };

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={onClose}
        >
            <div
                className="card"
                style={{
                    width: '100%',
                    maxWidth: '800px',
                    maxHeight: '90vh',
                    padding: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="card-header"
                    style={{
                        padding: 'var(--spacing-lg)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                        marginBottom: 0,
                        flexShrink: 0,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        <Brain size={24} color="var(--color-primary)" />
                        <h3 style={{ margin: 0, fontSize: 'var(--font-size-xl)' }}>Agent Memory</h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer',
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ 
                    padding: 'var(--spacing-xl)', 
                    overflowY: 'auto',
                    flex: 1,
                }}>
                    {loading ? (
                        <LoadingScreen message="Loading agent memory from Membase..." />
                    ) : error ? (
                        <div
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: 'var(--radius-lg)',
                                padding: 'var(--spacing-lg)',
                                textAlign: 'center',
                            }}
                        >
                            <p style={{ color: 'rgb(239, 68, 68)', margin: 0 }}>{error}</p>
                            <button
                                onClick={loadAgentMemory}
                                className="btn-secondary"
                                style={{ marginTop: 'var(--spacing-md)' }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : agentState ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                            {/* Agent Info */}
                            <div
                                className="glass"
                                style={{
                                    padding: 'var(--spacing-lg)',
                                    borderRadius: 'var(--radius-lg)',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-md)' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)' }}>
                                            <Clock size={16} color="var(--color-text-secondary)" />
                                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                                Created
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                                            {formatTimestamp(agentState.createdAt)}
                                        </p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-xs)', justifyContent: 'flex-end' }}>
                                            <Clock size={16} color="var(--color-text-secondary)" />
                                            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                                Last Updated
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                                            {formatTimestamp(agentState.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Learned Summary */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                    <TrendingUp size={20} color="var(--color-primary)" />
                                    <h4 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Learned Summary</h4>
                                </div>
                                <div
                                    className="glass"
                                    style={{
                                        padding: 'var(--spacing-lg)',
                                        borderRadius: 'var(--radius-lg)',
                                    }}
                                >
                                    <p style={{ margin: 0, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                        {agentState.learnedSummary}
                                    </p>
                                </div>
                            </div>

                            {/* Goals */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                    <Target size={20} color="var(--color-primary)" />
                                    <h4 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Agent Goals</h4>
                                </div>
                                <div
                                    className="glass"
                                    style={{
                                        padding: 'var(--spacing-lg)',
                                        borderRadius: 'var(--radius-lg)',
                                    }}
                                >
                                    {agentState.goals.length > 0 ? (
                                        <ul style={{ margin: 0, paddingLeft: 'var(--spacing-lg)' }}>
                                            {agentState.goals.map((goal, index) => (
                                                <li key={index} style={{ marginBottom: 'var(--spacing-sm)' }}>
                                                    {goal}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                                            No goals set yet
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Learned Preferences */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                    <Brain size={20} color="var(--color-primary)" />
                                    <h4 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Learned Preferences</h4>
                                </div>
                                <div
                                    className="glass"
                                    style={{
                                        padding: 'var(--spacing-lg)',
                                        borderRadius: 'var(--radius-lg)',
                                    }}
                                >
                                    <pre style={{ 
                                        margin: 0, 
                                        whiteSpace: 'pre-wrap',
                                        fontFamily: 'inherit',
                                        fontSize: 'var(--font-size-sm)',
                                    }}>
                                        {formatPreferences(agentState.preferences)}
                                    </pre>
                                </div>
                            </div>

                            {/* Interaction History */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                    <History size={20} color="var(--color-primary)" />
                                    <h4 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                                        Interaction History ({agentState.interactionHistory.length})
                                    </h4>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                    {agentState.interactionHistory.length > 0 ? (
                                        agentState.interactionHistory.slice().reverse().map((interaction, index) => (
                                            <div
                                                key={index}
                                                className="glass"
                                                style={{
                                                    padding: 'var(--spacing-lg)',
                                                    borderRadius: 'var(--radius-lg)',
                                                }}
                                            >
                                                <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                                                    <span style={{ 
                                                        fontSize: 'var(--font-size-xs)', 
                                                        color: 'var(--color-text-secondary)' 
                                                    }}>
                                                        {formatTimestamp(interaction.timestamp)}
                                                    </span>
                                                </div>
                                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                                    <strong style={{ color: 'var(--color-primary)' }}>User:</strong>
                                                    <p style={{ margin: 'var(--spacing-xs) 0 0 0', whiteSpace: 'pre-wrap' }}>
                                                        {interaction.user}
                                                    </p>
                                                </div>
                                                <div>
                                                    <strong style={{ color: 'var(--color-success)' }}>Agent:</strong>
                                                    <p style={{ margin: 'var(--spacing-xs) 0 0 0', whiteSpace: 'pre-wrap' }}>
                                                        {interaction.agent}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div
                                            className="glass"
                                            style={{
                                                padding: 'var(--spacing-lg)',
                                                borderRadius: 'var(--radius-lg)',
                                                textAlign: 'center',
                                            }}
                                        >
                                            <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                                                No interactions yet. Start chatting to build memory!
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    );
};
