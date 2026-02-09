# Tezos Services Documentation

This directory contains all services for interacting with the Continuum Protocol on Tezos blockchain.

## Services Overview

### 1. Wallet Service (`tezosWalletService.ts`)
Handles wallet connection, disconnection, and state management using Beacon SDK.

**Key Functions:**
- `connectWallet()` - Connect to Tezos wallet (Temple, Kukai, Umami)
- `disconnectWallet()` - Disconnect wallet
- `getWalletState()` - Get current wallet state
- `getBalance()` - Get XTZ balance
- `switchNetwork()` - Switch between Ghostnet and Mainnet

**Example:**
```typescript
import { connectWallet, getWalletState } from './services';

// Connect wallet
const walletState = await connectWallet('ghostnet');
console.log('Connected:', walletState.address);

// Get current state
const state = await getWalletState();
console.log('Balance:', state?.balance, 'XTZ');
```

### 2. Contract Service (`tezosContractService.ts`)
Provides functions to interact with all Continuum Protocol smart contracts.

**Key Functions:**

#### Streaming Protocol
- `createStream(params)` - Create a new stream
- `withdrawFromStream(streamId)` - Withdraw from stream
- `flashAdvanceStream(streamId, amount)` - Flash advance
- `cancelStream(streamId)` - Cancel stream
- `getClaimableBalance(streamId)` - Get claimable balance
- `getStreamInfo(streamId)` - Get stream details

#### Asset Yield Protocol
- `createAssetYieldStream(params)` - Create asset yield stream
- `claimYieldForAsset(tokenAddress)` - Claim yield for NFT
- `flashAdvanceRWAYield(tokenAddress, amount)` - Flash advance for NFT
- `getStreamForAsset(tokenAddress)` - Get stream ID for NFT
- `getClaimableYield(tokenAddress)` - Get claimable yield for NFT

#### Compliance Guard
- `registerIdentity(params)` - Register KYC identity (admin)
- `whitelistAddress(user, assetTypes)` - Whitelist user (admin)
- `freezeStream(streamId, reason)` - Freeze stream (admin)
- `unfreezeStream(streamId)` - Unfreeze stream (admin)
- `isAuthorizedRecipient(user, assetType)` - Check authorization
- `isStreamFrozen(streamId)` - Check if stream is frozen

#### Token Registry
- `registerToken(params)` - Register token
- `getToken(tokenAddress)` - Get token info
- `getTokensByType(assetType)` - Get tokens by type
- `getTokenCount()` - Get total token count

#### RWA Hub
- `createCompliantRWAStream(params)` - Create compliant RWA stream
- `compliantClaimYield(tokenAddress)` - Claim yield with compliance check
- `compliantFlashAdvance(tokenAddress, amount)` - Flash advance with compliance
- `streamRentToAsset(params)` - Create rental stream
- `emergencyFreeze(streamId, reason)` - Emergency freeze (admin)
- `batchWhitelist(users, assetTypes)` - Batch whitelist (admin)
- `checkAccessStatus(streamId, tokenAddress)` - Check rental access

**Example:**
```typescript
import { createStream, withdrawFromStream, getClaimableBalance } from './services';

// Create a stream
const params = {
  recipient: 'tz1...',
  tokenAddress: 'KT1...',
  tokenId: 0,
  flowRate: 100, // tokens per second
  duration: 2592000, // 30 days in seconds
  totalAmount: 259200000, // total tokens
};

const txHash = await createStream(params);
console.log('Stream created:', txHash);

// Check claimable balance
const claimable = await getClaimableBalance(1);
console.log('Claimable:', claimable);

// Withdraw
const withdrawHash = await withdrawFromStream(1);
console.log('Withdrawn:', withdrawHash);
```

### 3. Transaction Service (`transactionService.ts`)
Handles transaction submission, confirmation polling, and status tracking.

**Key Functions:**
- `submitTransaction(operationPromise)` - Submit transaction
- `submitAndConfirm(operationPromise, confirmations)` - Submit and wait for confirmation
- `pollForConfirmation(hash, confirmations)` - Poll for confirmation
- `getTransactionStatus(hash)` - Get transaction status
- `watchTransaction(hash, callback)` - Watch transaction with callback
- `parseTransactionError(error)` - Parse error into user-friendly message

**Example:**
```typescript
import { 
  submitAndConfirm, 
  watchTransaction, 
  TransactionStatus 
} from './services';

// Submit and wait for confirmation
const result = await submitAndConfirm(
  createStream(params),
  2 // wait for 2 confirmations
);

if (result.success) {
  console.log('Transaction confirmed:', result.hash);
  console.log('View on explorer:', result.explorerUrl);
} else {
  console.error('Transaction failed:', result.error);
}

// Watch transaction with callback
await watchTransaction(
  txHash,
  (state) => {
    console.log('Status:', state.status);
    console.log('Confirmations:', state.confirmations);
    
    if (state.status === TransactionStatus.CONFIRMED) {
      console.log('Transaction confirmed!');
    }
  }
);
```

### 4. Gas Estimation Service (`gasEstimationService.ts`)
Provides gas and fee estimation for transactions.

**Key Functions:**
- `estimateGas(contractAddress, methodName, ...args)` - Estimate gas for operation
- `estimateBatchGas(operations)` - Estimate gas for batch
- `getQuickEstimate(operationType)` - Get cached estimate
- `hasSufficientBalance(userAddress, estimatedCost)` - Check balance
- `formatGasEstimate(estimate)` - Format estimate for display

**Example:**
```typescript
import { estimateGas, getQuickEstimate, formatGasEstimate } from './services';

// Estimate gas for specific operation
const estimate = await estimateGas(
  'KT1...', // contract address
  'create_stream',
  recipient,
  tokenAddress,
  tokenId,
  flowRate,
  duration,
  totalAmount
);

if ('error' in estimate) {
  console.error('Estimation failed:', estimate.error);
} else {
  console.log('Gas limit:', estimate.gasLimit);
  console.log('Storage limit:', estimate.storageLimit);
  console.log('Fee:', estimate.feeInXTZ, 'XTZ');
  console.log('Total cost:', estimate.totalCostInXTZ, 'XTZ');
  console.log(formatGasEstimate(estimate));
}

// Quick estimate (cached)
const quickEstimate = getQuickEstimate('create_stream');
console.log('Estimated cost:', quickEstimate.totalCostInXTZ, 'XTZ');
```

### 5. Batch Operation Service (`batchOperationService.ts`)
Handles batching multiple operations into a single transaction.

**Key Functions:**
- `executeBatch(operations)` - Execute batch of operations
- `batchWhitelistUsers(rwaHubAddress, users, assetTypes)` - Batch whitelist
- `batchRegisterIdentities(complianceGuardAddress, identities)` - Batch register
- `batchClaimYield(rwaHubAddress, tokenAddresses)` - Batch claim yield
- `batchWithdraw(streamingProtocolAddress, streamIds)` - Batch withdraw
- `validateBatch(operations)` - Validate batch before execution
- `estimateBatch(operations)` - Estimate gas for batch

**Example:**
```typescript
import { 
  batchWhitelistUsers, 
  batchClaimYield,
  executeBatch 
} from './services';

// Batch whitelist users
const result = await batchWhitelistUsers(
  'KT1...', // RWA Hub address
  ['tz1...', 'tz2...', 'tz3...'], // users
  [0, 1, 2] // asset types (real estate, vehicles, commodities)
);

console.log('Batch result:', result.success);
console.log('Operations executed:', result.operationCount);

// Batch claim yield from multiple assets
const claimResult = await batchClaimYield(
  'KT1...', // RWA Hub address
  ['KT1...', 'KT2...', 'KT3...'] // token addresses
);

// Custom batch
const operations = [
  {
    contractAddress: 'KT1...',
    methodName: 'withdraw',
    args: [1],
    description: 'Withdraw from stream 1',
  },
  {
    contractAddress: 'KT1...',
    methodName: 'withdraw',
    args: [2],
    description: 'Withdraw from stream 2',
  },
];

const customResult = await executeBatch(operations);
```

## Common Workflows

### Workflow 1: Create and Manage Stream

```typescript
import {
  connectWallet,
  createStream,
  getClaimableBalance,
  withdrawFromStream,
  estimateGas,
  watchTransaction,
} from './services';

// 1. Connect wallet
const wallet = await connectWallet('ghostnet');

// 2. Estimate gas
const estimate = await estimateGas(
  streamingProtocolAddress,
  'create_stream',
  recipient,
  tokenAddress,
  tokenId,
  flowRate,
  duration,
  totalAmount
);

console.log('Estimated cost:', estimate.totalCostInXTZ, 'XTZ');

// 3. Create stream
const txHash = await createStream({
  recipient,
  tokenAddress,
  tokenId,
  flowRate,
  duration,
  totalAmount,
});

// 4. Watch transaction
await watchTransaction(txHash, (state) => {
  console.log('Status:', state.status);
});

// 5. Check claimable balance (after some time)
const claimable = await getClaimableBalance(streamId);
console.log('Claimable:', claimable);

// 6. Withdraw
const withdrawHash = await withdrawFromStream(streamId);
console.log('Withdrawn:', withdrawHash);
```

### Workflow 2: Create Compliant RWA Stream

```typescript
import {
  connectWallet,
  createCompliantRWAStream,
  getToken,
  compliantClaimYield,
} from './services';

// 1. Connect wallet
await connectWallet('ghostnet');

// 2. Create compliant RWA stream
const params = {
  tokenAddress: 'KT1...', // NFT address
  totalYield: 1000000, // total yield tokens
  duration: 2592000, // 30 days
  assetType: 0, // real estate
  metadataUri: 'ipfs://...',
};

const txHash = await createCompliantRWAStream(params);
console.log('RWA stream created:', txHash);

// 3. Get token info
const tokenInfo = await getToken(params.tokenAddress);
console.log('Stream ID:', tokenInfo?.streamId);

// 4. Claim yield (after some time)
const claimHash = await compliantClaimYield(params.tokenAddress);
console.log('Yield claimed:', claimHash);
```

### Workflow 3: Admin Operations

```typescript
import {
  connectWallet,
  registerIdentity,
  batchWhitelistUsers,
  freezeStream,
  emergencyFreeze,
} from './services';

// 1. Connect admin wallet
await connectWallet('ghostnet');

// 2. Register identity
await registerIdentity({
  user: 'tz1...',
  jurisdiction: 'US',
  verificationLevel: 1,
  expiryTime: new Date('2027-01-01'),
});

// 3. Batch whitelist users
await batchWhitelistUsers(
  rwaHubAddress,
  ['tz1...', 'tz2...'],
  [0, 1, 2] // all asset types
);

// 4. Emergency freeze if needed
await emergencyFreeze(streamId, 'Suspicious activity detected');
```

## Error Handling

All service functions can throw errors. Always wrap calls in try-catch:

```typescript
try {
  const result = await createStream(params);
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
  // Handle error appropriately
}
```

Use the transaction service for better error handling:

```typescript
import { submitAndConfirm, parseTransactionError } from './services';

const result = await submitAndConfirm(createStream(params));

if (result.success) {
  console.log('Success:', result.hash);
} else {
  const friendlyError = parseTransactionError(result.error);
  console.error('Error:', friendlyError);
}
```

## Type Safety

All services are fully typed with TypeScript. Import types as needed:

```typescript
import {
  StreamParams,
  StreamInfo,
  TransactionStatus,
  GasEstimate,
  BatchOperation,
  WalletState,
} from './services';
```

## Configuration

Services automatically use the configuration from `config/tezos.ts`:
- Contract addresses from environment variables
- Network selection (Ghostnet/Mainnet)
- RPC endpoints

Make sure to set up your `.env` file with contract addresses:

```env
VITE_TEZOS_NETWORK=ghostnet
VITE_GHOSTNET_STREAMING_PROTOCOL=KT1...
VITE_GHOSTNET_ASSET_YIELD_PROTOCOL=KT1...
VITE_GHOSTNET_COMPLIANCE_GUARD=KT1...
VITE_GHOSTNET_TOKEN_REGISTRY=KT1...
VITE_GHOSTNET_RWA_HUB=KT1...
VITE_GHOSTNET_FA2_TOKEN=KT1...
```

## Testing

For testing, you can use mock implementations or connect to Ghostnet:

```typescript
// Use Ghostnet for testing
await connectWallet('ghostnet');

// Get test XTZ from faucet
// https://faucet.ghostnet.teztnets.xyz
```

## Performance Tips

1. **Use Quick Estimates**: For displaying estimates before user action, use `getQuickEstimate()` instead of `estimateGas()` to avoid RPC calls.

2. **Batch Operations**: When performing multiple operations, use batch functions to save gas and ensure atomicity.

3. **Cache Contract Instances**: Contract instances are automatically cached. Avoid clearing the cache unless switching networks.

4. **Poll Wisely**: Use appropriate polling intervals (5 seconds is recommended) to avoid rate limiting.

## Support

For issues or questions:
1. Check the Tezos documentation: https://tezos.gitlab.io
2. Check the Taquito documentation: https://tezostaquito.io
3. Review the contract source code in `tezos/contracts/`
4. Check the [Deployment Guide](../../../docs/deployment/how-to-deploy-step-by-step.md)
5. See the [API Reference](../../../docs/api-reference.md)
6. Review the [Troubleshooting Guide](../../../docs/troubleshooting-common-issues.md)
