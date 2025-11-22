import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { aptosClient, buildFunctionId } from "./aptosClient";
import { CONTRACT_CONFIG } from "../config/contracts";

/**
 * Service layer for interacting with YieldStream smart contracts
 */
export class ContinuumService {

    // ============================================
    // 1. USER COMPLIANCE CHECKS
    // ============================================

    /**
     * Check if user can participate in RWA ecosystem
     */
    static async canUserParticipate(
        userAddress: string,
        assetType: number = CONTRACT_CONFIG.ASSET_TYPES.REAL_ESTATE
    ): Promise<boolean> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(
                        CONTRACT_CONFIG.MODULES.RWA_HUB,
                        "can_participate"
                    ),
                    functionArguments: [
                        CONTRACT_CONFIG.MODULE_ADDRESS, // compliance_addr
                        userAddress,
                        assetType,
                    ],
                },
            });
            return result[0] as boolean;
        } catch (error) {
            console.error("Error checking participation:", error);
            return false;
        }
    }

    /**
     * Get user's compliance status
     */
    static async getUserComplianceStatus(userAddress: string) {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(
                        CONTRACT_CONFIG.MODULES.RWA_HUB,
                        "get_user_compliance_status"
                    ),
                    functionArguments: [
                        CONTRACT_CONFIG.MODULE_ADDRESS,
                        userAddress,
                    ],
                },
            });

            return {
                isAdmin: result[0] as boolean,
                hasKYC: result[1] as boolean,
                canTradeRealEstate: result[2] as boolean,
            };
        } catch (error) {
            console.error("Error getting compliance status:", error);
            return { isAdmin: false, hasKYC: false, canTradeRealEstate: false };
        }
    }

    // ============================================
    // 8. TOKEN REGISTRY FUNCTIONS
    // ============================================

    /**
     * Get all registered tokens from the global registry
     * Uses rwa_hub wrapper for better compatibility
     */
    static async getAllRegisteredTokens(): Promise<any[]> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_all_marketplace_tokens`,
                    functionArguments: [],
                },
            });
            return result[0] as any[] || [];
        } catch (error) {
            console.error("Error fetching all registered tokens:", error);
            return [];
        }
    }

    /**
     * Get paginated tokens for marketplace
     */
    static async getTokensPaginated(offset: number, limit: number): Promise<any[]> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_marketplace_tokens_paginated`,
                    functionArguments: [offset.toString(), limit.toString()],
                },
            });
            return result[0] as any[] || [];
        } catch (error) {
            console.error("Error fetching paginated tokens:", error);
            return [];
        }
    }

    /**
     * Get tokens by asset type
     */
    static async getTokensByType(assetType: number): Promise<any[]> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_tokens_by_asset_type`,
                    functionArguments: [assetType],
                },
            });
            return result[0] as any[] || [];
        } catch (error) {
            console.error("Error fetching tokens by type:", error);
            return [];
        }
    }

    /**
     * Get count of all registered tokens
     */
    static async getTokenCount(): Promise<number> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_total_token_count`,
                    functionArguments: [],
                },
            });
            return Number(result[0]) || 0;
        } catch (error) {
            console.error("Error fetching token count:", error);
            return 0;
        }
    }

    /**
     * Get token details by address
     */
    static async getTokenDetails(tokenAddress: string): Promise<any | null> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_token_details`,
                    functionArguments: [tokenAddress],
                },
            });
            return result[0] || null;
        } catch (error) {
            console.error("Error fetching token details:", error);
            return null;
        }
    }

    /**
     * Get token by stream ID
     */
    static async getTokenByStreamId(streamId: number): Promise<any | null> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_token_by_stream`,
                    functionArguments: [streamId.toString()],
                },
            });
            return result[0] || null;
        } catch (error) {
            console.error("Error fetching token by stream ID:", error);
            return null;
        }
    }

    // ============================================
    // 2. ASSET STREAM MANAGEMENT
    // ============================================

    /**
     * Check if an asset (NFT) has a registered yield stream
     */
    static async isAssetRegistered(tokenAddress: string): Promise<boolean> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(
                        CONTRACT_CONFIG.MODULES.ASSET_YIELD_PROTOCOL,
                        "is_asset_registered"
                    ),
                    typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                    functionArguments: [
                        CONTRACT_CONFIG.MODULE_ADDRESS, // yield_registry_addr
                        tokenAddress,
                    ],
                },
            });
            return result[0] as boolean;
        } catch (error) {
            console.error("Error checking asset registration:", error);
            return false;
        }
    }

    /**
     * Get stream ID for an asset
     */
    static async getAssetStreamId(tokenAddress: string): Promise<number | null> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(
                        CONTRACT_CONFIG.MODULES.ASSET_YIELD_PROTOCOL,
                        "get_asset_stream_id"
                    ),
                    typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                    functionArguments: [
                        CONTRACT_CONFIG.MODULE_ADDRESS,
                        tokenAddress,
                    ],
                },
            });
            return Number(result[0]);
        } catch (error) {
            console.error("Error getting stream ID:", error);
            return null;
        }
    }

    /**
     * Get stream information
     */
    static async getStreamInfo(streamId: number) {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(
                        CONTRACT_CONFIG.MODULES.STREAMING_PROTOCOL,
                        "get_stream_info"
                    ),
                    typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                    functionArguments: [
                        CONTRACT_CONFIG.MODULE_ADDRESS,
                        streamId,
                    ],
                },
            });

            return {
                sender: result[0] as string,
                recipient: result[1] as string,
                totalAmount: Number(result[2]),
                flowRate: Number(result[3]),
                startTime: Number(result[4]),
                stopTime: Number(result[5]),
                amountWithdrawn: Number(result[6]),
                status: Number(result[7]),
            };
        } catch (error) {
            console.error("Error getting stream info:", error);
            return null;
        }
    }

    /**
     * Get claimable balance for a stream
     */
    static async getClaimableBalance(streamId: number): Promise<number> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(
                        CONTRACT_CONFIG.MODULES.STREAMING_PROTOCOL,
                        "claimable_balance_with_addr"
                    ),
                    typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                    functionArguments: [
                        CONTRACT_CONFIG.MODULE_ADDRESS,
                        streamId,
                    ],
                },
            });
            return Number(result[0]);
        } catch (error) {
            console.error("Error getting claimable balance:", error);
            return 0;
        }
    }

    /**
     * Get complete stream status (claimable, escrow, remaining, frozen)
     */
    static async getStreamStatus(streamId: number) {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(
                        CONTRACT_CONFIG.MODULES.RWA_HUB,
                        "get_stream_status"
                    ),
                    typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                    functionArguments: [
                        CONTRACT_CONFIG.MODULE_ADDRESS, // stream_registry_addr
                        CONTRACT_CONFIG.MODULE_ADDRESS, // compliance_addr
                        streamId,
                    ],
                },
            });

            return {
                claimable: Number(result[0]),
                escrowBalance: Number(result[1]),
                remaining: Number(result[2]),
                isFrozen: result[3] as boolean,
            };
        } catch (error) {
            console.error("Error getting stream status:", error);
            return null;
        }
    }

    // ============================================
    // 3. TRANSACTION BUILDERS
    // ============================================

    /**
     * Create a real estate yield stream
     */
    static createRealEstateStream(
        tokenAddress: string,
        totalYield: number,
        durationInSeconds: number,
        metadataUri: string = "",
        expectedStreamId: number = 0
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.RWA_HUB,
                    "create_real_estate_stream"
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS, // stream_registry_addr
                    CONTRACT_CONFIG.MODULE_ADDRESS, // yield_registry_addr
                    CONTRACT_CONFIG.MODULE_ADDRESS, // compliance_addr
                    tokenAddress,
                    totalYield,
                    durationInSeconds,
                    metadataUri,           // NEW: metadata_uri
                    expectedStreamId,      // NEW: expected_stream_id
                ],
            },
        };
    }

    /**
     * Claim yield for an asset
     */
    static claimYield(
        tokenAddress: string,
        assetType: number = CONTRACT_CONFIG.ASSET_TYPES.REAL_ESTATE
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.RWA_HUB,
                    "compliant_claim_yield"
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS, // stream_registry_addr
                    CONTRACT_CONFIG.MODULE_ADDRESS, // yield_registry_addr
                    CONTRACT_CONFIG.MODULE_ADDRESS, // compliance_addr
                    tokenAddress,
                    assetType,
                ],
            },
        };
    }

    /**
     * Flash advance - withdraw future yield immediately
     */
    static flashAdvance(
        tokenAddress: string,
        amountRequested: number,
        assetType: number = CONTRACT_CONFIG.ASSET_TYPES.REAL_ESTATE
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.RWA_HUB,
                    "compliant_flash_advance"
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS,
                    CONTRACT_CONFIG.MODULE_ADDRESS,
                    CONTRACT_CONFIG.MODULE_ADDRESS,
                    tokenAddress,
                    amountRequested,
                    assetType,
                ],
            },
        };
    }

    // ============================================
    // 4. ADMIN FUNCTIONS
    // ============================================

    /**
     * Whitelist a user for specific asset types
     */
    static whitelistUser(
        userAddress: string,
        assetTypes: number[] = [1, 2, 3, 4] // All types by default
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.COMPLIANCE_GUARD,
                    "whitelist_address"
                ),
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS,
                    userAddress,
                    assetTypes,
                ],
            },
        };
    }

    /**
     * Simulate KYC verification (Testnet only)
     */
    static simulateKYC(): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.COMPLIANCE_GUARD,
                    "simulate_kyc"
                ),
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS, // compliance_addr
                ],
            },
        };
    }

    /**
     * Register identity (Admin only)
     */
    static registerIdentity(
        userAddress: string,
        jurisdiction: string = "US",
        verificationLevel: number = 1,
        expiryTime: number = 9999999999
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.COMPLIANCE_GUARD,
                    "register_identity"
                ),
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS,
                    userAddress,
                    true, // is_kyc_verified
                    Array.from(new TextEncoder().encode(jurisdiction)),
                    verificationLevel,
                    expiryTime,
                ],
            },
        };
    }

    /**
     * Emergency freeze a stream (admin only)
     */
    static freezeAsset(
        streamId: number,
        reason: string = "Emergency freeze"
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.RWA_HUB,
                    "emergency_freeze"
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS, // compliance_addr
                    CONTRACT_CONFIG.MODULE_ADDRESS, // stream_registry_addr
                    streamId,
                    reason,
                ],
            },
        };
    }

    /**
     * Emergency unfreeze a stream (admin only)
     */
    static unfreezeAsset(streamId: number): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.RWA_HUB,
                    "emergency_unfreeze"
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS, // compliance_addr
                    CONTRACT_CONFIG.MODULE_ADDRESS, // stream_registry_addr
                    streamId,
                ],
            },
        };
    }

    /**
     * Batch whitelist multiple users (admin only)
     */
    static batchWhitelist(
        users: string[],
        assetTypes: number[] = [1, 2, 3, 4]
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.RWA_HUB,
                    "batch_whitelist"
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS,
                    users,
                    assetTypes,
                ],
            },
        };
    }
}
