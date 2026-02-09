/**
 * Tezos Contract Interaction Service
 * 
 * This service handles all interactions with Continuum Protocol smart contracts
 * on Tezos blockchain using Taquito library.
 */

import { TezosToolkit, ContractAbstraction, ContractProvider, Wallet } from '@taquito/taquito';
import { getTezos, getWallet } from './tezosWalletService';
import { getConfig, type TezosNetwork } from '../config/tezos';

// ==============================================================================
// TYPE DEFINITIONS
// ==============================================================================

export interface StreamParams {
  recipient: string;
  tokenAddress: string;
  tokenId: number;
  flowRate: number;
  duration: number;
  totalAmount: number;
}

export interface StreamInfo {
  sender: string;
  recipient: string;
  tokenAddress: string;
  tokenId: number;
  totalAmount: number;
  flowRate: number;
  startTime: Date;
  stopTime: Date;
  amountWithdrawn: number;
  status: number; // 0=active, 1=paused, 2=cancelled, 3=depleted
}

export interface AssetYieldStreamParams {
  tokenAddress: string;
  totalYield: number;
  duration: number;
}

export interface IdentityParams {
  user: string;
  jurisdiction: string;
  verificationLevel: number;
  expiryTime: Date;
}

export interface TokenRegistryEntry {
  assetType: number;
  streamId: number;
  metadataUri: string;
  registrationTime: Date;
}

export interface RWAStreamParams {
  tokenAddress: string;
  totalYield: number;
  duration: number;
  assetType: number;
  metadataUri: string;
}

export interface RentalStreamParams {
  tokenAddress: string;
  paymentAmount: number;
  duration: number;
}

// Asset types enum
export enum AssetType {
  REAL_ESTATE = 0,
  VEHICLES = 1,
  COMMODITIES = 2,
}

// Stream status enum
export enum StreamStatus {
  ACTIVE = 0,
  PAUSED = 1,
  CANCELLED = 2,
  DEPLETED = 3,
}

// ==============================================================================
// CONTRACT INSTANCES CACHE
// ==============================================================================

interface ContractCache {
  streamingProtocol?: ContractAbstraction<Wallet>;
  assetYieldProtocol?: ContractAbstraction<Wallet>;
  complianceGuard?: ContractAbstraction<Wallet>;
  tokenRegistry?: ContractAbstraction<Wallet>;
  rwaHub?: ContractAbstraction<Wallet>;
  fa2Token?: ContractAbstraction<Wallet>;
}

let contractCache: ContractCache = {};
let currentNetwork: TezosNetwork | null = null;

/**
 * Clear contract cache (call when switching networks)
 */
export const clearContractCache = (): void => {
  contractCache = {};
  currentNetwork = null;
};

/**
 * Get contract instance with caching
 */
const getContract = async (
  contractName: keyof ContractCache,
  address: string
): Promise<ContractAbstraction<Wallet>> => {
  const tezos = getTezos();
  if (!tezos) {
    throw new Error('Tezos instance not initialized. Please connect wallet first.');
  }

  // Check if we need to clear cache due to network change
  const config = getConfig();
  if (currentNetwork && currentNetwork !== config.network.name.toLowerCase()) {
    clearContractCache();
  }
  currentNetwork = config.network.name.toLowerCase() as TezosNetwork;

  // Return cached instance if available
  if (contractCache[contractName]) {
    return contractCache[contractName]!;
  }

  // Load contract and cache it
  const contract = await tezos.wallet.at(address);
  contractCache[contractName] = contract;
  return contract;
};

// ==============================================================================
// STREAMING PROTOCOL CONTRACT
// ==============================================================================

/**
 * Create a new stream
 */
export const createStream = async (params: StreamParams): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('streamingProtocol', config.contracts.streamingProtocol);

  const operation = await contract.methods
    .create_stream(
      params.recipient,
      params.tokenAddress,
      params.tokenId,
      params.flowRate,
      params.duration,
      params.totalAmount
    )
    .send();

  return operation.opHash;
};

/**
 * Withdraw from a stream
 */
export const withdrawFromStream = async (streamId: number): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('streamingProtocol', config.contracts.streamingProtocol);

  const operation = await contract.methods.withdraw(streamId).send();
  return operation.opHash;
};

/**
 * Flash advance from a stream
 */
export const flashAdvanceStream = async (
  streamId: number,
  amountRequested: number
): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('streamingProtocol', config.contracts.streamingProtocol);

  const operation = await contract.methods.flash_advance(streamId, amountRequested).send();
  return operation.opHash;
};

/**
 * Cancel a stream
 */
export const cancelStream = async (streamId: number): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('streamingProtocol', config.contracts.streamingProtocol);

  const operation = await contract.methods.cancel_stream(streamId).send();
  return operation.opHash;
};

/**
 * Get claimable balance for a stream (view function)
 */
export const getClaimableBalance = async (streamId: number): Promise<number> => {
  const config = getConfig();
  const contract = await getContract('streamingProtocol', config.contracts.streamingProtocol);

  const storage: any = await contract.storage();
  const stream = await storage.streams.get(streamId);

  if (!stream) {
    return 0;
  }

  // Calculate claimable balance: min((now - start_time) * flow_rate, total_amount) - amount_withdrawn
  const now = Math.floor(Date.now() / 1000);
  const startTime = new Date(stream.start_time).getTime() / 1000;
  const elapsed = Math.max(0, now - startTime);
  const accumulated = elapsed * stream.flow_rate;
  const claimable = Math.min(accumulated, stream.total_amount) - stream.amount_withdrawn;

  return Math.max(0, claimable);
};

/**
 * Get stream information
 */
export const getStreamInfo = async (streamId: number): Promise<StreamInfo | null> => {
  const config = getConfig();
  const contract = await getContract('streamingProtocol', config.contracts.streamingProtocol);

  const storage: any = await contract.storage();
  const stream = await storage.streams.get(streamId);

  if (!stream) {
    return null;
  }

  return {
    sender: stream.sender,
    recipient: stream.recipient,
    tokenAddress: stream.token_address,
    tokenId: stream.token_id.toNumber(),
    totalAmount: stream.total_amount.toNumber(),
    flowRate: stream.flow_rate.toNumber(),
    startTime: new Date(stream.start_time),
    stopTime: new Date(stream.stop_time),
    amountWithdrawn: stream.amount_withdrawn.toNumber(),
    status: stream.status.toNumber(),
  };
};

// ==============================================================================
// ASSET YIELD PROTOCOL CONTRACT
// ==============================================================================

/**
 * Create asset yield stream
 */
export const createAssetYieldStream = async (
  params: AssetYieldStreamParams
): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('assetYieldProtocol', config.contracts.assetYieldProtocol);

  const operation = await contract.methods
    .create_asset_yield_stream(params.tokenAddress, params.totalYield, params.duration)
    .send();

  return operation.opHash;
};

/**
 * Claim yield for an asset
 */
export const claimYieldForAsset = async (tokenAddress: string): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('assetYieldProtocol', config.contracts.assetYieldProtocol);

  const operation = await contract.methods.claim_yield_for_asset(tokenAddress).send();
  return operation.opHash;
};

/**
 * Flash advance RWA yield
 */
export const flashAdvanceRWAYield = async (
  tokenAddress: string,
  amountRequested: number
): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('assetYieldProtocol', config.contracts.assetYieldProtocol);

  const operation = await contract.methods
    .flash_advance_rwa_yield(tokenAddress, amountRequested)
    .send();

  return operation.opHash;
};

/**
 * Get stream ID for an asset
 */
export const getStreamForAsset = async (tokenAddress: string): Promise<number | null> => {
  const config = getConfig();
  const contract = await getContract('assetYieldProtocol', config.contracts.assetYieldProtocol);

  const storage: any = await contract.storage();
  const streamId = await storage.asset_to_stream.get(tokenAddress);

  return streamId ? streamId.toNumber() : null;
};

/**
 * Get claimable yield for an asset
 */
export const getClaimableYield = async (tokenAddress: string): Promise<number> => {
  const streamId = await getStreamForAsset(tokenAddress);
  if (!streamId) {
    return 0;
  }

  return await getClaimableBalance(streamId);
};

// ==============================================================================
// COMPLIANCE GUARD CONTRACT
// ==============================================================================

/**
 * Register identity (admin only)
 */
export const registerIdentity = async (params: IdentityParams): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('complianceGuard', config.contracts.complianceGuard);

  const expiryTimestamp = Math.floor(params.expiryTime.getTime() / 1000);

  const operation = await contract.methods
    .register_identity(
      params.user,
      params.jurisdiction,
      params.verificationLevel,
      expiryTimestamp
    )
    .send();

  return operation.opHash;
};

/**
 * Whitelist address for asset types (admin only)
 */
export const whitelistAddress = async (
  user: string,
  assetTypes: number[]
): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('complianceGuard', config.contracts.complianceGuard);

  const operation = await contract.methods.whitelist_address(user, assetTypes).send();
  return operation.opHash;
};

/**
 * Freeze stream (admin only)
 */
export const freezeStream = async (streamId: number, reason: string): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('complianceGuard', config.contracts.complianceGuard);

  const operation = await contract.methods.freeze_stream(streamId, reason).send();
  return operation.opHash;
};

/**
 * Unfreeze stream (admin only)
 */
export const unfreezeStream = async (streamId: number): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('complianceGuard', config.contracts.complianceGuard);

  const operation = await contract.methods.unfreeze_stream(streamId).send();
  return operation.opHash;
};

/**
 * Check if user is authorized for asset type
 */
export const isAuthorizedRecipient = async (
  user: string,
  assetType: number
): Promise<boolean> => {
  const config = getConfig();
  const contract = await getContract('complianceGuard', config.contracts.complianceGuard);

  const storage: any = await contract.storage();
  const identity = await storage.identities.get(user);

  if (!identity) {
    return false;
  }

  // Check: is_verified AND not_expired AND whitelisted
  const now = Math.floor(Date.now() / 1000);
  const expiryTime = new Date(identity.expiry_time).getTime() / 1000;
  const isVerified = identity.is_verified;
  const notExpired = now < expiryTime;
  const whitelisted = identity.whitelisted_asset_types.includes(assetType);

  return isVerified && notExpired && whitelisted;
};

/**
 * Check if stream is frozen
 */
export const isStreamFrozen = async (streamId: number): Promise<boolean> => {
  const config = getConfig();
  const contract = await getContract('complianceGuard', config.contracts.complianceGuard);

  const storage: any = await contract.storage();
  const frozen = await storage.frozen_streams.get(streamId);

  return frozen === true;
};

/**
 * Check if user is admin
 */
export const isAdmin = async (user: string): Promise<boolean> => {
  const config = getConfig();
  const contract = await getContract('complianceGuard', config.contracts.complianceGuard);

  const storage: any = await contract.storage();
  const admins = storage.admins;

  // Check if user is in the admins set
  return admins.has(user);
};

// ==============================================================================
// TOKEN REGISTRY CONTRACT
// ==============================================================================

/**
 * Register token (called by RWA Hub)
 */
export const registerToken = async (
  tokenAddress: string,
  assetType: number,
  streamId: number,
  metadataUri: string
): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('tokenRegistry', config.contracts.tokenRegistry);

  const operation = await contract.methods
    .register_token(tokenAddress, assetType, streamId, metadataUri)
    .send();

  return operation.opHash;
};

/**
 * Get token information
 */
export const getToken = async (
  tokenAddress: string
): Promise<TokenRegistryEntry | null> => {
  const config = getConfig();
  const contract = await getContract('tokenRegistry', config.contracts.tokenRegistry);

  const storage: any = await contract.storage();
  const token = await storage.tokens.get(tokenAddress);

  if (!token) {
    return null;
  }

  return {
    assetType: token.asset_type.toNumber(),
    streamId: token.stream_id.toNumber(),
    metadataUri: token.metadata_uri,
    registrationTime: new Date(token.registration_time),
  };
};

/**
 * Get all tokens with pagination
 */
export const getAllTokensPaginated = async (
  offset: number,
  limit: number
): Promise<TokenRegistryEntry[]> => {
  const config = getConfig();
  const contract = await getContract('tokenRegistry', config.contracts.tokenRegistry);

  const storage: any = await contract.storage();
  
  // Note: This is a simplified implementation
  // In production, you'd need to iterate through the big_map
  // or use an indexer service like TzKT API
  const tokens: TokenRegistryEntry[] = [];
  
  // For now, return empty array - this would need indexer integration
  return tokens;
};

/**
 * Get tokens by asset type
 */
export const getTokensByType = async (assetType: number): Promise<string[]> => {
  const config = getConfig();
  const contract = await getContract('tokenRegistry', config.contracts.tokenRegistry);

  const storage: any = await contract.storage();
  const tokenSet = await storage.tokens_by_type.get(assetType);

  return tokenSet ? Array.from(tokenSet) : [];
};

/**
 * Get token count
 */
export const getTokenCount = async (): Promise<number> => {
  const config = getConfig();
  const contract = await getContract('tokenRegistry', config.contracts.tokenRegistry);

  const storage: any = await contract.storage();
  return storage.token_count.toNumber();
};

// ==============================================================================
// RWA HUB CONTRACT
// ==============================================================================

/**
 * Create compliant RWA stream (one-stop creation)
 */
export const createCompliantRWAStream = async (params: RWAStreamParams): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('rwaHub', config.contracts.rwaHub);

  const operation = await contract.methods
    .create_compliant_rwa_stream(
      params.tokenAddress,
      params.totalYield,
      params.duration,
      params.assetType,
      params.metadataUri
    )
    .send();

  return operation.opHash;
};

/**
 * Compliant claim yield (with automatic compliance check)
 */
export const compliantClaimYield = async (tokenAddress: string): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('rwaHub', config.contracts.rwaHub);

  const operation = await contract.methods.compliant_claim_yield(tokenAddress).send();
  return operation.opHash;
};

/**
 * Compliant flash advance (with automatic compliance check)
 */
export const compliantFlashAdvance = async (
  tokenAddress: string,
  amountRequested: number
): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('rwaHub', config.contracts.rwaHub);

  const operation = await contract.methods
    .compliant_flash_advance(tokenAddress, amountRequested)
    .send();

  return operation.opHash;
};

/**
 * Create rental stream
 */
export const streamRentToAsset = async (params: RentalStreamParams): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('rwaHub', config.contracts.rwaHub);

  const operation = await contract.methods
    .stream_rent_to_asset(params.tokenAddress, params.paymentAmount, params.duration)
    .send();

  return operation.opHash;
};

/**
 * Emergency freeze (admin only)
 */
export const emergencyFreeze = async (streamId: number, reason: string): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('rwaHub', config.contracts.rwaHub);

  const operation = await contract.methods.emergency_freeze(streamId, reason).send();
  return operation.opHash;
};

/**
 * Batch whitelist users (admin only)
 */
export const batchWhitelist = async (
  users: string[],
  assetTypes: number[]
): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('rwaHub', config.contracts.rwaHub);

  const operation = await contract.methods.batch_whitelist(users, assetTypes).send();
  return operation.opHash;
};

/**
 * Check if user can participate in RWA ecosystem
 */
export const canParticipate = async (user: string, assetType: number): Promise<boolean> => {
  return await isAuthorizedRecipient(user, assetType);
};

/**
 * Check rental access status
 */
export const checkAccessStatus = async (
  streamId: number,
  tokenAddress: string
): Promise<boolean> => {
  const config = getConfig();
  const contract = await getContract('rwaHub', config.contracts.rwaHub);

  const storage: any = await contract.storage();
  
  // Get active rental for the asset
  const rentalStreamId = await storage.active_rentals.get(tokenAddress);
  
  if (!rentalStreamId || rentalStreamId.toNumber() !== streamId) {
    return false;
  }

  // Check if stream is active
  const streamInfo = await getStreamInfo(streamId);
  if (!streamInfo || streamInfo.status !== StreamStatus.ACTIVE) {
    return false;
  }

  // Check if stream recipient matches current NFT owner
  // This would require querying the FA2 contract for current owner
  // For now, return true if stream exists and is active
  return true;
};

// ==============================================================================
// FA2 TOKEN CONTRACT
// ==============================================================================

/**
 * Get token balance
 */
export const getTokenBalance = async (
  owner: string,
  tokenId: number
): Promise<number> => {
  const config = getConfig();
  const contract = await getContract('fa2Token', config.contracts.fa2Token);

  const storage: any = await contract.storage();
  const balance = await storage.ledger.get({ 0: owner, 1: tokenId });

  return balance ? balance.toNumber() : 0;
};

/**
 * Transfer token
 */
export const transferToken = async (
  from: string,
  to: string,
  tokenId: number,
  amount: number
): Promise<string> => {
  const config = getConfig();
  const contract = await getContract('fa2Token', config.contracts.fa2Token);

  const operation = await contract.methods
    .transfer([
      {
        from_: from,
        txs: [
          {
            to_: to,
            token_id: tokenId,
            amount: amount,
          },
        ],
      },
    ])
    .send();

  return operation.opHash;
};

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

/**
 * Convert seconds to human-readable duration
 */
export const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Convert flow rate to human-readable format (per day/month)
 */
export const formatFlowRate = (flowRatePerSecond: number, period: 'day' | 'month'): string => {
  const multiplier = period === 'day' ? 86400 : 2592000; // seconds in day/month
  const amount = flowRatePerSecond * multiplier;
  return amount.toFixed(2);
};

/**
 * Calculate time remaining in a stream
 */
export const calculateTimeRemaining = (stopTime: Date): number => {
  const now = Date.now();
  const stop = stopTime.getTime();
  return Math.max(0, Math.floor((stop - now) / 1000));
};

/**
 * Format Tezos address for display (truncate middle)
 */
export const formatAddress = (address: string, chars: number = 6): string => {
  if (address.length <= chars * 2) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

/**
 * Convert mutez to tokens (assuming 6 decimals like USDT)
 */
export const mutezToTokens = (mutez: number, decimals: number = 6): number => {
  return mutez / Math.pow(10, decimals);
};

/**
 * Convert tokens to mutez (assuming 6 decimals like USDT)
 */
export const tokensToMutez = (tokens: number, decimals: number = 6): number => {
  return Math.floor(tokens * Math.pow(10, decimals));
};
