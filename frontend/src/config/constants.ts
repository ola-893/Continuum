// Configuration constants
export const NETWORK = "testnet"; // Change to "mainnet" or "devnet" as needed

// Coin Types
export const NATIVE_TOKEN = "BNB";

// Asset Types (from compliance_guard.move)
export const ASSET_TYPES = {
    REAL_ESTATE: 1,
    SECURITIES: 2,
    COMMODITIES: 3,
    ART: 4,
} as const;

// Time constants
export const ONE_BNB = 1000000000000000000n; // 1 BNB = 10^18 wei
export const THIRTY_DAYS_SECONDS = 2592000; // 30 days in seconds

// Network endpoints
export const NETWORK_ENDPOINTS = {
    mainnet: "https://bsc-dataseed.binance.org/",
    testnet: "https://data-seed-prebsc-1-s1.binance.org:8545/",
    devnet: "https://data-seed-prebsc-1-s1.binance.org:8545/",
} as const;

export const getNetworkEndpoint = () => NETWORK_ENDPOINTS[NETWORK];
