/**
 * Tezos Wallet Connection Service
 * 
 * This service handles wallet connection, disconnection, and state management
 * using Beacon SDK for Tezos wallets (Temple, Kukai, Umami).
 */

import { BeaconWallet } from '@taquito/beacon-wallet';
import { TezosToolkit } from '@taquito/taquito';
import { NetworkType } from '@airgap/beacon-types';
import { getConfig, getCurrentNetwork, type TezosNetwork } from '../config/tezos';

// Wallet state interface
export interface WalletState {
  connected: boolean;
  address: string | null;
  balance: number | null;
  network: TezosNetwork;
}

// Singleton wallet instance
let walletInstance: BeaconWallet | null = null;
let tezosInstance: TezosToolkit | null = null;

// Storage key for persisting wallet state
const WALLET_STATE_KEY = 'tezos_wallet_state';

/**
 * Initialize BeaconWallet with network configuration
 */
export const initializeWallet = async (network?: TezosNetwork): Promise<BeaconWallet> => {
  const targetNetwork = network || getCurrentNetwork();
  const config = getConfig(targetNetwork);

  // Create new wallet instance if it doesn't exist
  if (!walletInstance) {
    walletInstance = new BeaconWallet({
      name: 'Continuum Protocol',
      preferredNetwork: targetNetwork === 'mainnet' ? NetworkType.MAINNET : NetworkType.GHOSTNET,
    });
  }

  // Initialize Tezos toolkit
  tezosInstance = new TezosToolkit(config.network.rpcEndpoint);
  tezosInstance.setWalletProvider(walletInstance);

  return walletInstance;
};

/**
 * Get the current wallet instance
 */
export const getWallet = (): BeaconWallet | null => {
  return walletInstance;
};

/**
 * Get the current Tezos toolkit instance
 */
export const getTezos = (): TezosToolkit | null => {
  return tezosInstance;
};

/**
 * Connect wallet - prompts user to select and connect their Tezos wallet
 * Supports Temple, Kukai, Umami, and other Beacon-compatible wallets
 */
export const connectWallet = async (network?: TezosNetwork): Promise<WalletState> => {
  try {
    const wallet = await initializeWallet(network);
    const targetNetwork = network || getCurrentNetwork();
    const config = getConfig(targetNetwork);

    // Request permissions from the wallet
    await wallet.requestPermissions({
      type: targetNetwork === 'mainnet' ? NetworkType.MAINNET : NetworkType.GHOSTNET,
      rpcUrl: config.network.rpcEndpoint,
    });

    // Get the active account
    const activeAccount = await wallet.client.getActiveAccount();
    
    if (!activeAccount) {
      throw new Error('No active account found');
    }

    const address = activeAccount.address;

    // Get balance
    const balance = await getBalance(address);

    // Create wallet state
    const walletState: WalletState = {
      connected: true,
      address,
      balance,
      network: targetNetwork,
    };

    // Persist wallet state
    persistWalletState(walletState);

    return walletState;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
};

/**
 * Disconnect wallet - clears wallet connection and state
 */
export const disconnectWallet = async (): Promise<void> => {
  try {
    if (walletInstance) {
      await walletInstance.clearActiveAccount();
    }

    // Clear persisted state
    clearWalletState();

    // Reset instances
    walletInstance = null;
    tezosInstance = null;
  } catch (error) {
    console.error('Failed to disconnect wallet:', error);
    throw error;
  }
};

/**
 * Get XTZ balance for an address
 */
export const getBalance = async (address: string): Promise<number> => {
  try {
    if (!tezosInstance) {
      throw new Error('Tezos instance not initialized');
    }

    const balance = await tezosInstance.tz.getBalance(address);
    // Convert from mutez to XTZ (1 XTZ = 1,000,000 mutez)
    return balance.toNumber() / 1_000_000;
  } catch (error) {
    console.error('Failed to get balance:', error);
    return 0;
  }
};

/**
 * Get current wallet state
 */
export const getWalletState = async (): Promise<WalletState | null> => {
  try {
    if (!walletInstance) {
      // Try to restore from persisted state
      const persisted = getPersistedWalletState();
      if (persisted && persisted.connected) {
        // Reinitialize wallet
        await initializeWallet(persisted.network);
        const activeAccount = await walletInstance!.client.getActiveAccount();
        
        if (activeAccount) {
          const balance = await getBalance(activeAccount.address);
          return {
            connected: true,
            address: activeAccount.address,
            balance,
            network: persisted.network,
          };
        }
      }
      return null;
    }

    const activeAccount = await walletInstance.client.getActiveAccount();
    
    if (!activeAccount) {
      return null;
    }

    const balance = await getBalance(activeAccount.address);
    const network = getCurrentNetwork();

    return {
      connected: true,
      address: activeAccount.address,
      balance,
      network,
    };
  } catch (error) {
    console.error('Failed to get wallet state:', error);
    return null;
  }
};

/**
 * Handle wallet switching - called when user changes accounts in their wallet
 */
export const handleWalletSwitch = async (): Promise<WalletState | null> => {
  try {
    if (!walletInstance) {
      return null;
    }

    const activeAccount = await walletInstance.client.getActiveAccount();
    
    if (!activeAccount) {
      return null;
    }

    const balance = await getBalance(activeAccount.address);
    const network = getCurrentNetwork();

    const walletState: WalletState = {
      connected: true,
      address: activeAccount.address,
      balance,
      network,
    };

    // Update persisted state
    persistWalletState(walletState);

    return walletState;
  } catch (error) {
    console.error('Failed to handle wallet switch:', error);
    return null;
  }
};

/**
 * Switch network (Ghostnet <-> Mainnet)
 */
export const switchNetwork = async (network: TezosNetwork): Promise<WalletState> => {
  try {
    // Disconnect current wallet
    await disconnectWallet();

    // Reconnect with new network
    return await connectWallet(network);
  } catch (error) {
    console.error('Failed to switch network:', error);
    throw error;
  }
};

/**
 * Check if wallet is connected
 */
export const isWalletConnected = async (): Promise<boolean> => {
  try {
    if (!walletInstance) {
      return false;
    }

    const activeAccount = await walletInstance.client.getActiveAccount();
    return activeAccount !== undefined;
  } catch (error) {
    console.error('Failed to check wallet connection:', error);
    return false;
  }
};

// ==============================================================================
// PERSISTENCE HELPERS
// ==============================================================================

/**
 * Persist wallet state to localStorage
 */
const persistWalletState = (state: WalletState): void => {
  try {
    localStorage.setItem(WALLET_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to persist wallet state:', error);
  }
};

/**
 * Get persisted wallet state from localStorage
 */
const getPersistedWalletState = (): WalletState | null => {
  try {
    const stored = localStorage.getItem(WALLET_STATE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return null;
  } catch (error) {
    console.error('Failed to get persisted wallet state:', error);
    return null;
  }
};

/**
 * Clear persisted wallet state
 */
const clearWalletState = (): void => {
  try {
    localStorage.removeItem(WALLET_STATE_KEY);
  } catch (error) {
    console.error('Failed to clear wallet state:', error);
  }
};

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Format XTZ amount for display
 */
export const formatXTZ = (amount: number, decimals: number = 2): string => {
  return amount.toFixed(decimals);
};

/**
 * Convert XTZ to mutez
 */
export const xtzToMutez = (xtz: number): number => {
  return Math.floor(xtz * 1_000_000);
};

/**
 * Convert mutez to XTZ
 */
export const mutezToXTZ = (mutez: number): number => {
  return mutez / 1_000_000;
};
