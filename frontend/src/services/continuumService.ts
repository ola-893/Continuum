import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { aptosClient, buildFunctionId } from "./aptosClient";
import { CONTRACT_CONFIG } from "../config/contracts";
import {
    TokenIndexEntry,
    StreamInfo,
    RentalDetails,
    ComplianceStatus
} from "../types/continuum";

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
    static async getUserComplianceStatus(userAddress: string): Promise<ComplianceStatus> {
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
    static async getAllRegisteredTokens(): Promise<TokenIndexEntry[]> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_all_marketplace_tokens`,
                    functionArguments: [],
                },
            });
            return result[0] as TokenIndexEntry[] || [];
        } catch (error) {
            console.error("Error fetching all registered tokens:", error);
            return [];
        }
    }

    /**
     * Get RWA tokens owned by a specific user
     * Fetches all tokens owned by user and filters for registered RWA tokens
     */
    static async getOwnedRWATokens(ownerAddress: string): Promise<string[]> {
        try {
            // Get all registered RWA tokens first
            const registeredTokens = await this.getAllRegisteredTokens();
            const registeredAddresses = new Set(
                registeredTokens.map((token) =>
                    token.token_address
                )
            );

            // Get all digital assets owned by the user
            const ownedAssets = await aptosClient.getOwnedDigitalAssets({
                ownerAddress,
            });

            // Filter for RWA tokens (those in our registry)
            const ownedRWATokens = ownedAssets
                .filter((asset: any) => {
                    const tokenAddress = asset.token_data_id || asset.current_token_data?.token_data_id;
                    return tokenAddress && registeredAddresses.has(tokenAddress);
                })
                .map((asset: any) => asset.token_data_id || asset.current_token_data?.token_data_id);

            return ownedRWATokens;
        } catch (error) {
            console.error("Error fetching owned RWA tokens:", error);
            return [];
        }
    }
    /**
     * Get paginated tokens for marketplace
     */
    static async getTokensPaginated(offset: number, limit: number): Promise<TokenIndexEntry[]> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_marketplace_tokens_paginated`,
                    functionArguments: [offset.toString(), limit.toString()],
                },
            });
            return result[0] as TokenIndexEntry[] || [];
        } catch (error) {
            console.error("Error fetching paginated tokens:", error);
            return [];
        }
    }

    /**
     * Get tokens by asset type
     */
    static async getTokensByType(assetType: number): Promise<TokenIndexEntry[]> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_tokens_by_asset_type`,
                    functionArguments: [assetType],
                },
            });
            return result[0] as TokenIndexEntry[] || [];
        } catch (error) {
            console.error("Error fetching tokens by type:", error);
            return [];
        }
    }

    /**
     * Get token details from registry
     */
    static async getTokenDetailsFromRegistry(tokenAddress: string): Promise<TokenIndexEntry> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(
                        CONTRACT_CONFIG.MODULES.TOKEN_REGISTRY,
                        "get_token"
                    ),
                    functionArguments: [tokenAddress],
                },
            });
            return result[0] as TokenIndexEntry;
        } catch (error) {
            console.error('Failed to get token details:', error);
            throw error;
        }
    }

    /**
     * Get NFT name and description directly from blockchain
     */
    static async getNFTMetadata(tokenAddress: string): Promise<{ name: string, description: string }> {
        try {
            // Fetch the token object's properties using Aptos SDK
            const resource = await aptosClient.getAccountResource({
                accountAddress: tokenAddress,
                resourceType: '0x4::token::Token',
            });

            // Extract name from the token object
            const name = (resource.data as any)?.name || `Asset #${tokenAddress.slice(-4)}`;
            const description = (resource.data as any)?.description || '';

            return { name, description };
        } catch (error) {
            console.warn(`Could not fetch NFT metadata from blockchain for ${tokenAddress}:`, error);
            // Fallback to fetching from URI if available
            return {
                name: `Asset #${tokenAddress.slice(-4)}`,
                description: '',
            };
        }
    }

    /**
     * Check if an asset has an active rental
     * Returns: { isRented: boolean, streamId: number }
     */
    static async getActiveRental(tokenAddress: string): Promise<{ isRented: boolean, streamId: number }> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(CONTRACT_CONFIG.MODULES.RWA_HUB, "get_active_rental"),
                    functionArguments: [tokenAddress],
                },
            });

            const isRented = result[0] as boolean;
            const streamId = Number(result[1]);

            return { isRented, streamId };
        } catch (error) {
            console.error('Error checking active rental:', error);
            return { isRented: false, streamId: 0 };
        }
    }

    /**
     * Get detailed rental information
     * Returns: { tenant, landlord, timeRemaining, totalPaidSoFar, isActive }
     */
    static async getRentalDetails(streamId: number): Promise<RentalDetails | null> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(CONTRACT_CONFIG.MODULES.RWA_HUB, "get_rental_details"),
                    typeArguments: ["0x1::aptos_coin::AptosCoin"],
                    functionArguments: [CONTRACT_CONFIG.MODULE_ADDRESS, streamId.toString()],
                },
            });

            return {
                tenant: result[0] as string,
                landlord: result[1] as string,
                timeRemaining: Number(result[2]),
                totalPaidSoFar: Number(result[3]),
                isActive: result[4] as boolean,
            };
        } catch (error) {
            console.error('Error fetching rental details:', error);
            return null;
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
     * Get token by stream ID
     */
    static async getTokenByStreamId(streamId: number): Promise<TokenIndexEntry | null> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: `${CONTRACT_CONFIG.MODULE_ADDRESS}::${CONTRACT_CONFIG.MODULES.RWA_HUB}::get_token_by_stream`,
                    functionArguments: [streamId.toString()],
                },
            });
            return result[0] as TokenIndexEntry || null;
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
    static async getStreamInfo(streamId: number): Promise<StreamInfo | null> {
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
     * Create an asset yield stream with specified asset type
     * Supports: 0=Real Estate, 1=Vehicle, 2=Commodities
     */
    static createAssetStream(
        tokenAddress: string,
        totalYield: number,
        durationInSeconds: number,
        assetType: number, // 0=Real Estate, 1=Vehicle, 2=Commodities
        metadataUri: string = ""
    ): InputTransactionData {
        // Map frontend asset types (0,1,2) to contract asset types (1,2,3)
        // Frontend: 0=Real Estate, 1=Vehicle, 2=Commodities
        // Contract: 1=Real Estate, 2=Securities(Vehicle), 3=Commodities, 4=Art
        const contractAssetType = assetType + 1;

        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.RWA_HUB,
                    "create_compliant_rwa_stream" // ✅ CORRECT function that accepts asset_type!
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS, // stream_registry_addr
                    CONTRACT_CONFIG.MODULE_ADDRESS, // yield_registry_addr
                    CONTRACT_CONFIG.MODULE_ADDRESS, // compliance_addr
                    tokenAddress,                    // token_obj_addr
                    totalYield,                      // total_yield
                    durationInSeconds,               // duration
                    contractAssetType,               // asset_type (1-4)
                    metadataUri,                     // metadata_uri
                ],
            },
        };
    }

    /**
     * Create a real estate yield stream (legacy - calls createAssetStream with type 0)
     * Note: expected_stream_id removed - the contract now auto-generates and captures the stream ID
     */
    static createRealEstateStream(
        tokenAddress: string,
        totalYield: number,
        durationInSeconds: number,
        metadataUri: string = ""
    ): InputTransactionData {
        return ContinuumService.createAssetStream(
            tokenAddress,
            totalYield,
            durationInSeconds,
            0, // Real Estate
            metadataUri
        );
    }

    /**
     * Claim yield for an asset
     * Note: asset_type removed - auto-lookup from token registry prevents user error
     */
    static claimYield(
        tokenAddress: string
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
                ],
            },
        };
    }

    /**
     * Flash advance - withdraw future yield immediately
     * Note: asset_type removed - auto-lookup from token registry prevents user error
     */
    static flashAdvance(
        tokenAddress: string,
        amountRequested: number
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.RWA_HUB,
                    "compliant_flash_advance"
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS, // stream_registry_addr
                    CONTRACT_CONFIG.MODULE_ADDRESS, // yield_registry_addr  
                    CONTRACT_CONFIG.MODULE_ADDRESS, // compliance_addr
                    tokenAddress,                    // token_obj_addr
                    amountRequested.toString(),      // amount_requested (as string for u64)
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

    // ============================================
    // 5. RENTAL & IoT STREAMING (NEW)
    // ============================================

    /**
     * Stream rent to asset (Pay-as-you-go rental)
     * Use cases: Car rentals, apartment rentals, equipment rentals
     * Tenant streams money to asset owner to gain physical access
     */
    static streamRentToAsset(
        tokenAddress: string,
        paymentAmount: number,
        duration: number
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.RWA_HUB,
                    "stream_rent_to_asset"
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS, // stream_registry_addr
                    tokenAddress,                    // token_obj_addr (the asset)
                    paymentAmount,                   // payment_amount
                    duration,                        // duration in seconds
                ],
            },
        };
    }

    /**
     * Check access status for IoT devices
     * Returns true if tenant has active payment stream to current asset owner
     * Called by: Tesla, smart locks, IoT gateways, industrial equipment
     */
    static async checkAccessStatus(
        streamId: number,
        tokenAddress: string
    ): Promise<boolean> {
        try {
            const result = await aptosClient.view({
                payload: {
                    function: buildFunctionId(
                        CONTRACT_CONFIG.MODULES.RWA_HUB,
                        "check_access_status"
                    ),
                    typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                    functionArguments: [
                        CONTRACT_CONFIG.MODULE_ADDRESS, // stream_registry_addr
                        streamId,
                        tokenAddress,                    // token_obj_addr
                    ],
                },
            });
            return result[0] as boolean;
        } catch (error) {
            console.error("Error checking access status:", error);
            return false;
        }
    }

    /**
     * Cancel a rental stream early and get refund
     * Completes the "pay only for what you use" user journey
     * Example: Rented car for $100/day, used 2 hours, get $91.50 refunded
     */
    static cancelStream(
        streamId: number
    ): InputTransactionData {
        return {
            data: {
                function: buildFunctionId(
                    CONTRACT_CONFIG.MODULES.STREAMING_PROTOCOL,
                    "cancel"
                ),
                typeArguments: [CONTRACT_CONFIG.COIN_TYPE],
                functionArguments: [
                    CONTRACT_CONFIG.MODULE_ADDRESS, // registry_addr
                    streamId,
                ],
            },
        };
    }
}
