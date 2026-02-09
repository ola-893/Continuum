/**
 * Network Manager Hook
 * 
 * React hook for managing network state, detection, and switching.
 * Provides real-time network status and utilities for network operations.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getNetworkState, 
  detectWalletNetwork,
  isOnCorrectNetwork,
  getNetworkMismatchMessage,
  saveNetworkPreference,
  getNetworkPreference,
  validateCurrentNetworkContracts,
  getConfigurationWarnings,
  getNetworkInfo,
  isNetworkFullyConfigured,
  getNetworkSwitchInstructions,
  type NetworkState
} from '../services/networkService';
import { switchNetwork } from '../services/tezosWalletService';
import { type TezosNetwork, getCurrentNetwork } from '../config/tezos';

export interface UseNetworkManagerReturn {
  // State
  networkState: NetworkState | null;
  isLoading: boolean;
  error: string | null;
  
  // Network info
  currentNetwork: TezosNetwork;
  connectedNetwork: TezosNetwork | null;
  isCorrectNetwork: boolean;
  needsSwitch: boolean;
  mismatchMessage: string | null;
  configWarnings: string[];
  isFullyConfigured: boolean;
  
  // Actions
  refreshNetworkState: () => Promise<void>;
  switchToNetwork: (network: TezosNetwork) => Promise<void>;
  getSwitchInstructions: (network: TezosNetwork) => string;
}

/**
 * Hook for managing network state and operations
 */
export const useNetworkManager = (autoRefresh: boolean = true): UseNetworkManagerReturn => {
  const [networkState, setNetworkState] = useState<NetworkState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mismatchMessage, setMismatchMessage] = useState<string | null>(null);
  const [configWarnings, setConfigWarnings] = useState<string[]>([]);

  const currentNetwork = getCurrentNetwork();

  /**
   * Refresh network state
   */
  const refreshNetworkState = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get network state
      const state = await getNetworkState();
      setNetworkState(state);

      // Get mismatch message if needed
      if (state.needsSwitch) {
        const message = await getNetworkMismatchMessage();
        setMismatchMessage(message);
      } else {
        setMismatchMessage(null);
      }

      // Get configuration warnings
      const warnings = getConfigurationWarnings();
      setConfigWarnings(warnings);

    } catch (err) {
      console.error('Failed to refresh network state:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh network state');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Switch to a different network
   */
  const switchToNetwork = useCallback(async (network: TezosNetwork) => {
    try {
      setIsLoading(true);
      setError(null);

      // Save preference
      saveNetworkPreference(network);

      // Switch network in wallet
      await switchNetwork(network);

      // Refresh state
      await refreshNetworkState();

      // Reload page to apply new configuration
      window.location.reload();

    } catch (err) {
      console.error('Failed to switch network:', err);
      setError(err instanceof Error ? err.message : 'Failed to switch network');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [refreshNetworkState]);

  /**
   * Get switch instructions for a network
   */
  const getSwitchInstructions = useCallback((network: TezosNetwork): string => {
    return getNetworkSwitchInstructions(network);
  }, []);

  // Initial load
  useEffect(() => {
    refreshNetworkState();
  }, [refreshNetworkState]);

  // Auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshNetworkState();
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshNetworkState]);

  return {
    // State
    networkState,
    isLoading,
    error,
    
    // Network info
    currentNetwork,
    connectedNetwork: networkState?.connectedNetwork || null,
    isCorrectNetwork: networkState?.isCorrectNetwork || false,
    needsSwitch: networkState?.needsSwitch || false,
    mismatchMessage,
    configWarnings,
    isFullyConfigured: isNetworkFullyConfigured(),
    
    // Actions
    refreshNetworkState,
    switchToNetwork,
    getSwitchInstructions,
  };
};

/**
 * Hook for simple network detection
 */
export const useNetworkDetection = () => {
  const [detectedNetwork, setDetectedNetwork] = useState<TezosNetwork | null>(null);
  const [isDetecting, setIsDetecting] = useState(true);

  useEffect(() => {
    const detect = async () => {
      setIsDetecting(true);
      const network = await detectWalletNetwork();
      setDetectedNetwork(network);
      setIsDetecting(false);
    };

    detect();

    // Re-detect every 5 seconds
    const interval = setInterval(detect, 5000);
    return () => clearInterval(interval);
  }, []);

  return {
    detectedNetwork,
    isDetecting,
    isCorrect: detectedNetwork === getCurrentNetwork(),
  };
};

/**
 * Hook for network validation
 */
export const useNetworkValidation = () => {
  const [isValid, setIsValid] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);

  useEffect(() => {
    const validate = () => {
      const valid = validateCurrentNetworkContracts();
      const warns = getConfigurationWarnings();
      
      setIsValid(valid);
      setWarnings(warns);
    };

    validate();
  }, []);

  return {
    isValid,
    warnings,
    hasWarnings: warnings.length > 0,
  };
};
