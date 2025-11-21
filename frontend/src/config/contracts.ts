/**
 * Contract Configuration for YieldStream on Aptos Testnet
 */

export const CONTRACT_CONFIG = {
    // Your deployed contract address (from quick_setup_with_admin)
    MODULE_ADDRESS: "0x7c68c08ed30efcb9159b90c398247bf6504ab11678b39e58db12cae2360c9dc3",

    // Network
    NETWORK: "testnet" as const,

    // Module names
    MODULES: {
        RWA_HUB: "rwa_hub",
        STREAMING_PROTOCOL: "streaming_protocol",
        ASSET_YIELD_PROTOCOL: "asset_yield_protocol",
        COMPLIANCE_GUARD: "compliance_guard",
    },

    // Coin type (AptosCoin for testnet)
    COIN_TYPE: "0x1::aptos_coin::AptosCoin",

    // Asset types (from your Move contract)
    ASSET_TYPES: {
        CAR: 0,
        REAL_ESTATE: 1,
        SECURITIES: 2,
        COMMODITIES: 3,
        ART: 4,
    },

    // Constants
    ONE_APT: 100_000_000, // 1 APT = 10^8 octas
    THIRTY_DAYS_SECONDS: 30 * 24 * 60 * 60,
};
