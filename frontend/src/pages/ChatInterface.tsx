import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Wifi, WifiOff, RefreshCw, Brain, Shield, Database } from 'lucide-react';
import { agentService } from '../services/agentService';
import { AgentMemoryModal } from '../components/ui/AgentMemoryModal';
import { ToastContainer } from '../components/ui/ToastContainer';
import { useToast } from '../hooks/useToast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Tooltip } from '../components/ui/Tooltip';

import { useAccount } from 'wagmi';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
    isError?: boolean;
    isRetryable?: boolean;
    errorCode?: string;
}

type ConnectionStatus = 'connected' | 'disconnected' | 'checking';

export const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Hello! I'm your Unibase Property Matcher. I can help you find the perfect rental property based on your preferences. What are you looking for today?",
            sender: 'bot',
            timestamp: Date.now(),
        },
    ]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
    const [retryCount, setRetryCount] = useState(0);
    const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { address } = useAccount();
    const maxRetries = 3;
    const { toasts, removeToast, success, error: showError, warning, info } = useToast();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (retryAttempt: number = 0): Promise<void> => {
        if (!inputValue.trim() && retryAttempt === 0) return;

        if (!address) {
            showError("Please connect your wallet to chat with the AI agent.");
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: Date.now(),
        };

        // Only add user message on first attempt
        if (retryAttempt === 0) {
            setMessages((prev) => [...prev, userMessage]);
            setInputValue('');
        }
        
        setIsLoading(true);
        setRetryCount(retryAttempt);

        try {
            const { agentResponse } = await agentService.processInteraction(address, userMessage.text);
            
            // Success - update connection status
            setConnectionStatus('connected');
            setRetryCount(0);
            
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: agentResponse,
                sender: 'bot',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, botMessage]);
            
            // Show success toast on first successful message after errors
            if (retryAttempt > 0) {
                success('Message sent successfully!');
            }
        } catch (error: unknown) {
            console.error('Error sending message:', error);
            
            // Determine error type and whether it's retryable
            const errorInfo = getErrorInfo(error);
            
            // Update connection status based on error
            if (errorInfo.isConnectionError) {
                setConnectionStatus('disconnected');
                if (retryAttempt === 0) {
                    warning('Connection lost. Retrying automatically...');
                }
            }
            
            // Retry logic for retryable errors
            if (errorInfo.isRetryable && retryAttempt < maxRetries) {
                console.log(`Retrying request (attempt ${retryAttempt + 1}/${maxRetries})...`);
                
                if (retryAttempt === 0) {
                    info(`Retrying... (attempt ${retryAttempt + 1}/${maxRetries})`);
                }
                
                // Exponential backoff: 1s, 2s, 4s
                const delay = Math.pow(2, retryAttempt) * 1000;
                await new Promise(resolve => setTimeout(resolve, delay));
                
                return handleSendMessage(retryAttempt + 1);
            }
            
            // Show error toast after all retries exhausted
            if (retryAttempt >= maxRetries && errorInfo.isRetryable) {
                showError('Failed to send message after multiple attempts. Please try again.', 7000);
            } else if (!errorInfo.isRetryable) {
                showError(errorInfo.message, 7000);
            }
            
            // Show error message to user
            const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                text: errorInfo.message,
                sender: 'bot',
                timestamp: Date.now(),
                isError: true,
                isRetryable: errorInfo.isRetryable,
                errorCode: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            if (retryAttempt === 0) {
                setRetryCount(0);
            }
        }
    };

    const handleRetry = () => {
        // Get the last user message
        const lastUserMessage = [...messages].reverse().find(m => m.sender === 'user');
        if (lastUserMessage) {
            setInputValue(lastUserMessage.text);
            handleSendMessage(0);
        }
    };

    const getErrorInfo = (error: any): { message: string; isRetryable: boolean; isConnectionError: boolean } => {
        const errorMessage = error?.message || String(error);
        
        // Handle standardized error codes from agentService
        switch (errorMessage) {
            case 'SERVICE_UNAVAILABLE':
                return {
                    message: "Service temporarily unavailable. The backend service is currently down or restarting. I'll automatically retry your request...",
                    isRetryable: true,
                    isConnectionError: true,
                };
            
            case 'REQUEST_TIMEOUT':
                return {
                    message: "Request timed out. The server took too long to respond. I'll automatically retry your request...",
                    isRetryable: true,
                    isConnectionError: true,
                };
            
            case 'CONNECTION_REFUSED':
                return {
                    message: "Cannot connect to backend service. Please ensure the backend is running at " + (import.meta.env.VITE_API_URL || 'http://localhost:3001') + " and try again.",
                    isRetryable: true,
                    isConnectionError: true,
                };
            
            case 'AGENT_NOT_FOUND':
                return {
                    message: "Your AI agent hasn't been initialized yet. To start chatting, you need to launch an agent first. Click the 'Launch Agent' button below or visit the Launch Agent page to create your blockchain-based AI agent.",
                    isRetryable: false,
                    isConnectionError: false,
                };
            
            case 'INSUFFICIENT_FUNDS':
                return {
                    message: "Insufficient BNB for gas fees. Your wallet needs approximately 0.0002 BNB to cover blockchain transaction costs. Click 'Get Testnet BNB' below to receive free testnet tokens from the faucet.",
                    isRetryable: false,
                    isConnectionError: false,
                };
            
            case 'AGENT_ALREADY_REGISTERED':
                return {
                    message: "This agent ID is already registered by another wallet. This shouldn't happen with your wallet address. Please contact support if this persists.",
                    isRetryable: false,
                    isConnectionError: false,
                };
            
            case 'INITIALIZATION_FAILED':
                return {
                    message: "Failed to initialize your AI agent. This could be due to network issues, blockchain congestion, or Memory Hub connection problems. The system will automatically retry. If the problem persists, please check your internet connection and try again.",
                    isRetryable: true,
                    isConnectionError: false,
                };
            
            case 'QUERY_FAILED':
                return {
                    message: "Failed to process your query. The AI service encountered an error while generating a response. This could be due to LLM API issues or Memory Hub connectivity. The system will automatically retry your request.",
                    isRetryable: true,
                    isConnectionError: false,
                };
        }
        
        // Fallback: check for legacy error messages (backward compatibility)
        if (errorMessage.includes('Service temporarily unavailable') || errorMessage.includes('503')) {
            return {
                message: "Service temporarily unavailable. I'll automatically retry your request...",
                isRetryable: true,
                isConnectionError: true,
            };
        }
        
        if (errorMessage.includes('timed out') || errorMessage.includes('timeout') || errorMessage.includes('504')) {
            return {
                message: "Request timed out. I'll automatically retry your request...",
                isRetryable: true,
                isConnectionError: true,
            };
        }
        
        if (errorMessage.includes('Cannot connect to backend') || errorMessage.includes('ECONNREFUSED')) {
            return {
                message: "Cannot connect to the backend service. Please ensure the backend is running and try again.",
                isRetryable: true,
                isConnectionError: true,
            };
        }
        
        if (errorMessage.includes('Agent not found') || errorMessage.includes('404')) {
            return {
                message: "Your AI agent hasn't been initialized yet. Please launch an agent first from the Launch Agent page.",
                isRetryable: false,
                isConnectionError: false,
            };
        }
        
        if (errorMessage.includes('Insufficient funds') || errorMessage.includes('402')) {
            return {
                message: "Insufficient funds. Please ensure your wallet has enough BNB for gas fees.",
                isRetryable: false,
                isConnectionError: false,
            };
        }
        
        if (errorMessage.includes('already registered') || errorMessage.includes('409')) {
            return {
                message: "This agent is already registered by another wallet. Please use a different agent ID.",
                isRetryable: false,
                isConnectionError: false,
            };
        }
        
        // Generic error
        return {
            message: "I'm having trouble processing your request. Please try again.",
            isRetryable: true,
            isConnectionError: false,
        };
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <>
            <ToastContainer toasts={toasts} onClose={removeToast} />
            <div className="container" style={{ padding: 'var(--spacing-2xl) 0', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                            <Sparkles size={28} className="text-glow" style={{ color: 'var(--color-primary)' }} />
                            <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)', margin: 0 }}>AI Property Matcher</h1>
                        </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                        {/* View Memory Button */}
                        <button
                            onClick={() => setIsMemoryModalOpen(true)}
                            disabled={!address}
                            className="btn-secondary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-xs)',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                fontSize: 'var(--font-size-sm)',
                            }}
                            title="View agent memory and interaction history"
                        >
                            <Brain size={16} />
                            <span>View Memory</span>
                        </button>
                        
                        {/* Connection Status Indicator */}
                        <div 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'var(--spacing-xs)',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                borderRadius: 'var(--radius-full)',
                                background: connectionStatus === 'connected' 
                                    ? 'rgba(34, 197, 94, 0.1)' 
                                    : connectionStatus === 'disconnected'
                                    ? 'rgba(239, 68, 68, 0.1)'
                                    : 'rgba(251, 191, 36, 0.1)',
                                border: `1px solid ${
                                    connectionStatus === 'connected' 
                                        ? 'rgba(34, 197, 94, 0.3)' 
                                        : connectionStatus === 'disconnected'
                                        ? 'rgba(239, 68, 68, 0.3)'
                                        : 'rgba(251, 191, 36, 0.3)'
                                }`,
                            }}
                        >
                            {connectionStatus === 'connected' ? (
                                <>
                                    <Wifi size={16} style={{ color: 'rgb(34, 197, 94)' }} />
                                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'rgb(34, 197, 94)' }}>
                                        Connected
                                    </span>
                                </>
                            ) : connectionStatus === 'disconnected' ? (
                                <>
                                    <WifiOff size={16} style={{ color: 'rgb(239, 68, 68)' }} />
                                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'rgb(239, 68, 68)' }}>
                                        Disconnected
                                    </span>
                                </>
                            ) : (
                                <>
                                    <RefreshCw size={16} style={{ color: 'rgb(251, 191, 36)' }} className="animate-spin" />
                                    <span style={{ fontSize: 'var(--font-size-sm)', color: 'rgb(251, 191, 36)' }}>
                                        Checking...
                                    </span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ 
                    marginLeft: '36px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 'var(--spacing-md)',
                    flexWrap: 'wrap'
                }}>
                    {/* Real Integration Indicators */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 'var(--spacing-xs)',
                        color: 'var(--color-text-secondary)',
                        fontSize: 'var(--font-size-sm)'
                    }}>
                        <span>Powered by</span>
                        <Tooltip content={
                            <div>
                                <strong>AIP Agent SDK</strong>
                                <div style={{ marginTop: '4px' }}>
                                    Web3-native multi-agent communication protocol with blockchain identity and decentralized memory.
                                </div>
                                <a 
                                    href="https://github.com/unibaseio/aip-agent" 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--color-primary)', marginTop: '4px', display: 'inline-block' }}
                                >
                                    Learn more →
                                </a>
                            </div>
                        } showIcon={false}>
                            <div 
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 'var(--spacing-xs)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    cursor: 'help',
                                }}
                            >
                                <Shield size={12} style={{ color: 'rgb(139, 92, 246)' }} />
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgb(139, 92, 246)', fontWeight: 500 }}>
                                    AIP Agent
                                </span>
                            </div>
                        </Tooltip>
                        <span>+</span>
                        <Tooltip content={
                            <div>
                                <strong>Membase</strong>
                                <div style={{ marginTop: '4px' }}>
                                    Decentralized AI memory layer on BNB Chain. Your agent's memory is stored on-chain, 
                                    making it permanent, tamper-proof, and accessible from any platform.
                                </div>
                                <div style={{ marginTop: '8px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                    Contract: 0x100E3F8c...F1C32B7b
                                </div>
                            </div>
                        } showIcon={false}>
                            <div 
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 'var(--spacing-xs)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    border: '1px solid rgba(34, 197, 94, 0.3)',
                                    cursor: 'help',
                                }}
                            >
                                <Database size={12} style={{ color: 'rgb(34, 197, 94)' }} />
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgb(34, 197, 94)', fontWeight: 500 }}>
                                    Membase
                                </span>
                            </div>
                        </Tooltip>
                    </div>
                    
                    {/* Blockchain Identity Indicator */}
                    {address && (
                        <Tooltip content={
                            <div>
                                <strong>Blockchain Identity</strong>
                                <div style={{ marginTop: '4px' }}>
                                    Your agent has a unique identity registered on BNB Chain blockchain.
                                </div>
                                <div style={{ marginTop: '8px', fontSize: 'var(--font-size-xs)', fontFamily: 'monospace' }}>
                                    Agent ID: continuum_agent_{address.slice(0, 6)}...{address.slice(-4)}
                                </div>
                                <div style={{ marginTop: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                    This identity is permanent, verifiable, and owned by your wallet.
                                </div>
                            </div>
                        } showIcon={false}>
                            <div 
                                style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 'var(--spacing-xs)',
                                    padding: '2px 8px',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(251, 191, 36, 0.1)',
                                    border: '1px solid rgba(251, 191, 36, 0.3)',
                                    cursor: 'help',
                                }}
                            >
                                <Shield size={12} style={{ color: 'rgb(251, 191, 36)' }} />
                                <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgb(251, 191, 36)', fontWeight: 500 }}>
                                    On-Chain Identity
                                </span>
                            </div>
                        </Tooltip>
                    )}
                    
                    {/* Memory Hub Status */}
                    <Tooltip content={
                        <div>
                            <strong>Memory Hub</strong>
                            <div style={{ marginTop: '4px' }}>
                                gRPC server for decentralized memory storage and agent-to-agent communication.
                            </div>
                            <div style={{ marginTop: '8px', fontSize: 'var(--font-size-xs)', fontFamily: 'monospace' }}>
                                Address: 54.169.29.193:8081
                            </div>
                            <div style={{ marginTop: '4px', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                                Your agent's memory is synchronized in real-time through this hub.
                            </div>
                        </div>
                    } showIcon={false}>
                        <div 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 'var(--spacing-xs)',
                                padding: '2px 8px',
                                borderRadius: 'var(--radius-sm)',
                                background: 'rgba(59, 130, 246, 0.1)',
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                cursor: 'help',
                            }}
                        >
                            <Database size={12} style={{ color: 'rgb(59, 130, 246)' }} />
                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'rgb(59, 130, 246)', fontWeight: 500 }}>
                                Memory Hub Connected
                            </span>
                        </div>
                    </Tooltip>
                </div>
            </div>

            <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, position: 'relative' }}>
                {/* Chat Area */}
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--spacing-xl)', scrollBehavior: 'smooth' }}>
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            style={{
                                display: 'flex',
                                justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                marginBottom: 'var(--spacing-lg)',
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row', gap: 'var(--spacing-md)', maxWidth: '80%' }}>
                                <div
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '50%',
                                        background: msg.sender === 'user' ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.1)',
                                        border: msg.sender === 'bot' ? '1px solid var(--color-primary-glow)' : 'none',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                        marginTop: '4px', // Align with top of bubble
                                    }}
                                >
                                    {msg.sender === 'user' ? <User size={18} color="white" /> : <Bot size={18} color="var(--color-primary)" />}
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    <div
                                        className={msg.sender === 'bot' ? 'glass' : ''}
                                        style={{
                                            padding: 'var(--spacing-md) var(--spacing-lg)',
                                            borderRadius: msg.sender === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                            background: msg.sender === 'user' 
                                                ? 'var(--gradient-primary)' 
                                                : msg.isError 
                                                ? 'rgba(239, 68, 68, 0.1)' 
                                                : 'rgba(255, 255, 255, 0.05)',
                                            color: 'var(--color-text-primary)',
                                            boxShadow: msg.sender === 'user' ? 'var(--glow-primary)' : 'none',
                                            border: msg.isError ? '1px solid rgba(239, 68, 68, 0.3)' : 'none',
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                                    </div>
                                    {msg.isError && (
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', alignItems: 'center', flexWrap: 'wrap' }}>
                                            {msg.isRetryable && (
                                                <button
                                                    onClick={handleRetry}
                                                    className="btn-secondary"
                                                    style={{
                                                        fontSize: 'var(--font-size-sm)',
                                                        padding: 'var(--spacing-xs) var(--spacing-md)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--spacing-xs)',
                                                    }}
                                                >
                                                    <RefreshCw size={14} />
                                                    Retry
                                                </button>
                                            )}
                                            {msg.errorCode === 'AGENT_NOT_FOUND' && (
                                                <button
                                                    onClick={() => window.location.href = '/launch-agent'}
                                                    className="btn-primary"
                                                    style={{
                                                        fontSize: 'var(--font-size-sm)',
                                                        padding: 'var(--spacing-xs) var(--spacing-md)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--spacing-xs)',
                                                    }}
                                                >
                                                    Launch Agent
                                                </button>
                                            )}
                                            {msg.errorCode === 'INSUFFICIENT_FUNDS' && (
                                                <a
                                                    href="https://testnet.bnbchain.org/faucet-smart"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn-primary"
                                                    style={{
                                                        fontSize: 'var(--font-size-sm)',
                                                        padding: 'var(--spacing-xs) var(--spacing-md)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--spacing-xs)',
                                                        textDecoration: 'none',
                                                    }}
                                                >
                                                    Get Testnet BNB
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid var(--color-primary-glow)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                <Bot size={18} color="var(--color-primary)" />
                            </div>
                            <div className="glass" style={{ padding: 'var(--spacing-md)', borderRadius: '4px 16px 16px 16px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    <LoadingSpinner size={20} message="Thinking..." />
                                    {retryCount > 0 && (
                                        <div style={{ 
                                            fontSize: 'var(--font-size-xs)', 
                                            color: 'var(--color-warning)',
                                            fontWeight: 500,
                                            marginTop: 'var(--spacing-xs)'
                                        }}>
                                            Retrying... (attempt {retryCount}/{maxRetries})
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{ padding: 'var(--spacing-lg)', borderTop: '1px solid rgba(255, 255, 255, 0.1)', background: 'rgba(0, 0, 0, 0.2)' }}>
                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyPress}
                            placeholder="Describe the property you are looking for..."
                            className="input"
                            style={{
                                flex: 1,
                                borderRadius: 'var(--radius-full)',
                                paddingLeft: 'var(--spacing-lg)',
                                paddingRight: 'var(--spacing-lg)',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                            disabled={isLoading}
                        />
                        <button
                            onClick={() => handleSendMessage(0)}
                            disabled={!inputValue.trim() || isLoading}
                            className="btn-primary"
                            style={{
                                borderRadius: '50%',
                                width: '48px',
                                height: '48px',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Agent Memory Modal */}
            {address && (
                <AgentMemoryModal
                    isOpen={isMemoryModalOpen}
                    onClose={() => setIsMemoryModalOpen(false)}
                    userAddress={address}
                />
            )}
            </div>
        </>
    );
};
