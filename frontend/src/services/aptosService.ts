import { Aptos, AptosConfig, Network, InputViewFunctionData } from "@aptos-labs/ts-sdk";
import { NETWORK, APTOS_COIN } from "../config/constants";
import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";

// Initialize Aptos client
const aptosConfig = new AptosConfig({
    network: NETWORK as Network,
    clientConfig: {
        HEADERS: {
            "Authorization": "Bearer AG-74SF1GVWQ8QFNVQAFRMTTNCJYDPCSBW52"
        }
    }
});
export const aptos = new Aptos(aptosConfig);

// ==============================================================================
// INITIALIZATION FUNCTIONS
// ==============================================================================

/**
 * Initialize the RWA ecosystem (StreamRegistry, AssetYieldRegistry, ComplianceRegistry)
 * Corresponds to: rwa_hub::initialize_rwa_ecosystem
 */
export function initializeEcosystem(
    moduleAddress: string
): InputTransactionData {
    return {
        data: {
            function: `${moduleAddress}::rwa_hub::initialize_rwa_ecosystem`,
            typeArguments: [APTOS_COIN],
            functionArguments: [],
        },
    };
}

// ==============================================================================
// COMPLIANCE FUNCTIONS
// ==============================================================================

/**
 * Register identity (KYC) for a user
 * Corresponds to: compliance_guard::register_identity
 */
export function registerIdentity(
    complianceAddr: string,
    user: string,
    isKycVerified: boolean,
    jurisdiction: string, // e.g., "US"
    verificationLevel: number,
    expiryTime: number
): InputTransactionData {
    return {
        data: {
            function: `${complianceAddr}::compliance_guard::register_identity`,
            typeArguments: [],
            functionArguments: [
                complianceAddr,
                user,
                isKycVerified,
                jurisdiction,
                verificationLevel,
                expiryTime,
            ],
        },
    };
}

/**
 * Whitelist an address for specific asset types
 * Corresponds to: compliance_guard::whitelist_address
 */
export function whitelistAddress(
    complianceAddr: string,
    user: string,
    assetTypes: number[] // e.g., [1] for Real Estate
): InputTransactionData {
    return {
        data: {
            function: `${complianceAddr}::compliance_guard::whitelist_address`,
            typeArguments: [],
            functionArguments: [complianceAddr, user, assetTypes],
        },
    };
}

// ==============================================================================
// STREAM MANAGEMENT FUNCTIONS
// ==============================================================================

/**
 * Create a real estate stream (most common use case)
 * Corresponds to: rwa_hub::create_real_estate_stream
 */
export function createRealEstateStream(
    streamRegistryAddr: string,
    yieldRegistryAddr: string,
    complianceAddr: string,
    tokenAddr: string,
    totalYield: number,
    duration: number
): InputTransactionData {
    return {
        data: {
            function: `${streamRegistryAddr}::rwa_hub::create_real_estate_stream`,
            typeArguments: [APTOS_COIN],
            functionArguments: [
                streamRegistryAddr,
                yieldRegistryAddr,
                complianceAddr,
                tokenAddr,
                totalYield,
                duration,
            ],
        },
    };
}

/**
 * Claim yield for an asset
 * Corresponds to: rwa_hub::compliant_claim_yield
 * Note: assetType removed - auto-lookup from token registry
 */
export function claimYield(
    streamRegistryAddr: string,
    yieldRegistryAddr: string,
    complianceAddr: string,
    tokenAddr: string
): InputTransactionData {
    return {
        data: {
            function: `${streamRegistryAddr}::rwa_hub::compliant_claim_yield`,
            typeArguments: [APTOS_COIN],
            functionArguments: [
                streamRegistryAddr,
                yieldRegistryAddr,
                complianceAddr,
                tokenAddr,
            ],
        },
    };
}

/**
 * Request a flash advance (borrow against future yield)
 * Corresponds to: rwa_hub::compliant_flash_advance
 * Note: assetType removed - auto-lookup from token registry
 */
export function flashAdvance(
    streamRegistryAddr: string,
    yieldRegistryAddr: string,
    complianceAddr: string,
    tokenAddr: string,
    amountRequested: number
): InputTransactionData {
    return {
        data: {
            function: `${streamRegistryAddr}::rwa_hub::compliant_flash_advance`,
            typeArguments: [APTOS_COIN],
            functionArguments: [
                streamRegistryAddr,
                yieldRegistryAddr,
                complianceAddr,
                tokenAddr,
                amountRequested,
            ],
        },
    };
}

// ==============================================================================
// VIEW FUNCTIONS (Read-only queries)
// ==============================================================================

/**
 * Get complete stream information
 * Corresponds to: streaming_protocol::get_stream_info
 */
export async function getStreamInfo(
    streamRegistryAddr: string,
    streamId: number
): Promise<{
    sender: string;
    recipient: string;
    totalAmount: number;
    flowRate: number;
    startTime: number;
    stopTime: number;
    amountWithdrawn: number;
    status: number;
}> {
    const payload: InputViewFunctionData = {
        function: `${streamRegistryAddr}::streaming_protocol::get_stream_info`,
        typeArguments: [APTOS_COIN],
        functionArguments: [streamRegistryAddr, streamId],
    };

    const result = await aptos.view({ payload });

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
}

/**
 * Get stream ID for a specific asset token
 * Corresponds to: asset_yield_protocol::get_asset_stream_id
 */
export async function getAssetStreamId(
    yieldRegistryAddr: string,
    tokenAddr: string
): Promise<number> {
    const payload: InputViewFunctionData = {
        function: `${yieldRegistryAddr}::asset_yield_protocol::get_asset_stream_id`,
        typeArguments: [APTOS_COIN],
        functionArguments: [yieldRegistryAddr, tokenAddr],
    };

    const result = await aptos.view({ payload });
    return Number(result[0]);
}

/**
 * Check if an asset is registered in the yield registry
 * Corresponds to: asset_yield_protocol::is_asset_registered
 */
export async function isAssetRegistered(
    yieldRegistryAddr: string,
    tokenAddr: string
): Promise<boolean> {
    const payload: InputViewFunctionData = {
        function: `${yieldRegistryAddr}::asset_yield_protocol::is_asset_registered`,
        typeArguments: [APTOS_COIN],
        functionArguments: [yieldRegistryAddr, tokenAddr],
    };

    const result = await aptos.view({ payload });
    return result[0] as boolean;
}

/**
 * Get complete stream status including claimable, escrow, and freeze status
 * Corresponds to: rwa_hub::get_stream_status
 */
export async function getStreamStatus(
    streamRegistryAddr: string,
    complianceAddr: string,
    streamId: number
): Promise<{
    claimable: number;
    escrowBalance: number;
    remaining: number;
    isFrozen: boolean;
}> {
    const payload: InputViewFunctionData = {
        function: `${streamRegistryAddr}::rwa_hub::get_stream_status`,
        typeArguments: [APTOS_COIN],
        functionArguments: [streamRegistryAddr, complianceAddr, streamId],
    };

    const result = await aptos.view({ payload });

    return {
        claimable: Number(result[0]),
        escrowBalance: Number(result[1]),
        remaining: Number(result[2]),
        isFrozen: result[3] as boolean,
    };
}

/**
 * Get user's compliance status
 * Corresponds to: rwa_hub::get_user_compliance_status
 */
export async function getUserComplianceStatus(
    complianceAddr: string,
    userAddr: string
): Promise<{
    isAdmin: boolean;
    hasKyc: boolean;
    canTradeRealEstate: boolean;
}> {
    const payload: InputViewFunctionData = {
        function: `${complianceAddr}::rwa_hub::get_user_compliance_status`,
        typeArguments: [],
        functionArguments: [complianceAddr, userAddr],
    };

    const result = await aptos.view({ payload });

    return {
        isAdmin: result[0] as boolean,
        hasKyc: result[1] as boolean,
        canTradeRealEstate: result[2] as boolean,
    };
}

/**
 * Check if user can participate in RWA ecosystem for a specific asset type
 * Corresponds to: rwa_hub::can_participate
 */
export async function canParticipate(
    complianceAddr: string,
    userAddr: string,
    assetType: number
): Promise<boolean> {
    const payload: InputViewFunctionData = {
        function: `${complianceAddr}::rwa_hub::can_participate`,
        typeArguments: [],
        functionArguments: [complianceAddr, userAddr, assetType],
    };

    const result = await aptos.view({ payload });
    return result[0] as boolean;
}

/**
 * Get claimable balance for a stream
 * Corresponds to: streaming_protocol::claimable_balance_with_addr
 */
export async function getClaimableBalance(
    streamRegistryAddr: string,
    streamId: number
): Promise<number> {
    const payload: InputViewFunctionData = {
        function: `${streamRegistryAddr}::streaming_protocol::claimable_balance_with_addr`,
        typeArguments: [APTOS_COIN],
        functionArguments: [streamRegistryAddr, streamId],
    };

    const result = await aptos.view({ payload });
    return Number(result[0]);
}
