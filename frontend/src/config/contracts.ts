/**
 * Contract Configuration for Continuum Protocol on Aptos Testnet
 */

export const CONTRACT_CONFIG = {
    // Newly deployed Continuum contract address (continuum-v3)
    MODULE_ADDRESS: "0xf630676ecb561cf2b2fadc1a34daa8a054d24f0e936439f2e63a90d2651b87ef",

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
