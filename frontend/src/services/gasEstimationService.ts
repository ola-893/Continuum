/**
 * Gas Estimation Service
 * 
 * This service handles gas and fee estimation for Tezos transactions.
 * It provides estimates before transaction submission and handles gas limit errors.
 * 
 * Note: This implementation uses pre-calculated estimates based on typical usage.
 * For precise real-time estimation, integrate with Tezos RPC simulation or indexer services.
 */

import { getTezos } from './tezosWalletService';
import { mutezToXTZ } from './tezosWalletService';

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

export interface GasEstimate {
  gasLimit: number;
  storageLimit: number;
  fee: number; // in mutez
  totalCost: number; // in mutez (fee + storage cost)
  feeInXTZ: number; // fee in XTZ for display
  totalCostInXTZ: number; // total cost in XTZ for display
}

export interface EstimationError {
  error: string;
  suggestion?: string;
}

// Storage cost per byte on Tezos (approximately 0.00025 XTZ per byte)
const STORAGE_COST_PER_BYTE = 250; // in mutez

// ==============================================================================
// GAS ESTIMATION
// ==============================================================================

/**
 * Estimate gas for a contract method call
 * Returns detailed gas and fee information based on operation type
 * 
 * @param contractAddress - Contract address (reserved for future RPC integration)
 * @param methodName - Method name to estimate
 * @param args - Method arguments (reserved for future RPC integration)
 */
export const estimateGas = async (
  contractAddress: string,
  methodName: string,
  ...args: any[]
): Promise<GasEstimate | EstimationError> => {
  const tezos = getTezos();
  if (!tezos) {
    return {
      error: 'Tezos instance not initialized. Please connect wallet first.',
    };
  }

  try {
    // Return quick estimate based on operation type
    // Note: contractAddress and args are reserved for future RPC simulation integration
    const quickEstimate = getQuickEstimate(methodName);
    return quickEstimate;
  } catch (error: any) {
    console.error('Gas estimation failed:', error);
    return parseEstimationError(error);
  }
};

/**
 * Estimate gas for a batch of operations
 */
export const estimateBatchGas = async (
  operations: Array<{
    contractAddress: string;
    methodName: string;
    args: any[];
  }>
): Promise<GasEstimate | EstimationError> => {
  const tezos = getTezos();
  if (!tezos) {
    return {
      error: 'Tezos instance not initialized. Please connect wallet first.',
    };
  }

  try {
    // Sum up quick estimates for all operations
    const estimates = operations.map(op => getQuickEstimate(op.methodName));
    
    const totalGasLimit = estimates.reduce((sum, est) => sum + est.gasLimit, 0);
    const totalStorageLimit = estimates.reduce((sum, est) => sum + est.storageLimit, 0);
    const totalFee = estimates.reduce((sum, est) => sum + est.fee, 0);
    const totalCost = estimates.reduce((sum, est) => sum + est.totalCost, 0);

    return {
      gasLimit: totalGasLimit,
      storageLimit: totalStorageLimit,
      fee: totalFee,
      totalCost,
      feeInXTZ: mutezToXTZ(totalFee),
      totalCostInXTZ: mutezToXTZ(totalCost),
    };
  } catch (error: any) {
    console.error('Batch gas estimation failed:', error);
    return parseEstimationError(error);
  }
};

/**
 * Quick estimate for common operations (cached values)
 * These are approximate values based on typical usage
 */
export const getQuickEstimate = (operationType: string): GasEstimate => {
  const estimates: Record<string, GasEstimate> = {
    create_stream: {
      gasLimit: 50000,
      storageLimit: 500,
      fee: 5000,
      totalCost: 130000,
      feeInXTZ: 0.005,
      totalCostInXTZ: 0.13,
    },
    withdraw: {
      gasLimit: 30000,
      storageLimit: 100,
      fee: 3000,
      totalCost: 28000,
      feeInXTZ: 0.003,
      totalCostInXTZ: 0.028,
    },
    flash_advance: {
      gasLimit: 35000,
      storageLimit: 100,
      fee: 3500,
      totalCost: 28500,
      feeInXTZ: 0.0035,
      totalCostInXTZ: 0.0285,
    },
    cancel_stream: {
      gasLimit: 30000,
      storageLimit: 50,
      fee: 3000,
      totalCost: 15500,
      feeInXTZ: 0.003,
      totalCostInXTZ: 0.0155,
    },
    claim_yield: {
      gasLimit: 40000,
      storageLimit: 100,
      fee: 4000,
      totalCost: 29000,
      feeInXTZ: 0.004,
      totalCostInXTZ: 0.029,
    },
    claim_yield_for_asset: {
      gasLimit: 40000,
      storageLimit: 100,
      fee: 4000,
      totalCost: 29000,
      feeInXTZ: 0.004,
      totalCostInXTZ: 0.029,
    },
    create_rwa_stream: {
      gasLimit: 80000,
      storageLimit: 800,
      fee: 8000,
      totalCost: 208000,
      feeInXTZ: 0.008,
      totalCostInXTZ: 0.208,
    },
    create_compliant_rwa_stream: {
      gasLimit: 80000,
      storageLimit: 800,
      fee: 8000,
      totalCost: 208000,
      feeInXTZ: 0.008,
      totalCostInXTZ: 0.208,
    },
    register_identity: {
      gasLimit: 25000,
      storageLimit: 300,
      fee: 2500,
      totalCost: 77500,
      feeInXTZ: 0.0025,
      totalCostInXTZ: 0.0775,
    },
    whitelist_address: {
      gasLimit: 20000,
      storageLimit: 100,
      fee: 2000,
      totalCost: 27000,
      feeInXTZ: 0.002,
      totalCostInXTZ: 0.027,
    },
    freeze_stream: {
      gasLimit: 20000,
      storageLimit: 100,
      fee: 2000,
      totalCost: 27000,
      feeInXTZ: 0.002,
      totalCostInXTZ: 0.027,
    },
    batch_whitelist: {
      gasLimit: 100000,
      storageLimit: 500,
      fee: 10000,
      totalCost: 135000,
      feeInXTZ: 0.01,
      totalCostInXTZ: 0.135,
    },
    transfer: {
      gasLimit: 25000,
      storageLimit: 50,
      fee: 2500,
      totalCost: 15000,
      feeInXTZ: 0.0025,
      totalCostInXTZ: 0.015,
    },
    compliant_claim_yield: {
      gasLimit: 45000,
      storageLimit: 100,
      fee: 4500,
      totalCost: 29500,
      feeInXTZ: 0.0045,
      totalCostInXTZ: 0.0295,
    },
    compliant_flash_advance: {
      gasLimit: 40000,
      storageLimit: 100,
      fee: 4000,
      totalCost: 29000,
      feeInXTZ: 0.004,
      totalCostInXTZ: 0.029,
    },
  };

  return estimates[operationType] || {
    gasLimit: 50000,
    storageLimit: 200,
    fee: 5000,
    totalCost: 55000,
    feeInXTZ: 0.005,
    totalCostInXTZ: 0.055,
  };
};

// ==============================================================================
// ERROR HANDLING
// ==============================================================================

/**
 * Parse estimation error into user-friendly message
 */
const parseEstimationError = (error: any): EstimationError => {
  const errorStr = typeof error === 'string' ? error : error.message || '';

  // Gas limit exceeded
  if (errorStr.toLowerCase().includes('gas') && errorStr.toLowerCase().includes('exhausted')) {
    return {
      error: 'Operation would exceed gas limit',
      suggestion: 'This operation is too complex or the contract state is invalid. Please check your inputs.',
    };
  }

  // Storage limit exceeded
  if (errorStr.toLowerCase().includes('storage')) {
    return {
      error: 'Operation would exceed storage limit',
      suggestion: 'This operation requires too much storage. Please try with smaller inputs or contact support.',
    };
  }

  // Insufficient balance
  if (errorStr.toLowerCase().includes('balance') || errorStr.toLowerCase().includes('insufficient')) {
    return {
      error: 'Insufficient balance to pay for transaction fees',
      suggestion: 'Please add more XTZ to your wallet to cover transaction costs.',
    };
  }

  // Contract error
  if (errorStr.toLowerCase().includes('script_rejected') || errorStr.toLowerCase().includes('rejected')) {
    return {
      error: 'Contract rejected the operation',
      suggestion: 'The contract validation failed. Please check that you meet all requirements (KYC, whitelisting, etc.).',
    };
  }

  // Generic error
  return {
    error: 'Failed to estimate gas',
    suggestion: 'Please check your inputs and try again. If the problem persists, contact support.',
  };
};

/**
 * Check if user has sufficient balance for estimated cost
 */
export const hasSufficientBalance = async (
  userAddress: string,
  estimatedCost: number // in mutez
): Promise<boolean> => {
  const tezos = getTezos();
  if (!tezos) {
    return false;
  }

  try {
    const balance = await tezos.tz.getBalance(userAddress);
    return balance.toNumber() >= estimatedCost;
  } catch (error) {
    console.error('Failed to check balance:', error);
    return false;
  }
};

/**
 * Get recommended gas buffer (add 10% safety margin)
 */
export const getRecommendedGasLimit = (estimatedGas: number): number => {
  return Math.ceil(estimatedGas * 1.1);
};

/**
 * Get recommended storage buffer (add 20% safety margin)
 */
export const getRecommendedStorageLimit = (estimatedStorage: number): number => {
  return Math.ceil(estimatedStorage * 1.2);
};

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Format gas estimate for display
 */
export const formatGasEstimate = (estimate: GasEstimate): string => {
  return `Gas: ${estimate.gasLimit.toLocaleString()} | Storage: ${estimate.storageLimit} bytes | Fee: ${estimate.feeInXTZ.toFixed(4)} XTZ`;
};

/**
 * Format total cost for display
 */
export const formatTotalCost = (estimate: GasEstimate): string => {
  return `${estimate.totalCostInXTZ.toFixed(4)} XTZ`;
};

/**
 * Check if estimate is within acceptable range
 */
export const isEstimateReasonable = (estimate: GasEstimate): boolean => {
  // Check if gas limit is not too high (> 1M is suspicious)
  if (estimate.gasLimit > 1_000_000) {
    return false;
  }

  // Check if storage limit is not too high (> 10KB is suspicious for most operations)
  if (estimate.storageLimit > 10_000) {
    return false;
  }

  // Check if fee is not too high (> 1 XTZ is suspicious)
  if (estimate.feeInXTZ > 1) {
    return false;
  }

  return true;
};

/**
 * Compare estimate with quick estimate to detect anomalies
 */
export const compareWithQuickEstimate = (
  operationType: string,
  actualEstimate: GasEstimate
): { isNormal: boolean; difference: number } => {
  const quickEstimate = getQuickEstimate(operationType);
  
  const difference = Math.abs(
    actualEstimate.totalCost - quickEstimate.totalCost
  ) / quickEstimate.totalCost;

  // If difference is more than 50%, it's abnormal
  const isNormal = difference < 0.5;

  return { isNormal, difference };
};

/**
 * Get gas price in XTZ per gas unit (for display)
 */
export const getGasPrice = (estimate: GasEstimate): number => {
  return estimate.fee / estimate.gasLimit;
};

/**
 * Calculate storage cost in XTZ
 */
export const calculateStorageCost = (storageBytes: number): number => {
  return mutezToXTZ(storageBytes * STORAGE_COST_PER_BYTE);
};

/**
 * Estimate cost for multiple operations (sum)
 */
export const estimateMultipleOperations = (
  operationTypes: string[]
): GasEstimate => {
  const estimates = operationTypes.map(type => getQuickEstimate(type));

  const totalGasLimit = estimates.reduce((sum, est) => sum + est.gasLimit, 0);
  const totalStorageLimit = estimates.reduce((sum, est) => sum + est.storageLimit, 0);
  const totalFee = estimates.reduce((sum, est) => sum + est.fee, 0);
  const totalCost = estimates.reduce((sum, est) => sum + est.totalCost, 0);

  return {
    gasLimit: totalGasLimit,
    storageLimit: totalStorageLimit,
    fee: totalFee,
    totalCost,
    feeInXTZ: mutezToXTZ(totalFee),
    totalCostInXTZ: mutezToXTZ(totalCost),
  };
};
