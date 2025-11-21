// Configuration constants extracted from deployment_flow.sh
export const NETWORK = "testnet"; // Change to "mainnet" or "devnet" as needed

// Coin Types
export const APTOS_COIN = "0x1::aptos_coin::AptosCoin";

// Asset Types (from compliance_guard.move)
export const ASSET_TYPES = {
    REAL_ESTATE: 1,
    SECURITIES: 2,
    COMMODITIES: 3,
    ART: 4,
} as const;

// Time constants (from deployment_flow.sh)
export const ONE_APT = 100000000; // 1 APT = 10^8 octas (8 decimals)
export const THIRTY_DAYS_SECONDS = 2592000; // 30 days in seconds

// Module name (from Move.toml)
export const MODULE_NAME = "aptos_rwa";

// Default addresses - these will be set dynamically when user deploys
export const DEFAULT_ADDRESSES = {
    // These are typically the deployer's address
    streamRegistry: "",
    yieldRegistry: "",
    compliance: "",
};

// Network endpoints
export const NETWORK_ENDPOINTS = {
    mainnet: "https://fullnode.mainnet.aptoslabs.com/v1",
    testnet: "https://fullnode.testnet.aptoslabs.com/v1",
    devnet: "https://fullnode.devnet.aptoslabs.com/v1",
} as const;

export const getNetworkEndpoint = () => NETWORK_ENDPOINTS[NETWORK];
