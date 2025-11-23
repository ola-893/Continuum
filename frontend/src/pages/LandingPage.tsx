import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ padding: 'var(--spacing-xl)' }}>
            <div className="container">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col items-center text-center"
                    style={{ maxWidth: '900px', margin: '0 auto' }}
                >
                    {/* Infinity Icon + Title */}
                    <motion.div
                        className="mb-8"
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 1, delay: 0.2 }}
                    >
                        <div
                            className="inline-flex items-center justify-center mb-4"
                            style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '50%',
                                background: 'var(--gradient-primary)',
                                boxShadow: 'var(--glow-primary)',
                            }}
                        >
                            <Sparkles size={60} color="#fff" />
                        </div>
                    </motion.div>

                    {/* Main Headline */}
                    <motion.h1
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        style={{
                            fontSize: 'var(--font-size-5xl)',
                            fontWeight: 800,
                            marginBottom: 'var(--spacing-lg)',
                        }}
                    >
                        <span className="gradient-text">Liquefying Reality</span>
                    </motion.h1>

                    {/* Sub-headline */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        style={{
                            marginBottom: 'var(--spacing-2xl)',
                            maxWidth: '600px',
                            margin: '0 auto var(--spacing-2xl) auto',
                        }}
                    >
                        <p style={{
                            fontSize: 'var(--font-size-xl)',
                            color: 'var(--color-text-secondary)',
                            marginBottom: 'var(--spacing-sm)',
                        }}>
                            Turn physical assets into continuous streams of income.
                        </p>
                        <p style={{
                            fontSize: 'var(--font-size-xl)',
                            color: 'var(--color-text-secondary)',
                            textAlign: 'center',
                        }}>
                            Welcome to the future of yield generation.
                        </p>
                    </motion.div>

                    {/* 3D Visual Concept (CSS-based) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="mb-8"
                    >
                        <div
                            style={{
                                width: '300px',
                                height: '200px',
                                margin: '0 auto',
                                position: 'relative',
                            }}
                        >
                            {/* House Icon (simplified) */}
                            <div
                                className="glass"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: 'var(--radius-lg)',
                                    position: 'absolute',
                                    left: '0',
                                    top: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '50px',
                                }}
                            >
                                🏘️
                            </div>

                            {/* Flowing Stream (animated gradient line) */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: '100px',
                                    top: '95px',
                                    width: '100px',
                                    height: '10px',
                                    background: 'var(--gradient-primary)',
                                    borderRadius: 'var(--radius-full)',
                                    boxShadow: 'var(--glow-primary)',
                                    animation: 'shimmer 2s infinite',
                                    backgroundSize: '200% 100%',
                                }}
                            />

                            {/* Wallet Icon */}
                            <div
                                className="glass"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: 'var(--radius-lg)',
                                    position: 'absolute',
                                    right: '0',
                                    top: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '50px',
                                }}
                            >
                                💰
                            </div>
                        </div>
                    </motion.div>

                    {/* CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 1 }}
                    >
                        <Button
                            variant="primary"
                            onClick={() => navigate('/dashboard')}
                            rightIcon={<ArrowRight size={20} />}
                            style={{
                                fontSize: 'var(--font-size-lg)',
                                padding: 'var(--spacing-lg) var(--spacing-2xl)',
                            }}
                        >
                            Launch App
                        </Button>
                    </motion.div>

                    {/* Tagline */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.2 }}
                        style={{
                            marginTop: 'var(--spacing-2xl)',
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--color-text-muted)',
                        }}
                    >
                        Powered by Aptos Blockchain
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
};
