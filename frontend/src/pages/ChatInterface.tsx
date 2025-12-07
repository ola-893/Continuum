import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { chatService } from '../services/chatService';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'bot';
    timestamp: number;
}

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
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const responseText = await chatService.sendMessage(userMessage.text);
            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'bot',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, botMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            const errorMessage: Message = {
                id: (Date.now() + 2).toString(),
                text: "I'm having trouble connecting to the Unibase network. Please try again later.",
                sender: 'bot',
                timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="container" style={{ padding: 'var(--spacing-2xl) 0', height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Sparkles size={28} className="text-glow" style={{ color: 'var(--color-primary)' }} />
                    <h1 className="gradient-text" style={{ fontSize: 'var(--font-size-3xl)', margin: 0 }}>AI Property Matcher</h1>
                </div>
                <p style={{ color: 'var(--color-text-secondary)', marginLeft: '36px' }}>
                    Powered by Unibase Memory & ChainGPT
                </p>
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
                                <div
                                    className={msg.sender === 'bot' ? 'glass' : ''}
                                    style={{
                                        padding: 'var(--spacing-md) var(--spacing-lg)',
                                        borderRadius: msg.sender === 'user' ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                                        background: msg.sender === 'user' ? 'var(--gradient-primary)' : 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--color-text-primary)',
                                        boxShadow: msg.sender === 'user' ? 'var(--glow-primary)' : 'none',
                                        lineHeight: 1.5,
                                    }}
                                >
                                    <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
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
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <div className="animate-pulse" style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%' }}></div>
                                    <div className="animate-pulse" style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%', animationDelay: '0.2s' }}></div>
                                    <div className="animate-pulse" style={{ width: '6px', height: '6px', background: 'var(--color-primary)', borderRadius: '50%', animationDelay: '0.4s' }}></div>
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
                            onClick={handleSendMessage}
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
        </div>
    );
};
