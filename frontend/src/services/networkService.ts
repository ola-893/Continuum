/**
 * Network Management Service
 * 
 * This service handles network detection, switching, and validation.
 * It ensures the wallet is connected to the correct network and provides
 * utilities for network-related operations.
 */

import { NetworkType } from '@airgap/beacon-types';
import { getWallet } from './tezosWalletService';
import { 
  type TezosNetwork, 
  getCurrentNetwork, 
  getConfig,
  isTestnet,
  getNetworkDisplayName,
  validateContractAddresses,
  getMissingContracts
} from '../config/tezos';

// Network preference storage key
const NETWORK_PREFERENCE_KEY = 'tezos_network_preference';

// Network state interface
export interface NetworkState {
  currentNetwork: TezosNetwork;
  connectedNetwork: TezosNetwork | null;
  isCorrectNetwork: boolean;
  needsSwitch: boolean;
  missingContracts: string[];
}

/**
 * Detect the network from the connected wallet
 */
export const detectWalletNetwork = async (): Promise<TezosNetwork | null> => {
  try {
    const wallet = getWallet();
    if (!wallet) {
      return null;
    }

    const activeAccount = await wallet.client.getActiveAccount();
    if (!activeAccount) {
      return null;
    }

    // Get network type from active account
    const networkType = activeAccount.network.type;
    
    // Map Beacon network type to our network type
    if (networkType === NetworkType.MAINNET) {
      return 'mainnet';
    } else if (networkType === NetworkType.GHOSTNET) {
      return 'ghostnet';
    }

    // Default to ghostnet for other testnets
    return 'ghostnet';
  } catch (error) {
    console.error('Failed to detect wallet network:', error);
    return null;
  }
};

/**
 * Get current network state
 */
export const getNetworkState = async (): Promise<NetworkState> => {
  const currentNetwork = getCurrentNetwork();
  const connectedNetwork = await detectWalletNetwork();
  const isCorrectNetwork = connectedNetwork === currentNetwork;
  const needsSwitch = connectedNetwork !== null && !isCorrectNetwork;
  const missingContracts = getMissingContracts(currentNetwork);

  return {
    currentNetwork,
    connectedNetwork,
    isCorrectNetwork,
    needsSwitch,
    missingContracts,
  };
};

/**
 * Check if wallet is on the correct network
 */
export const isOnCorrectNetwork = async (): Promise<boolean> => {
  const state = await getNetworkState();
  return state.isCorrectNetwork;
};

/**
 * Get network mismatch warning message
 */
export const getNetworkMismatchMessage = async (): Promise<string | null> => {
  const state = await getNetworkState();
  
  if (!state.needsSwitch) {
    return null;
  }

  const expectedName = getNetworkDisplayName(state.currentNetwork);
  const connectedName = state.connectedNetwork 
    ? getNetworkDisplayName(state.connectedNetwork)
    : 'Unknown';

  return `You are connected to ${connectedName}, but the app is configured for ${expectedName}. Please switch networks in your wallet.`;
};

/**
 * Save network preference to localStorage
 */
export const saveNetworkPreference = (network: TezosNetwork): void => {
  try {
    localStorage.setItem(NETWORK_PREFERENCE_KEY, network);
  } catch (error) {
    console.error('Failed to save network preference:', error);
  }
};

/**
 * Get saved network preference from localStorage
 */
export const getNetworkPreference = (): TezosNetwork | null => {
  try {
    const preference = localStorage.getItem(NETWORK_PREFERENCE_KEY);
    if (preference === 'mainnet' || preference === 'ghostnet') {
      return preference;
    }
    return null;
  } catch (error) {
    console.error('Failed to get network preference:', error);
    return null;
  }
};

/**
 * Clear network preference
 */
export const clearNetworkPreference = (): void => {
  try {
    localStorage.removeItem(NETWORK_PREFERENCE_KEY);
  } catch (error) {
    console.error('Failed to clear network preference:', error);
  }
};

/**
 * Validate that all contracts are configured for the current network
 */
export const validateCurrentNetworkContracts = (): boolean => {
  return validateContractAddresses();
};

/**
 * Get configuration warnings for the current network
 */
export const getConfigurationWarnings = (): string[] => {
  const warnings: string[] = [];
  const currentNetwork = getCurrentNetwork();
  const config = getConfig(currentNetwork);
  const missingContracts = getMissingContracts(currentNetwork);

  // Check for missing contracts
  if (missingContracts.length > 0) {
    warnings.push(
      `Missing contract addresses for ${currentNetwork}: ${missingContracts.join(', ')}`
    );
  }

  // Check for missing RPC endpoint
  if (!config.network.rpcEndpoint) {
    warnings.push(`Missing RPC endpoint for ${currentNetwork}`);
  }

  return warnings;
};

/**
 * Get network information for display
 */
export const getNetworkInfo = (network?: TezosNetwork) => {
  const config = getConfig(network);
  return {
    name: config.network.name,
    displayName: config.network.displayName,
    isTestnet: config.network.isTestnet,
    blockExplorer: config.network.blockExplorer,
    blockExplorerName: config.network.blockExplorerName,
    faucetUrl: config.network.faucetUrl,
    rpcEndpoint: config.network.rpcEndpoint,
  };
};

/**
 * Check if network has all required configuration
 */
export const isNetworkFullyConfigured = (network?: TezosNetwork): boolean => {
  const config = getConfig(network);
  const hasRpc = !!config.network.rpcEndpoint;
  const hasContracts = validateContractAddresses(network);
  return hasRpc && hasContracts;
};

/**
 * Get network switch instructions for user
 */
export const getNetworkSwitchInstructions = (targetNetwork: TezosNetwork): string => {
  const networkName = getNetworkDisplayName(targetNetwork);
  return `To switch to ${networkName}:
1. Open your Tezos wallet (Temple, Kukai, or Umami)
2. Look for the network selector (usually in settings or top bar)
3. Select "${networkName}"
4. Refresh this page or reconnect your wallet`;
};

/**
 * Monitor network changes
 * Returns a cleanup function to stop monitoring
 */
export const monitorNetworkChanges = (
  callback: (state: NetworkState) => void,
  intervalMs: number = 5000
): (() => void) => {
  let isMonitoring = true;
  
  const checkNetwork = async () => {
    if (!isMonitoring) return;
    
    const state = await getNetworkState();
    callback(state);
    
    if (isMonitoring) {
      setTimeout(checkNetwork, intervalMs);
    }
  };
  
  // Start monitoring
  checkNetwork();
  
  // Return cleanup function
  return () => {
    isMonitoring = false;
  };
};
