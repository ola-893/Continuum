/**
 * Analytics Tracking Service
 * 
 * Tracks and logs analytics data including gas costs, transaction metrics,
 * and user interactions for monitoring and analysis.
 */

import { GasEstimate } from './gasEstimationService';

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

export interface GasCostRecord {
  timestamp: number;
  operationType: string;
  gasLimit: number;
  storageLimit: number;
  fee: number; // in mutez
  totalCost: number; // in mutez
  feeInXTZ: number;
  totalCostInXTZ: number;
  transactionHash?: string;
  userAddress?: string;
  success: boolean;
  errorMessage?: string;
}

export interface TransactionMetrics {
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  totalGasUsed: number;
  totalFeesSpent: number; // in mutez
  averageGasPerTransaction: number;
  averageFeePerTransaction: number; // in mutez
}

export interface OperationMetrics {
  operationType: string;
  count: number;
  totalGas: number;
  totalFees: number; // in mutez
  averageGas: number;
  averageFee: number; // in mutez
  successRate: number; // percentage
}

// ==============================================================================
// LOCAL STORAGE KEYS
// ==============================================================================

const GAS_COST_RECORDS_KEY = 'continuum_gas_cost_records';
const MAX_RECORDS = 1000; // Keep last 1000 records

// ==============================================================================
// GAS COST TRACKING
// ==============================================================================

/**
 * Log a gas cost record
 */
export const logGasCost = (
  operationType: string,
  estimate: GasEstimate,
  transactionHash?: string,
  userAddress?: string,
  success: boolean = true,
  errorMessage?: string
): void => {
  try {
    const record: GasCostRecord = {
      timestamp: Date.now(),
      operationType,
      gasLimit: estimate.gasLimit,
      storageLimit: estimate.storageLimit,
      fee: estimate.fee,
      totalCost: estimate.totalCost,
      feeInXTZ: estimate.feeInXTZ,
      totalCostInXTZ: estimate.totalCostInXTZ,
      transactionHash,
      userAddress,
      success,
      errorMessage,
    };

    const records = getGasCostRecords();
    records.push(record);

    // Keep only the last MAX_RECORDS
    if (records.length > MAX_RECORDS) {
      records.splice(0, records.length - MAX_RECORDS);
    }

    localStorage.setItem(GAS_COST_RECORDS_KEY, JSON.stringify(records));

    // Also log to console for debugging
    console.log('[Analytics] Gas cost logged:', record);
  } catch (error) {
    console.error('Failed to log gas cost:', error);
  }
};

/**
 * Get all gas cost records
 */
export const getGasCostRecords = (): GasCostRecord[] => {
  try {
    const stored = localStorage.getItem(GAS_COST_RECORDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to retrieve gas cost records:', error);
    return [];
  }
};

/**
 * Get gas cost records for a specific operation type
 */
export const getGasCostRecordsByOperation = (
  operationType: string
): GasCostRecord[] => {
  const records = getGasCostRecords();
  return records.filter(record => record.operationType === operationType);
};

/**
 * Get gas cost records within a time range
 */
export const getGasCostRecordsByTimeRange = (
  startTime: number,
  endTime: number
): GasCostRecord[] => {
  const records = getGasCostRecords();
  return records.filter(
    record => record.timestamp >= startTime && record.timestamp <= endTime
  );
};

/**
 * Clear all gas cost records
 */
export const clearGasCostRecords = (): void => {
  try {
    localStorage.removeItem(GAS_COST_RECORDS_KEY);
    console.log('[Analytics] Gas cost records cleared');
  } catch (error) {
    console.error('Failed to clear gas cost records:', error);
  }
};

// ==============================================================================
// METRICS CALCULATION
// ==============================================================================

/**
 * Calculate transaction metrics from gas cost records
 */
export const calculateTransactionMetrics = (
  records?: GasCostRecord[]
): TransactionMetrics => {
  const allRecords = records || getGasCostRecords();

  if (allRecords.length === 0) {
    return {
      totalTransactions: 0,
      successfulTransactions: 0,
      failedTransactions: 0,
      totalGasUsed: 0,
      totalFeesSpent: 0,
      averageGasPerTransaction: 0,
      averageFeePerTransaction: 0,
    };
  }

  const successfulTransactions = allRecords.filter(r => r.success).length;
  const failedTransactions = allRecords.length - successfulTransactions;
  const totalGasUsed = allRecords.reduce((sum, r) => sum + r.gasLimit, 0);
  const totalFeesSpent = allRecords.reduce((sum, r) => sum + r.fee, 0);

  return {
    totalTransactions: allRecords.length,
    successfulTransactions,
    failedTransactions,
    totalGasUsed,
    totalFeesSpent,
    averageGasPerTransaction: totalGasUsed / allRecords.length,
    averageFeePerTransaction: totalFeesSpent / allRecords.length,
  };
};

/**
 * Calculate metrics for each operation type
 */
export const calculateOperationMetrics = (
  records?: GasCostRecord[]
): OperationMetrics[] => {
  const allRecords = records || getGasCostRecords();

  // Group records by operation type
  const operationGroups = allRecords.reduce((groups, record) => {
    const type = record.operationType;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(record);
    return groups;
  }, {} as Record<string, GasCostRecord[]>);

  // Calculate metrics for each operation type
  return Object.entries(operationGroups).map(([operationType, records]) => {
    const successfulRecords = records.filter(r => r.success);
    const totalGas = records.reduce((sum, r) => sum + r.gasLimit, 0);
    const totalFees = records.reduce((sum, r) => sum + r.fee, 0);

    return {
      operationType,
      count: records.length,
      totalGas,
      totalFees,
      averageGas: totalGas / records.length,
      averageFee: totalFees / records.length,
      successRate: (successfulRecords.length / records.length) * 100,
    };
  });
};

/**
 * Get metrics for a specific time period
 */
export const getMetricsForPeriod = (
  periodInMs: number
): {
  transactionMetrics: TransactionMetrics;
  operationMetrics: OperationMetrics[];
} => {
  const now = Date.now();
  const startTime = now - periodInMs;
  const records = getGasCostRecordsByTimeRange(startTime, now);

  return {
    transactionMetrics: calculateTransactionMetrics(records),
    operationMetrics: calculateOperationMetrics(records),
  };
};

/**
 * Get metrics for the last 24 hours
 */
export const getLast24HoursMetrics = () => {
  return getMetricsForPeriod(24 * 60 * 60 * 1000);
};

/**
 * Get metrics for the last 7 days
 */
export const getLast7DaysMetrics = () => {
  return getMetricsForPeriod(7 * 24 * 60 * 60 * 1000);
};

/**
 * Get metrics for the last 30 days
 */
export const getLast30DaysMetrics = () => {
  return getMetricsForPeriod(30 * 24 * 60 * 60 * 1000);
};

// ==============================================================================
// EXPORT FUNCTIONALITY
// ==============================================================================

/**
 * Export gas cost records to CSV format
 */
export const exportGasCostRecordsToCSV = (records?: GasCostRecord[]): string => {
  const allRecords = records || getGasCostRecords();

  if (allRecords.length === 0) {
    return 'No records to export';
  }

  // CSV header
  const header = [
    'Timestamp',
    'Date',
    'Operation Type',
    'Gas Limit',
    'Storage Limit',
    'Fee (mutez)',
    'Total Cost (mutez)',
    'Fee (XTZ)',
    'Total Cost (XTZ)',
    'Transaction Hash',
    'User Address',
    'Success',
    'Error Message',
  ].join(',');

  // CSV rows
  const rows = allRecords.map(record => {
    const date = new Date(record.timestamp).toISOString();
    return [
      record.timestamp,
      date,
      record.operationType,
      record.gasLimit,
      record.storageLimit,
      record.fee,
      record.totalCost,
      record.feeInXTZ.toFixed(6),
      record.totalCostInXTZ.toFixed(6),
      record.transactionHash || '',
      record.userAddress || '',
      record.success,
      record.errorMessage || '',
    ].join(',');
  });

  return [header, ...rows].join('\n');
};

/**
 * Download gas cost records as CSV file
 */
export const downloadGasCostRecordsCSV = (records?: GasCostRecord[]): void => {
  try {
    const csv = exportGasCostRecordsToCSV(records);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `continuum_gas_costs_${Date.now()}.csv`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('[Analytics] Gas cost records exported to CSV');
  } catch (error) {
    console.error('Failed to download gas cost records:', error);
  }
};

/**
 * Export transaction metrics to JSON
 */
export const exportMetricsToJSON = (): string => {
  const transactionMetrics = calculateTransactionMetrics();
  const operationMetrics = calculateOperationMetrics();

  const data = {
    exportDate: new Date().toISOString(),
    transactionMetrics,
    operationMetrics,
    records: getGasCostRecords(),
  };

  return JSON.stringify(data, null, 2);
};

/**
 * Download metrics as JSON file
 */
export const downloadMetricsJSON = (): void => {
  try {
    const json = exportMetricsToJSON();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `continuum_metrics_${Date.now()}.json`
    );
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    console.log('[Analytics] Metrics exported to JSON');
  } catch (error) {
    console.error('Failed to download metrics:', error);
  }
};

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Get the most expensive operation type
 */
export const getMostExpensiveOperation = (): OperationMetrics | null => {
  const metrics = calculateOperationMetrics();
  if (metrics.length === 0) return null;

  return metrics.reduce((max, current) =>
    current.averageFee > max.averageFee ? current : max
  );
};

/**
 * Get the most frequently used operation type
 */
export const getMostFrequentOperation = (): OperationMetrics | null => {
  const metrics = calculateOperationMetrics();
  if (metrics.length === 0) return null;

  return metrics.reduce((max, current) =>
    current.count > max.count ? current : max
  );
};

/**
 * Get operation with lowest success rate
 */
export const getLowestSuccessRateOperation = (): OperationMetrics | null => {
  const metrics = calculateOperationMetrics();
  if (metrics.length === 0) return null;

  return metrics.reduce((min, current) =>
    current.successRate < min.successRate ? current : min
  );
};

/**
 * Format mutez to XTZ for display
 */
export const formatMutezToXTZ = (mutez: number): string => {
  return (mutez / 1_000_000).toFixed(6);
};

/**
 * Get summary statistics
 */
export const getSummaryStatistics = () => {
  const transactionMetrics = calculateTransactionMetrics();
  const operationMetrics = calculateOperationMetrics();
  const mostExpensive = getMostExpensiveOperation();
  const mostFrequent = getMostFrequentOperation();
  const lowestSuccess = getLowestSuccessRateOperation();

  return {
    transactionMetrics,
    operationMetrics,
    insights: {
      mostExpensiveOperation: mostExpensive,
      mostFrequentOperation: mostFrequent,
      lowestSuccessRateOperation: lowestSuccess,
    },
  };
};
