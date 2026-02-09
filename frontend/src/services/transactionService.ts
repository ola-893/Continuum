/**
 * Transaction Handling Service
 * 
 * This service handles transaction submission, confirmation polling,
 * status tracking, and error handling for Tezos operations.
 */

import { OpKind, WalletOperation } from '@taquito/taquito';
import { getTezos } from './tezosWalletService';
import { getTxExplorerUrl } from '../config/tezos';
import { logGasCost } from './analyticsTrackingService';
import { GasEstimate } from './gasEstimationService';

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
}

export interface TransactionState {
  hash: string;
  status: TransactionStatus;
  confirmations: number;
  error?: string;
  explorerUrl: string;
}

export interface TransactionResult {
  success: boolean;
  hash?: string;
  error?: string;
  explorerUrl?: string;
}

// ==============================================================================
// TRANSACTION SUBMISSION
// ==============================================================================

/**
 * Submit a transaction and return operation hash
 * This is a wrapper around contract method calls
 * 
 * @param operationPromise - Promise that resolves to a wallet operation
 * @param operationType - Type of operation for analytics tracking
 * @param gasEstimate - Gas estimate for analytics tracking
 * @param userAddress - User address for analytics tracking
 */
export const submitTransaction = async (
  operationPromise: Promise<WalletOperation>,
  operationType?: string,
  gasEstimate?: GasEstimate,
  userAddress?: string
): Promise<TransactionResult> => {
  try {
    const operation = await operationPromise;
    const hash = operation.opHash;
    const explorerUrl = getTxExplorerUrl(hash);

    // Log gas cost for analytics if estimate provided
    if (operationType && gasEstimate) {
      logGasCost(operationType, gasEstimate, hash, userAddress, true);
    }

    return {
      success: true,
      hash,
      explorerUrl,
    };
  } catch (error: any) {
    console.error('Transaction submission failed:', error);
    
    // Log failed transaction for analytics if estimate provided
    if (operationType && gasEstimate) {
      logGasCost(
        operationType,
        gasEstimate,
        undefined,
        userAddress,
        false,
        parseTransactionError(error)
      );
    }

    return {
      success: false,
      error: parseTransactionError(error),
    };
  }
};

/**
 * Submit transaction and wait for confirmation
 * 
 * @param operationPromise - Promise that resolves to a wallet operation
 * @param confirmations - Number of confirmations to wait for
 * @param operationType - Type of operation for analytics tracking
 * @param gasEstimate - Gas estimate for analytics tracking
 * @param userAddress - User address for analytics tracking
 */
export const submitAndConfirm = async (
  operationPromise: Promise<WalletOperation>,
  confirmations: number = 1,
  operationType?: string,
  gasEstimate?: GasEstimate,
  userAddress?: string
): Promise<TransactionResult> => {
  try {
    const operation = await operationPromise;
    const hash = operation.opHash;
    const explorerUrl = getTxExplorerUrl(hash);

    // Wait for confirmation
    await operation.confirmation(confirmations);

    // Log gas cost for analytics if estimate provided
    if (operationType && gasEstimate) {
      logGasCost(operationType, gasEstimate, hash, userAddress, true);
    }

    return {
      success: true,
      hash,
      explorerUrl,
    };
  } catch (error: any) {
    console.error('Transaction failed:', error);
    
    // Log failed transaction for analytics if estimate provided
    if (operationType && gasEstimate) {
      logGasCost(
        operationType,
        gasEstimate,
        undefined,
        userAddress,
        false,
        parseTransactionError(error)
      );
    }

    return {
      success: false,
      error: parseTransactionError(error),
    };
  }
};

// ==============================================================================
// TRANSACTION CONFIRMATION POLLING
// ==============================================================================

/**
 * Poll for transaction confirmation
 * Returns a promise that resolves when transaction is confirmed
 */
export const pollForConfirmation = async (
  hash: string,
  confirmations: number = 1,
  timeout: number = 120000 // 2 minutes default
): Promise<boolean> => {
  const tezos = getTezos();
  if (!tezos) {
    throw new Error('Tezos instance not initialized');
  }

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const operation = await tezos.operation.createOperation(hash);
      const currentConfirmations = await operation.getCurrentConfirmation();

      if (currentConfirmations >= confirmations) {
        return true;
      }

      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Error polling for confirmation:', error);
      // Continue polling even if there's an error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  throw new Error('Transaction confirmation timeout');
};

/**
 * Get current confirmation count for a transaction
 */
export const getConfirmationCount = async (hash: string): Promise<number> => {
  const tezos = getTezos();
  if (!tezos) {
    throw new Error('Tezos instance not initialized');
  }

  try {
    const operation = await tezos.operation.createOperation(hash);
    return await operation.getCurrentConfirmation();
  } catch (error) {
    console.error('Error getting confirmation count:', error);
    return 0;
  }
};

/**
 * Check if transaction is confirmed
 */
export const isTransactionConfirmed = async (
  hash: string,
  requiredConfirmations: number = 1
): Promise<boolean> => {
  const confirmations = await getConfirmationCount(hash);
  return confirmations >= requiredConfirmations;
};

// ==============================================================================
// TRANSACTION STATUS TRACKING
// ==============================================================================

/**
 * Get transaction status
 */
export const getTransactionStatus = async (hash: string): Promise<TransactionState> => {
  const tezos = getTezos();
  if (!tezos) {
    throw new Error('Tezos instance not initialized');
  }

  try {
    const operation = await tezos.operation.createOperation(hash);
    const confirmations = await operation.getCurrentConfirmation();
    const explorerUrl = getTxExplorerUrl(hash);

    let status: TransactionStatus;
    if (confirmations === 0) {
      status = TransactionStatus.PENDING;
    } else if (confirmations < 2) {
      status = TransactionStatus.CONFIRMING;
    } else {
      status = TransactionStatus.CONFIRMED;
    }

    return {
      hash,
      status,
      confirmations,
      explorerUrl,
    };
  } catch (error: any) {
    console.error('Error getting transaction status:', error);
    
    return {
      hash,
      status: TransactionStatus.FAILED,
      confirmations: 0,
      error: parseTransactionError(error),
      explorerUrl: getTxExplorerUrl(hash),
    };
  }
};

/**
 * Watch transaction status with callback
 * Polls every 5 seconds until confirmed or timeout
 */
export const watchTransaction = async (
  hash: string,
  onStatusChange: (state: TransactionState) => void,
  requiredConfirmations: number = 2,
  timeout: number = 120000 // 2 minutes
): Promise<void> => {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const state = await getTransactionStatus(hash);
    onStatusChange(state);

    if (state.status === TransactionStatus.CONFIRMED || state.status === TransactionStatus.FAILED) {
      return;
    }

    if (state.confirmations >= requiredConfirmations) {
      onStatusChange({
        ...state,
        status: TransactionStatus.CONFIRMED,
      });
      return;
    }

    // Wait 5 seconds before next poll
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  // Timeout
  onStatusChange({
    hash,
    status: TransactionStatus.FAILED,
    confirmations: 0,
    error: 'Transaction confirmation timeout',
    explorerUrl: getTxExplorerUrl(hash),
  });
};

// ==============================================================================
// ERROR HANDLING
// ==============================================================================

/**
 * Parse transaction error into user-friendly message
 */
export const parseTransactionError = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error.message) {
    // Check for common error patterns
    if (error.message.includes('User rejected')) {
      return 'Transaction was rejected by user';
    }
    
    if (error.message.includes('insufficient balance')) {
      return 'Insufficient balance to complete transaction';
    }
    
    if (error.message.includes('gas')) {
      return 'Transaction failed due to gas limit. Please try again.';
    }
    
    if (error.message.includes('storage')) {
      return 'Transaction failed due to storage limit. Please try again.';
    }
    
    if (error.message.includes('timeout')) {
      return 'Transaction timed out. Please check the block explorer.';
    }

    if (error.message.includes('not authorized')) {
      return 'You are not authorized to perform this action';
    }

    if (error.message.includes('frozen')) {
      return 'This stream is frozen and cannot be modified';
    }

    if (error.message.includes('expired')) {
      return 'Your KYC verification has expired';
    }

    if (error.message.includes('not whitelisted')) {
      return 'You are not whitelisted for this asset type';
    }

    // Return original message if no pattern matches
    return error.message;
  }

  if (error.description) {
    return error.description;
  }

  return 'Transaction failed. Please try again.';
};

/**
 * Check if error is a user rejection
 */
export const isUserRejection = (error: any): boolean => {
  if (typeof error === 'string') {
    return error.toLowerCase().includes('reject');
  }
  
  if (error.message) {
    return error.message.toLowerCase().includes('reject');
  }
  
  return false;
};

/**
 * Check if error is due to insufficient balance
 */
export const isInsufficientBalance = (error: any): boolean => {
  if (typeof error === 'string') {
    return error.toLowerCase().includes('insufficient');
  }
  
  if (error.message) {
    return error.message.toLowerCase().includes('insufficient');
  }
  
  return false;
};

/**
 * Check if error is due to gas/storage limits
 */
export const isGasError = (error: any): boolean => {
  const errorStr = typeof error === 'string' ? error : error.message || '';
  return errorStr.toLowerCase().includes('gas') || errorStr.toLowerCase().includes('storage');
};

// ==============================================================================
// TRANSACTION HISTORY
// ==============================================================================

interface TransactionHistoryEntry {
  hash: string;
  timestamp: number;
  type: string;
  status: TransactionStatus;
  explorerUrl: string;
}

const TRANSACTION_HISTORY_KEY = 'tezos_transaction_history';
const MAX_HISTORY_ENTRIES = 50;

/**
 * Add transaction to local history
 */
export const addToHistory = (
  hash: string,
  type: string,
  status: TransactionStatus = TransactionStatus.PENDING
): void => {
  try {
    const history = getTransactionHistory();
    
    const entry: TransactionHistoryEntry = {
      hash,
      timestamp: Date.now(),
      type,
      status,
      explorerUrl: getTxExplorerUrl(hash),
    };

    // Add to beginning of array
    history.unshift(entry);

    // Keep only last MAX_HISTORY_ENTRIES
    const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);

    localStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Failed to add transaction to history:', error);
  }
};

/**
 * Get transaction history from local storage
 */
export const getTransactionHistory = (): TransactionHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Failed to get transaction history:', error);
    return [];
  }
};

/**
 * Update transaction status in history
 */
export const updateHistoryStatus = (hash: string, status: TransactionStatus): void => {
  try {
    const history = getTransactionHistory();
    const entry = history.find(e => e.hash === hash);
    
    if (entry) {
      entry.status = status;
      localStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error('Failed to update transaction history:', error);
  }
};

/**
 * Clear transaction history
 */
export const clearTransactionHistory = (): void => {
  try {
    localStorage.removeItem(TRANSACTION_HISTORY_KEY);
  } catch (error) {
    console.error('Failed to clear transaction history:', error);
  }
};

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Format transaction hash for display
 */
export const formatTxHash = (hash: string, chars: number = 8): string => {
  if (hash.length <= chars * 2) {
    return hash;
  }
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
};

/**
 * Get transaction age in human-readable format
 */
export const getTransactionAge = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

/**
 * Estimate transaction time (Tezos block time is ~30 seconds)
 */
export const estimateConfirmationTime = (confirmations: number): string => {
  const seconds = confirmations * 30; // 30 seconds per block
  
  if (seconds < 60) {
    return `~${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  return `~${minutes}m`;
};
