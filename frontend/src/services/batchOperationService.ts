/**
 * Batch Operation Service
 * 
 * This service handles batching multiple Tezos operations into a single transaction.
 * Batching reduces gas costs and ensures atomicity (all operations succeed or all fail).
 */

import { WalletOperationBatch } from '@taquito/taquito';
import { getTezos } from './tezosWalletService';
import { submitAndConfirm } from './transactionService';
import { GasEstimate, estimateBatchGas } from './gasEstimationService';

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

export interface BatchOperation {
  contractAddress: string;
  methodName: string;
  args: any[];
  description?: string;
}

export interface BatchResult {
  success: boolean;
  hash?: string;
  error?: string;
  explorerUrl?: string;
  operationCount: number;
}

// ==============================================================================
// BATCH BUILDING
// ==============================================================================

/**
 * Create a batch of operations
 */
export const createBatch = async (
  operations: BatchOperation[]
): Promise<WalletOperationBatch> => {
  const tezos = getTezos();
  if (!tezos) {
    throw new Error('Tezos instance not initialized. Please connect wallet first.');
  }

  const batch = tezos.wallet.batch();

  for (const op of operations) {
    const contract = await tezos.wallet.at(op.contractAddress);
    const method = contract.methods[op.methodName];

    if (!method) {
      throw new Error(`Method ${op.methodName} not found on contract ${op.contractAddress}`);
    }

    batch.withContractCall(method(...op.args));
  }

  return batch;
};

/**
 * Execute a batch of operations
 */
export const executeBatch = async (
  operations: BatchOperation[],
  confirmations: number = 1
): Promise<BatchResult> => {
  try {
    if (operations.length === 0) {
      return {
        success: false,
        error: 'No operations to batch',
        operationCount: 0,
      };
    }

    const batch = await createBatch(operations);
    const result = await submitAndConfirm(batch.send(), confirmations);

    return {
      success: result.success,
      hash: result.hash,
      error: result.error,
      explorerUrl: result.explorerUrl,
      operationCount: operations.length,
    };
  } catch (error: any) {
    console.error('Batch execution failed:', error);
    return {
      success: false,
      error: error.message || 'Batch execution failed',
      operationCount: operations.length,
    };
  }
};

/**
 * Estimate gas for a batch of operations
 */
export const estimateBatch = async (
  operations: BatchOperation[]
): Promise<GasEstimate | { error: string }> => {
  return await estimateBatchGas(operations);
};

// ==============================================================================
// COMMON BATCH OPERATIONS
// ==============================================================================

/**
 * Batch whitelist multiple users for multiple asset types
 * This is the most common batch operation in the protocol
 */
export const batchWhitelistUsers = async (
  rwaHubAddress: string,
  users: string[],
  assetTypes: number[]
): Promise<BatchResult> => {
  const operations: BatchOperation[] = [
    {
      contractAddress: rwaHubAddress,
      methodName: 'batch_whitelist',
      args: [users, assetTypes],
      description: `Whitelist ${users.length} users for ${assetTypes.length} asset types`,
    },
  ];

  return await executeBatch(operations);
};

/**
 * Batch register multiple identities
 */
export const batchRegisterIdentities = async (
  complianceGuardAddress: string,
  identities: Array<{
    user: string;
    jurisdiction: string;
    verificationLevel: number;
    expiryTime: Date;
  }>
): Promise<BatchResult> => {
  const operations: BatchOperation[] = identities.map(identity => ({
    contractAddress: complianceGuardAddress,
    methodName: 'register_identity',
    args: [
      identity.user,
      identity.jurisdiction,
      identity.verificationLevel,
      Math.floor(identity.expiryTime.getTime() / 1000),
    ],
    description: `Register identity for ${identity.user}`,
  }));

  return await executeBatch(operations);
};

/**
 * Batch freeze multiple streams
 */
export const batchFreezeStreams = async (
  complianceGuardAddress: string,
  streamIds: number[],
  reason: string
): Promise<BatchResult> => {
  const operations: BatchOperation[] = streamIds.map(streamId => ({
    contractAddress: complianceGuardAddress,
    methodName: 'freeze_stream',
    args: [streamId, reason],
    description: `Freeze stream ${streamId}`,
  }));

  return await executeBatch(operations);
};

/**
 * Batch unfreeze multiple streams
 */
export const batchUnfreezeStreams = async (
  complianceGuardAddress: string,
  streamIds: number[]
): Promise<BatchResult> => {
  const operations: BatchOperation[] = streamIds.map(streamId => ({
    contractAddress: complianceGuardAddress,
    methodName: 'unfreeze_stream',
    args: [streamId],
    description: `Unfreeze stream ${streamId}`,
  }));

  return await executeBatch(operations);
};

/**
 * Batch claim yield from multiple assets
 */
export const batchClaimYield = async (
  rwaHubAddress: string,
  tokenAddresses: string[]
): Promise<BatchResult> => {
  const operations: BatchOperation[] = tokenAddresses.map(tokenAddress => ({
    contractAddress: rwaHubAddress,
    methodName: 'compliant_claim_yield',
    args: [tokenAddress],
    description: `Claim yield for asset ${tokenAddress}`,
  }));

  return await executeBatch(operations);
};

/**
 * Batch withdraw from multiple streams
 */
export const batchWithdraw = async (
  streamingProtocolAddress: string,
  streamIds: number[]
): Promise<BatchResult> => {
  const operations: BatchOperation[] = streamIds.map(streamId => ({
    contractAddress: streamingProtocolAddress,
    methodName: 'withdraw',
    args: [streamId],
    description: `Withdraw from stream ${streamId}`,
  }));

  return await executeBatch(operations);
};

/**
 * Batch cancel multiple streams
 */
export const batchCancelStreams = async (
  streamingProtocolAddress: string,
  streamIds: number[]
): Promise<BatchResult> => {
  const operations: BatchOperation[] = streamIds.map(streamId => ({
    contractAddress: streamingProtocolAddress,
    methodName: 'cancel_stream',
    args: [streamId],
    description: `Cancel stream ${streamId}`,
  }));

  return await executeBatch(operations);
};

/**
 * Batch transfer multiple tokens
 */
export const batchTransferTokens = async (
  fa2TokenAddress: string,
  transfers: Array<{
    from: string;
    to: string;
    tokenId: number;
    amount: number;
  }>
): Promise<BatchResult> => {
  // FA2 transfer expects a specific format
  const transferParams = transfers.map(t => ({
    from_: t.from,
    txs: [
      {
        to_: t.to,
        token_id: t.tokenId,
        amount: t.amount,
      },
    ],
  }));

  const operations: BatchOperation[] = [
    {
      contractAddress: fa2TokenAddress,
      methodName: 'transfer',
      args: [transferParams],
      description: `Transfer ${transfers.length} tokens`,
    },
  ];

  return await executeBatch(operations);
};

// ==============================================================================
// BATCH VALIDATION
// ==============================================================================

/**
 * Validate batch operations before execution
 */
export const validateBatch = (operations: BatchOperation[]): { valid: boolean; error?: string } => {
  if (operations.length === 0) {
    return { valid: false, error: 'No operations provided' };
  }

  if (operations.length > 100) {
    return { valid: false, error: 'Too many operations (max 100)' };
  }

  // Check that all operations have required fields
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    
    if (!op.contractAddress) {
      return { valid: false, error: `Operation ${i}: Missing contract address` };
    }

    if (!op.methodName) {
      return { valid: false, error: `Operation ${i}: Missing method name` };
    }

    if (!Array.isArray(op.args)) {
      return { valid: false, error: `Operation ${i}: Args must be an array` };
    }
  }

  return { valid: true };
};

/**
 * Check if operations should be batched
 * Returns true if batching would save gas
 */
export const shouldBatch = (operationCount: number): boolean => {
  // Batching is beneficial for 2+ operations
  // Single operations don't benefit from batching
  return operationCount >= 2;
};

/**
 * Calculate estimated gas savings from batching
 */
export const estimateGasSavings = (operationCount: number): number => {
  if (operationCount <= 1) {
    return 0;
  }

  // Each operation in a batch saves approximately 1000 gas units
  // compared to individual transactions
  const savingsPerOperation = 1000;
  return (operationCount - 1) * savingsPerOperation;
};

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Split large batch into smaller chunks
 * Useful when batch size exceeds gas limits
 */
export const splitBatch = (
  operations: BatchOperation[],
  chunkSize: number = 20
): BatchOperation[][] => {
  const chunks: BatchOperation[][] = [];
  
  for (let i = 0; i < operations.length; i += chunkSize) {
    chunks.push(operations.slice(i, i + chunkSize));
  }
  
  return chunks;
};

/**
 * Execute large batch in chunks
 */
export const executeLargeBatch = async (
  operations: BatchOperation[],
  chunkSize: number = 20
): Promise<BatchResult[]> => {
  const chunks = splitBatch(operations, chunkSize);
  const results: BatchResult[] = [];

  for (const chunk of chunks) {
    const result = await executeBatch(chunk);
    results.push(result);

    // If any chunk fails, stop execution
    if (!result.success) {
      break;
    }

    // Wait a bit between chunks to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
};

/**
 * Format batch result for display
 */
export const formatBatchResult = (result: BatchResult): string => {
  if (result.success) {
    return `Successfully executed ${result.operationCount} operations`;
  } else {
    return `Failed to execute batch: ${result.error}`;
  }
};

/**
 * Get batch operation summary
 */
export const getBatchSummary = (operations: BatchOperation[]): string => {
  const methodCounts: Record<string, number> = {};

  for (const op of operations) {
    methodCounts[op.methodName] = (methodCounts[op.methodName] || 0) + 1;
  }

  const summary = Object.entries(methodCounts)
    .map(([method, count]) => `${count}x ${method}`)
    .join(', ');

  return `Batch: ${summary}`;
};

/**
 * Check if batch is atomic (all succeed or all fail)
 */
export const isBatchAtomic = (): boolean => {
  // Tezos batches are always atomic
  return true;
};

/**
 * Estimate time to execute batch
 */
export const estimateBatchTime = (): string => {
  // Tezos block time is ~30 seconds
  // Batch is included in a single block
  return '~30-60 seconds';
};
