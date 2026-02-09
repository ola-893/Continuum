/**
 * Tezos Wallet Connection Component
 * 
 * Displays wallet connection UI with support for Temple, Kukai, and Umami wallets.
 * Shows connection status, user address, XTZ balance, and network status.
 */

import React, { useState, useEffect } from 'react';
import { Wallet, X, AlertCircle, CheckCircle, ExternalLink } from 'lucide-react';
import {
  connectWallet,
  disconnectWallet,
  getWalletState,
  switchNetwork,
  formatXTZ,
  type WalletState,
} from '../../services/tezosWalletService';
import { getConfig, type TezosNetwork } from '../../config/tezos';
import { NetworkIndicator } from './NetworkIndicator';

interface TezosWalletConnectProps {
  onConnectionChange?: (state: WalletState | null) => void;
}

export const TezosWalletConnect: React.FC<TezosWalletConnectProps> = ({
  onConnectionChange,
}) => {
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Load wallet state on mount
  useEffect(() => {
    loadWalletState();
  }, []);

  // Notify parent of connection changes
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(walletState);
    }
  }, [walletState, onConnectionChange]);

  const loadWalletState = async () => {
    try {
      const state = await getWalletState();
      setWalletState(state);
    } catch (err) {
      console.error('Failed to load wallet state:', err);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const state = await connectWallet();
      setWalletState(state);
      setShowWalletModal(false);
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setWalletState(null);
      setError(null);
    } catch (err: any) {
      console.error('Disconnect error:', err);
      setError(err.message || 'Failed to disconnect wallet');
    }
  };

  const truncateAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const config = walletState ? getConfig(walletState.network) : getConfig();

  // Connected state
  if (walletState?.connected && walletState.address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        {/* Network indicator */}
        <NetworkIndicator showDetails={true} />

        {/* Wallet info */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-md)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--border-radius-md)',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: '14px', fontWeight: 500 }}>
                {truncateAddress(walletState.address)}
              </span>
              <a
                href={`${config.network.blockExplorer}/${walletState.address}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--color-primary)', display: 'flex' }}
              >
                <ExternalLink size={14} />
              </a>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
              {walletState.balance !== null ? `${formatXTZ(walletState.balance)} XTZ` : 'Loading...'}
            </span>
          </div>

          <button
            onClick={handleDisconnect}
            style={{
              padding: 'var(--spacing-xs)',
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-error)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  // Disconnected state
  return (
    <>
      <button
        onClick={() => setShowWalletModal(true)}
        disabled={isConnecting}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          padding: 'var(--spacing-md) var(--spacing-xl)',
          fontSize: 'var(--font-size-base)',
          fontWeight: 600,
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
          border: 'none',
          borderRadius: 'var(--border-radius-md)',
          color: 'white',
          cursor: isConnecting ? 'not-allowed' : 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 0 20px rgba(0, 217, 255, 0.3)',
          opacity: isConnecting ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (!isConnecting) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 217, 255, 0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 217, 255, 0.3)';
        }}
      >
        <Wallet size={18} />
        <span>{isConnecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </button>

      {/* Wallet Selection Modal */}
      {showWalletModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowWalletModal(false)}
        >
          <div
            style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--border-radius-lg)',
              padding: 'var(--spacing-xl)',
              maxWidth: '500px',
              width: '90%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-lg)' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700 }}>Connect Wallet</h2>
              <button
                onClick={() => setShowWalletModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--color-text-secondary)',
                  cursor: 'pointer',
                  padding: 'var(--spacing-xs)',
                }}
              >
                <X size={24} />
              </button>
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                  padding: 'var(--spacing-md)',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 'var(--border-radius-md)',
                  marginBottom: 'var(--spacing-lg)',
                }}
              >
                <AlertCircle size={20} style={{ color: 'var(--color-error)' }} />
                <span style={{ fontSize: '14px', color: 'var(--color-error)' }}>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 'var(--spacing-lg)' }}>
              <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-md)' }}>
                Connect with one of our available Tezos wallet providers:
              </p>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--spacing-md)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--border-radius-md)',
                  color: 'white',
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isConnecting ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isConnecting) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <Wallet size={24} />
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>Beacon Wallet</div>
                    <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                      Temple, Kukai, Umami & more
                    </div>
                  </div>
                </div>
                <CheckCircle size={20} style={{ color: 'var(--color-success)' }} />
              </button>
            </div>

            <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 'var(--spacing-md)' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-sm)' }}>
                Don't have a Tezos wallet?
              </p>
              <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                <a
                  href="https://templewallet.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                  }}
                >
                  Get Temple
                </a>
                <span style={{ color: 'var(--color-text-secondary)' }}>•</span>
                <a
                  href="https://wallet.kukai.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                  }}
                >
                  Get Kukai
                </a>
                <span style={{ color: 'var(--color-text-secondary)' }}>•</span>
                <a
                  href="https://umamiwallet.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                  }}
                >
                  Get Umami
                </a>
              </div>
            </div>

            {/* Network on Ghostnet - show faucet link */}
            {config.network.faucetUrl && (
              <div
                style={{
                  marginTop: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  background: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: 'var(--border-radius-md)',
                }}
              >
                <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
                  Need test XTZ for Ghostnet?
                </p>
                <a
                  href={config.network.faucetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: '12px',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                  }}
                >
                  Get test XTZ from faucet
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
