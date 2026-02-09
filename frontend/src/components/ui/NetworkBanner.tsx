/**
 * Network Banner Component
 * 
 * Displays network-specific information and actions.
 * Shows faucet link on Ghostnet and other network-specific UI elements.
 */

import React, { useState, useEffect } from 'react';
import { ExternalLink, Info, X } from 'lucide-react';
import { getCurrentNetwork, getConfig, isTestnet } from '../../config/tezos';
import { getNetworkPreference, saveNetworkPreference } from '../../services/networkService';

interface NetworkBannerProps {
  showFaucetLink?: boolean;
  dismissible?: boolean;
}

export const NetworkBanner: React.FC<NetworkBannerProps> = ({
  showFaucetLink = true,
  dismissible = true,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const currentNetwork = getCurrentNetwork();
  const config = getConfig(currentNetwork);
  const isTestNetwork = isTestnet(currentNetwork);

  // Check if banner was dismissed in this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem('network_banner_dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('network_banner_dismissed', 'true');
  };

  // Don't show on mainnet or if dismissed
  if (!isTestNetwork || isDismissed) {
    return null;
  }

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))',
        borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
        padding: 'var(--spacing-md)',
      }}
    >
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
            <Info size={20} style={{ color: '#3b82f6', flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: '14px', fontWeight: 500, marginBottom: '4px' }}>
                You are on {config.network.displayName}
              </p>
              {showFaucetLink && config.network.faucetUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    Need test XTZ?
                  </p>
                  <a
                    href={config.network.faucetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      fontSize: '12px',
                      color: 'var(--color-primary)',
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    Get test XTZ from faucet
                    <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>
          {dismissible && (
            <button
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                padding: 'var(--spacing-xs)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

interface ExplorerLinkProps {
  address?: string;
  txHash?: string;
  opHash?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Explorer Link Component
 * 
 * Creates a link to the appropriate block explorer based on current network.
 * Supports addresses, transaction hashes, and operation hashes.
 */
export const ExplorerLink: React.FC<ExplorerLinkProps> = ({
  address,
  txHash,
  opHash,
  children,
  className = '',
}) => {
  const currentNetwork = getCurrentNetwork();
  const config = getConfig(currentNetwork);

  let url = config.network.blockExplorer;
  let displayText = children;

  if (address) {
    url = `${config.network.blockExplorer}/${address}`;
    displayText = displayText || address;
  } else if (txHash) {
    url = `${config.network.blockExplorer}/${txHash}`;
    displayText = displayText || txHash;
  } else if (opHash) {
    url = `${config.network.blockExplorer}/${opHash}`;
    displayText = displayText || opHash;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        color: 'var(--color-primary)',
        textDecoration: 'none',
        fontSize: '14px',
      }}
    >
      {displayText}
      <ExternalLink size={14} />
    </a>
  );
};

interface NetworkSelectorProps {
  onNetworkChange?: (network: 'ghostnet' | 'mainnet') => void;
}

/**
 * Network Selector Component
 * 
 * Allows users to select between Ghostnet and Mainnet.
 * Stores preference in localStorage.
 */
export const NetworkSelector: React.FC<NetworkSelectorProps> = ({ onNetworkChange }) => {
  const [selectedNetwork, setSelectedNetwork] = useState<'ghostnet' | 'mainnet'>(
    getCurrentNetwork()
  );

  const handleNetworkChange = (network: 'ghostnet' | 'mainnet') => {
    setSelectedNetwork(network);
    saveNetworkPreference(network);
    
    if (onNetworkChange) {
      onNetworkChange(network);
    }

    // Reload to apply new network configuration
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
      <button
        onClick={() => handleNetworkChange('ghostnet')}
        style={{
          padding: 'var(--spacing-xs) var(--spacing-md)',
          borderRadius: 'var(--border-radius-sm)',
          border: '1px solid',
          borderColor: selectedNetwork === 'ghostnet' ? 'var(--color-primary)' : 'rgba(255, 255, 255, 0.2)',
          background: selectedNetwork === 'ghostnet' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
          color: selectedNetwork === 'ghostnet' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
      >
        Ghostnet
      </button>
      <button
        onClick={() => handleNetworkChange('mainnet')}
        style={{
          padding: 'var(--spacing-xs) var(--spacing-md)',
          borderRadius: 'var(--border-radius-sm)',
          border: '1px solid',
          borderColor: selectedNetwork === 'mainnet' ? 'var(--color-success)' : 'rgba(255, 255, 255, 0.2)',
          background: selectedNetwork === 'mainnet' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
          color: selectedNetwork === 'mainnet' ? 'var(--color-success)' : 'var(--color-text-secondary)',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
        }}
      >
        Mainnet
      </button>
    </div>
  );
};
