// This file will be populated with the actual contract addresses and ABIs 
// after the contracts are deployed to the BNB Smart Chain.

// Simplified ABIs for now. In a real project, these would be imported from 
// the Hardhat artifacts (e.g., ../../artifacts/contracts/RWAHub.sol/RWAHub.json)
const RWAHub_ABI = [
    "function createCompliantRWAStream(address owner, uint8 assetType, string metadataUri, uint256 totalYield, uint256 duration) public",
    "function tokenRegistry() view returns (address)",
    "function streamingProtocol() view returns (address)"
]; 

const TokenRegistry_ABI = [
    "function registerToken(address owner, uint8 assetType, uint64 streamId, string memory metadataUri) public returns (uint256)",
    "function tokenDetails(uint256) view returns (uint8 assetType, uint64 streamId, string metadataUri, uint256 registeredAt)",
    "function totalSupply() view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string memory)"
];

const StreamingProtocol_ABI = [
    "function createStream(address sender, address recipient, uint256 totalAmount, uint256 duration) public returns (uint256)",
    "function streams(uint256) view returns (address sender, address recipient, uint256 totalAmount, uint256 flowRate, uint256 startTime, uint256 stopTime, uint256 amountWithdrawn, bool isActive)",
    "function claimableBalance(uint256 streamId) view returns (uint256)",
    "function claimFromStream(uint256 streamId) public",
    "function cancelStream(uint256 streamId) public"
];

export const CONTRACT_CONFIG = {
    // These addresses are for BSC Testnet. Replace with your deployed addresses.
    RWA_HUB_ADDRESS: "0xYOUR_RWA_HUB_ADDRESS_HERE",
    TOKEN_REGISTRY_ADDRESS: "0xYOUR_TOKEN_REGISTRY_ADDRESS_HERE", // This will be fetched from RWAHub once deployed
    STREAMING_PROTOCOL_ADDRESS: "0xYOUR_STREAMING_PROTOCOL_ADDRESS_HERE", // This will be fetched from RWAHub once deployed
    
    // The address of the BUSD token on BSC Testnet (or whichever ERC20 you use)
    STREAM_TOKEN_ADDRESS: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",

    ABIS: {
        RWAHub: RWAHub_ABI,
        TokenRegistry: TokenRegistry_ABI,
        StreamingProtocol: StreamingProtocol_ABI,
    },

    ASSET_TYPES: {
        REAL_ESTATE: 0,
        CAR: 1,
        COMMODITIES: 2,
    }
};
