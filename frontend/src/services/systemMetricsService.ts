/**
 * System Metrics Service
 * 
 * Calculates and provides system-wide metrics for the Continuum Protocol:
 * - Total Value Locked (TVL)
 * - Active streams count
 * - Total assets count
 * - Yield distributed
 */

import { getTezos } from './tezosWalletService';
import { getConfig } from '../config/tezos';
import { getStreamInfo, getTokenCount } from './tezosContractService';

export interface SystemMetrics {
  totalValueLocked: number;
  activeStreamsCount: number;
  totalAssetsCount: number;
  totalYieldDistributed: number;
}

/**
 * Calculate Total Value Locked (TVL) across all streams
 * TVL = sum of all escrow balances (total_amount - amount_withdrawn) for active streams
 */
export const calculateTVL = async (): Promise<number> => {
  try {
    const tezos = getTezos();
    if (!tezos) {
      throw new Error('Tezos instance not initialized');
    }

    const config = getConfig();
    const streamingContract = await tezos.wallet.at(config.contracts.streamingProtocol);
    const storage: any = await streamingContract.storage();

    let tvl = 0;
    const nextStreamId = storage.next_stream_id.toNumber();

    // Iterate through all streams
    for (let streamId = 0; streamId < nextStreamId; streamId++) {
      try {
        const stream = await storage.streams.get(streamId);
        if (stream && stream.status.toNumber() === 0) { // 0 = active
          const escrowBalance = stream.total_amount.toNumber() - stream.amount_withdrawn.toNumber();
          tvl += escrowBalance;
        }
      } catch (error) {
        // Stream might not exist, continue
        continue;
      }
    }

    return tvl;
  } catch (error) {
    console.error('Error calculating TVL:', error);
    return 0;
  }
};

/**
 * Count active streams
 * Active streams have status = 0 (ACTIVE)
 */
export const countActiveStreams = async (): Promise<number> => {
  try {
    const tezos = getTezos();
    if (!tezos) {
      throw new Error('Tezos instance not initialized');
    }

    const config = getConfig();
    const streamingContract = await tezos.wallet.at(config.contracts.streamingProtocol);
    const storage: any = await streamingContract.storage();

    let activeCount = 0;
    const nextStreamId = storage.next_stream_id.toNumber();

    // Iterate through all streams
    for (let streamId = 0; streamId < nextStreamId; streamId++) {
      try {
        const stream = await storage.streams.get(streamId);
        if (stream && stream.status.toNumber() === 0) { // 0 = active
          activeCount++;
        }
      } catch (error) {
        // Stream might not exist, continue
        continue;
      }
    }

    return activeCount;
  } catch (error) {
    console.error('Error counting active streams:', error);
    return 0;
  }
};

/**
 * Get total assets count from token registry
 */
export const getTotalAssetsCount = async (): Promise<number> => {
  try {
    return await getTokenCount();
  } catch (error) {
    console.error('Error getting total assets count:', error);
    return 0;
  }
};

/**
 * Calculate total yield distributed
 * Total yield = sum of amount_withdrawn across all streams
 */
export const calculateTotalYieldDistributed = async (): Promise<number> => {
  try {
    const tezos = getTezos();
    if (!tezos) {
      throw new Error('Tezos instance not initialized');
    }

    const config = getConfig();
    const streamingContract = await tezos.wallet.at(config.contracts.streamingProtocol);
    const storage: any = await streamingContract.storage();

    let totalYield = 0;
    const nextStreamId = storage.next_stream_id.toNumber();

    // Iterate through all streams
    for (let streamId = 0; streamId < nextStreamId; streamId++) {
      try {
        const stream = await storage.streams.get(streamId);
        if (stream) {
          totalYield += stream.amount_withdrawn.toNumber();
        }
      } catch (error) {
        // Stream might not exist, continue
        continue;
      }
    }

    return totalYield;
  } catch (error) {
    console.error('Error calculating total yield distributed:', error);
    return 0;
  }
};

/**
 * Get all system metrics in one call
 */
export const getSystemMetrics = async (): Promise<SystemMetrics> => {
  try {
    // Fetch all metrics in parallel for better performance
    const [tvl, activeStreams, totalAssets, yieldDistributed] = await Promise.all([
      calculateTVL(),
      countActiveStreams(),
      getTotalAssetsCount(),
      calculateTotalYieldDistributed(),
    ]);

    return {
      totalValueLocked: tvl,
      activeStreamsCount: activeStreams,
      totalAssetsCount: totalAssets,
      totalYieldDistributed: yieldDistributed,
    };
  } catch (error) {
    console.error('Error fetching system metrics:', error);
    return {
      totalValueLocked: 0,
      activeStreamsCount: 0,
      totalAssetsCount: 0,
      totalYieldDistributed: 0,
    };
  }
};

/**
 * Get assets count by type
 */
export const getAssetsCountByType = async (): Promise<{
  realEstate: number;
  vehicles: number;
  commodities: number;
}> => {
  try {
    const tezos = getTezos();
    if (!tezos) {
      throw new Error('Tezos instance not initialized');
    }

    const config = getConfig();
    const registryContract = await tezos.wallet.at(config.contracts.tokenRegistry);
    const storage: any = await registryContract.storage();

    // Get token sets for each asset type
    const realEstateSet = await storage.tokens_by_type.get(0);
    const vehiclesSet = await storage.tokens_by_type.get(1);
    const commoditiesSet = await storage.tokens_by_type.get(2);

    return {
      realEstate: realEstateSet ? realEstateSet.size : 0,
      vehicles: vehiclesSet ? vehiclesSet.size : 0,
      commodities: commoditiesSet ? commoditiesSet.size : 0,
    };
  } catch (error) {
    console.error('Error getting assets count by type:', error);
    return {
      realEstate: 0,
      vehicles: 0,
      commodities: 0,
    };
  }
};
