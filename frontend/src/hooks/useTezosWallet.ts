/**
 * Tezos Wallet Hook
 * 
 * React hook for managing Tezos wallet state and operations.
 * Provides wallet connection status, address, balance, and connection methods.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  connectWallet,
  disconnectWallet,
  getWalletState,
  getBalance,
  switchNetwork,
  type WalletState,
} from '../services/tezosWalletService';
import type { TezosNetwork } from '../config/tezos';

export interface UseTezosWalletReturn {
  // State
  connected: boolean;
  isConnected: boolean; // Alias for connected
  address: string | null;
  balance: number | null;
  network: TezosNetwork;
  loading: boolean;
  error: string | null;

  // Methods
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (network: TezosNetwork) => Promise<void>;
  refreshBalance: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook for managing Tezos wallet connection and state
 */
export const useTezosWallet = (): UseTezosWalletReturn => {
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize wallet state on mount
  useEffect(() => {
    initializeWallet();
  }, []);

  // Set up balance refresh interval when connected
  useEffect(() => {
    if (walletState?.connected && walletState.address) {
      // Refresh balance every 30 seconds
      const interval = setInterval(() => {
        refreshBalance();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [walletState?.connected, walletState?.address]);

  const initializeWallet = async () => {
    try {
      setLoading(true);
      const state = await getWalletState();
      setWalletState(state);
    } catch (err: any) {
      console.error('Failed to initialize wallet:', err);
      setError(err.message || 'Failed to initialize wallet');
    } finally {
      setLoading(false);
    }
  };

  const connect = useCallback(async (network?: TezosNetwork) => {
    try {
      setLoading(true);
      setError(null);
      const state = await connectWallet(network);
      setWalletState(state);
    } catch (err: any) {
      console.error('Failed to connect wallet:', err);
      setError(err.message || 'Failed to connect wallet');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await disconnectWallet();
      setWalletState(null);
    } catch (err: any) {
      console.error('Failed to disconnect wallet:', err);
      setError(err.message || 'Failed to disconnect wallet');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSwitchNetwork = useCallback(async (network: TezosNetwork) => {
    try {
      setLoading(true);
      setError(null);
      const state = await switchNetwork(network);
      setWalletState(state);
    } catch (err: any) {
      console.error('Failed to switch network:', err);
      setError(err.message || 'Failed to switch network');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!walletState?.address) {
      return;
    }

    try {
      const balance = await getBalance(walletState.address);
      setWalletState((prev) => (prev ? { ...prev, balance } : null));
    } catch (err: any) {
      console.error('Failed to refresh balance:', err);
      // Don't set error for balance refresh failures
    }
  }, [walletState?.address]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    connected: walletState?.connected || false,
    isConnected: walletState?.connected || false, // Alias for connected
    address: walletState?.address || null,
    balance: walletState?.balance || null,
    network: walletState?.network || 'ghostnet',
    loading,
    error,

    // Methods
    connect,
    disconnect,
    switchNetwork: handleSwitchNetwork,
    refreshBalance,
    clearError,
  };
};
