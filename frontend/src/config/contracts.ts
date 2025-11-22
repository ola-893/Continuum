/**
 * Contract Configuration for Continuum Protocol on Aptos Testnet
 */

export const CONTRACT_CONFIG = {
    // Newly deployed Continuum contract address
    MODULE_ADDRESS: "0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b",

    // Network
    NETWORK: "testnet" as const,

    // Module names
    MODULES: {
        RWA_HUB: "rwa_hub",
        STREAMING_PROTOCOL: "streaming_protocol",
        ASSET_YIELD_PROTOCOL: "asset_yield_protocol",
        COMPLIANCE_GUARD: "compliance_guard",
        TOKEN_REGISTRY: "token_registry",
    },

    // Coin type (AptosCoin for testnet)
    COIN_TYPE: "0x1::aptos_coin::AptosCoin",

    // Asset types (from your Move contract)
    ASSET_TYPES: {
        REAL_ESTATE: 0,  // Updated to match new registry
        CAR: 1,
        COMMODITIES: 2,
    },

    // Constants
    ONE_APT: 100_000_000, // 1 APT = 10^8 octas
    THIRTY_DAYS_SECONDS: 30 * 24 * 60 * 60,
};
