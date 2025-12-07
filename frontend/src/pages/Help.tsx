// frontend/src/pages/Help.tsx
import React, { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Bot, Shield, Database, Zap, HelpCircle } from 'lucide-react';

const BSC_TESTNET_EXPLORER = 'https://testnet.bscscan.com';
const MEMBASE_CONTRACT = '0x100E3F8c5285df46A8B9edF6b38B8f90F1C32B7b';

interface FAQItem {
    question: string;
    answer: string | React.ReactNode;
}

const FAQAccordion: React.FC<{ item: FAQItem; isOpen: boolean; onToggle: () => void }> = ({ item, isOpen, onToggle }) => {
    return (
        <div className="card" style={{ marginBottom: 'var(--spacing-md)' }}>
            <button
                onClick={onToggle}
                className="w-full flex justify-between items-center text-left"
                style={{ padding: 'var(--spacing-md)', background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
                <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{item.question}</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {isOpen && (
                <div style={{ padding: '0 var(--spacing-md) var(--spacing-md) var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                    {item.answer}
                </div>
            )}
        </div>
    );
};

export const Help: React.FC = () => {
    const [openFAQ, setOpenFAQ] = useState<number | null>(null);

    const faqItems: FAQItem[] = [
        {
            question: "What is an AI Agent?",
            answer: (
                <>
                    <p>An AI Agent is an intelligent assistant that helps you discover and manage real estate properties. Unlike traditional chatbots, our agents:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li>Have a <strong>blockchain identity</strong> registered on BNB Chain</li>
                        <li>Store their memory in <strong>decentralized storage</strong> (Membase)</li>
                        <li>Learn from your interactions and remember your preferences</li>
                        <li>Can be accessed from any platform using your agent ID</li>
                    </ul>
                </>
            )
        },
        {
            question: "How does blockchain identity work?",
            answer: (
                <>
                    <p>When you launch an agent, it gets registered on the BNB Chain blockchain:</p>
                    <ol style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li><strong>Registration:</strong> Your agent ID is linked to your wallet address on-chain</li>
                        <li><strong>Ownership:</strong> Only you can control and modify your agent</li>
                        <li><strong>Verification:</strong> Anyone can verify your agent's authenticity on the blockchain</li>
                        <li><strong>Permanence:</strong> Your agent's identity is immutable and permanent</li>
                    </ol>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        The registration happens through the Membase smart contract at{' '}
                        <a 
                            href={`${BSC_TESTNET_EXPLORER}/address/${MEMBASE_CONTRACT}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                        >
                            {MEMBASE_CONTRACT}
                        </a>
                    </p>
                </>
            )
        },
        {
            question: "What is decentralized memory (Membase)?",
            answer: (
                <>
                    <p>Membase is a decentralized AI memory layer that stores your agent's state:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li><strong>Persistent:</strong> Your agent's memory survives server restarts and platform changes</li>
                        <li><strong>Tamper-proof:</strong> Memory is cryptographically secured and cannot be altered without authorization</li>
                        <li><strong>Portable:</strong> Access your agent from any application that supports AIP (Agent Interoperability Protocol)</li>
                        <li><strong>Private:</strong> Only you and your agent can access the stored data</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        Your agent stores: conversation history, learned preferences, property recommendations, and personalized insights.
                    </p>
                </>
            )
        },
        {
            question: "What are the benefits of decentralized memory?",
            answer: (
                <>
                    <p><strong>Traditional AI Assistants:</strong></p>
                    <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                        <li>❌ Memory stored on company servers</li>
                        <li>❌ Data can be lost if service shuts down</li>
                        <li>❌ Cannot move to different platforms</li>
                        <li>❌ Privacy concerns with centralized storage</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-md)' }}><strong>Decentralized AI Agents:</strong></p>
                    <ul style={{ paddingLeft: 'var(--spacing-lg)' }}>
                        <li>✅ Memory stored on blockchain (permanent)</li>
                        <li>✅ You own and control your data</li>
                        <li>✅ Works across multiple platforms</li>
                        <li>✅ Enhanced privacy and security</li>
                    </ul>
                </>
            )
        },
        {
            question: "How do I launch an AI agent?",
            answer: (
                <>
                    <ol style={{ paddingLeft: 'var(--spacing-lg)' }}>
                        <li><strong>Connect your wallet:</strong> Click "Connect Wallet" in the top right</li>
                        <li><strong>Navigate to Launch Agent:</strong> Click "Launch Agent" in the navigation menu</li>
                        <li><strong>Enter agent details:</strong> Provide a name and ticker for your agent</li>
                        <li><strong>Launch:</strong> Click "Launch Agent" and confirm the blockchain transaction</li>
                        <li><strong>Wait for confirmation:</strong> The process takes 10-15 seconds</li>
                    </ol>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        <strong>Note:</strong> You'll need a small amount of BNB (≈0.00015 BNB) for gas fees on BSC Testnet.
                    </p>
                </>
            )
        },
        {
            question: "How much does it cost to launch an agent?",
            answer: (
                <>
                    <p>Launching an agent requires a one-time blockchain transaction fee:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li><strong>BSC Testnet:</strong> ≈0.00015 BNB (for testing)</li>
                        <li><strong>BSC Mainnet:</strong> ≈0.00015 BNB (≈$0.10 USD)</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        After registration, using your agent is free. The Memory Hub connection and AI interactions have no additional blockchain fees.
                    </p>
                </>
            )
        },
        {
            question: "What if I don't have BNB for gas fees?",
            answer: (
                <>
                    <p>To get BNB for BSC Testnet:</p>
                    <ol style={{ paddingLeft: 'var(--spacing-lg)' }}>
                        <li>Visit the <a href="https://testnet.bnbchain.org/faucet-smart" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>BSC Testnet Faucet</a></li>
                        <li>Connect your wallet</li>
                        <li>Request test BNB (you'll receive 0.1 BNB)</li>
                        <li>Wait a few seconds for the transaction to confirm</li>
                    </ol>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        For BSC Mainnet, you can purchase BNB on exchanges like Binance, Coinbase, or use a DEX.
                    </p>
                </>
            )
        },
        {
            question: "How do I verify my agent on the blockchain?",
            answer: (
                <>
                    <p>After launching your agent, you'll receive a transaction hash. To verify:</p>
                    <ol style={{ paddingLeft: 'var(--spacing-lg)' }}>
                        <li>Click the "View on BSC Testnet Explorer" link on the Launch Agent page</li>
                        <li>Or visit <a href={BSC_TESTNET_EXPLORER} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}>BSC Testnet Explorer</a></li>
                        <li>Paste your transaction hash in the search bar</li>
                        <li>View the transaction details, including your agent ID and wallet address</li>
                    </ol>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        You can also verify the Membase contract at{' '}
                        <a 
                            href={`${BSC_TESTNET_EXPLORER}/address/${MEMBASE_CONTRACT}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: 'var(--color-primary)', textDecoration: 'underline' }}
                        >
                            {MEMBASE_CONTRACT}
                        </a>
                    </p>
                </>
            )
        },
        {
            question: "What happens if the service goes down?",
            answer: (
                <>
                    <p>Your agent's data is safe because it's stored on the blockchain:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li><strong>Agent Identity:</strong> Permanently registered on BNB Chain</li>
                        <li><strong>Agent Memory:</strong> Stored in decentralized Membase (not on our servers)</li>
                        <li><strong>Portability:</strong> You can access your agent from any AIP-compatible platform</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        Even if our frontend goes offline, your agent ID and memory remain accessible through the blockchain and Memory Hub.
                    </p>
                </>
            )
        },
        {
            question: "Can I have multiple agents?",
            answer: (
                <>
                    <p>Yes! You can launch multiple agents, each with its own:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li>Unique agent ID</li>
                        <li>Separate blockchain registration</li>
                        <li>Independent memory and preferences</li>
                        <li>Specialized knowledge and behavior</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        Each agent requires a separate blockchain transaction (gas fee) for registration.
                    </p>
                </>
            )
        },
        {
            question: "What is the Memory Hub?",
            answer: (
                <>
                    <p>The Memory Hub is a gRPC server that provides:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li><strong>Decentralized Storage:</strong> Stores agent memory across distributed nodes</li>
                        <li><strong>Agent Communication:</strong> Enables agents to share knowledge and collaborate</li>
                        <li><strong>Real-time Sync:</strong> Keeps agent state synchronized across platforms</li>
                        <li><strong>Cross-Platform Access:</strong> Allows any AIP-compatible app to access your agent</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        Current Memory Hub: <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>54.169.29.193:8081</code>
                    </p>
                </>
            )
        },
        {
            question: "What is AIP (Agent Interoperability Protocol)?",
            answer: (
                <>
                    <p>AIP is the first Web3-native multi-agent communication standard that combines:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li><strong>MCP:</strong> Model Context Protocol for AI interactions</li>
                        <li><strong>gRPC:</strong> High-performance communication protocol</li>
                        <li><strong>On-chain Identity:</strong> Blockchain-based agent authentication</li>
                        <li><strong>Decentralized Memory:</strong> Persistent, tamper-proof storage</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        This means your agent can work with other AIP-compatible applications, creating a truly interoperable AI ecosystem.
                    </p>
                </>
            )
        },
        {
            question: "How do I chat with my agent?",
            answer: (
                <>
                    <ol style={{ paddingLeft: 'var(--spacing-lg)' }}>
                        <li>Launch an agent (if you haven't already)</li>
                        <li>Navigate to "AI Matcher" in the menu</li>
                        <li>Your agent will automatically initialize on first use</li>
                        <li>Type your questions or requests in the chat interface</li>
                        <li>Your agent will respond using its learned knowledge and preferences</li>
                    </ol>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        The agent remembers your conversation history and learns from each interaction.
                    </p>
                </>
            )
        },
        {
            question: "What can I ask my agent?",
            answer: (
                <>
                    <p>Your agent specializes in real estate and can help with:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li>Property recommendations based on your preferences</li>
                        <li>Market analysis and investment insights</li>
                        <li>Rental yield calculations</li>
                        <li>Location comparisons and neighborhood information</li>
                        <li>Answering questions about available properties</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        The more you interact with your agent, the better it understands your preferences and needs.
                    </p>
                </>
            )
        },
        {
            question: "Is my data private and secure?",
            answer: (
                <>
                    <p>Yes, your data is protected through multiple layers:</p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li><strong>Wallet Authentication:</strong> Only you can control your agent</li>
                        <li><strong>Encrypted Storage:</strong> Agent memory is cryptographically secured</li>
                        <li><strong>Blockchain Verification:</strong> All operations are verifiable on-chain</li>
                        <li><strong>No Central Database:</strong> Data is stored in decentralized Membase, not on our servers</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        Your private key never leaves your wallet, and only you can authorize agent operations.
                    </p>
                </>
            )
        },
        {
            question: "What if I encounter an error?",
            answer: (
                <>
                    <p><strong>Common issues and solutions:</strong></p>
                    <ul style={{ marginTop: 'var(--spacing-sm)', paddingLeft: 'var(--spacing-lg)' }}>
                        <li><strong>"Service temporarily unavailable":</strong> Backend is restarting, wait 30 seconds and retry</li>
                        <li><strong>"Insufficient funds":</strong> Get test BNB from the faucet (see FAQ above)</li>
                        <li><strong>"Agent already registered":</strong> This agent ID is already claimed, try a different name</li>
                        <li><strong>"Request timed out":</strong> Network congestion, wait and retry</li>
                        <li><strong>"Backend unavailable":</strong> Check the connection status indicator in the top right</li>
                    </ul>
                    <p style={{ marginTop: 'var(--spacing-sm)' }}>
                        If issues persist, check the connection status indicator or contact support.
                    </p>
                </>
            )
        }
    ];

    return (
        <div className="container" style={{ paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-xl)' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
                <HelpCircle size={48} style={{ color: 'var(--color-primary)', margin: '0 auto var(--spacing-md)' }} />
                <h1 className="gradient-text" style={{ fontSize: '2.5rem', marginBottom: 'var(--spacing-md)' }}>
                    Help & Documentation
                </h1>
                <p style={{ color: 'var(--color-text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
                    Learn about AI agents, blockchain identity, and decentralized memory
                </p>
            </div>

            {/* Key Features */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-primary)' }}>Key Features</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--spacing-lg)' }}>
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <Bot size={32} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }} />
                        <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-primary)' }}>Intelligent AI Agents</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Personalized assistants that learn from your interactions and remember your preferences
                        </p>
                    </div>
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <Shield size={32} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }} />
                        <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-primary)' }}>Blockchain Identity</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Agents registered on BNB Chain with verifiable, immutable on-chain identity
                        </p>
                    </div>
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <Database size={32} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }} />
                        <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-primary)' }}>Decentralized Memory</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Persistent, tamper-proof storage in Membase that survives platform changes
                        </p>
                    </div>
                    <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                        <Zap size={32} style={{ color: 'var(--color-primary)', marginBottom: 'var(--spacing-md)' }} />
                        <h3 style={{ marginBottom: 'var(--spacing-sm)', color: 'var(--color-text-primary)' }}>Cross-Platform</h3>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                            Access your agent from any AIP-compatible application using your agent ID
                        </p>
                    </div>
                </div>
            </div>

            {/* FAQ Section */}
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
                <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-primary)' }}>Frequently Asked Questions</h2>
                {faqItems.map((item, index) => (
                    <FAQAccordion
                        key={index}
                        item={item}
                        isOpen={openFAQ === index}
                        onToggle={() => setOpenFAQ(openFAQ === index ? null : index)}
                    />
                ))}
            </div>

            {/* Quick Links */}
            <div className="card" style={{ padding: 'var(--spacing-lg)' }}>
                <h2 style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-primary)' }}>Quick Links</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--spacing-md)' }}>
                    <a
                        href={BSC_TESTNET_EXPLORER}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button-secondary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', textDecoration: 'none' }}
                    >
                        BSC Testnet Explorer
                        <ExternalLink size={16} />
                    </a>
                    <a
                        href={`${BSC_TESTNET_EXPLORER}/address/${MEMBASE_CONTRACT}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button-secondary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', textDecoration: 'none' }}
                    >
                        Membase Contract
                        <ExternalLink size={16} />
                    </a>
                    <a
                        href="https://testnet.bnbchain.org/faucet-smart"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button-secondary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', textDecoration: 'none' }}
                    >
                        BSC Testnet Faucet
                        <ExternalLink size={16} />
                    </a>
                    <a
                        href="https://github.com/unibaseio/aip-agent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="button-secondary"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--spacing-sm)', textDecoration: 'none' }}
                    >
                        AIP Agent SDK
                        <ExternalLink size={16} />
                    </a>
                </div>
            </div>

            {/* Technical Details */}
            <div className="card" style={{ padding: 'var(--spacing-lg)', marginTop: 'var(--spacing-xl)', background: 'rgba(0, 217, 255, 0.05)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', color: 'var(--color-text-primary)' }}>Technical Details</h3>
                <div style={{ display: 'grid', gap: 'var(--spacing-sm)', color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
                    <div><strong>Network:</strong> BNB Chain Testnet</div>
                    <div><strong>Membase Contract:</strong> <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>{MEMBASE_CONTRACT}</code></div>
                    <div><strong>Memory Hub:</strong> <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px' }}>54.169.29.193:8081</code></div>
                    <div><strong>Protocol:</strong> AIP (Agent Interoperability Protocol)</div>
                    <div><strong>Gas Fee:</strong> ≈0.00015 BNB per agent registration</div>
                </div>
            </div>
        </div>
    );
};
