// This file is populated with the actual contract addresses and ABIs 
// after the contracts are deployed to the BNB Smart Chain.

// Full ABIs from deployed artifacts
const RWAHub_ABI = [
    "constructor(address _registryAddress, address _protocolAddress, address initialOwner)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    "event PropertyStreamCreated(uint256 indexed tokenId, uint256 indexed streamId, address indexed owner, string metadataUri, string unibaseId)",
    "function createCompliantPropertyStream(address owner, string metadataUri, string unibaseId, uint256 totalYield, uint256 duration)",
    "function owner() view returns (address)",
    "function propertyRegistry() view returns (address)",
    "function renounceOwnership()",
    "function streamingProtocol() view returns (address)",
    "function transferOwnership(address newOwner)"
];

const PropertyRegistry_ABI = [
    "constructor(address initialOwner)",
    "error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner)",
    "error ERC721InsufficientApproval(address operator, uint256 tokenId)",
    "error ERC721InvalidApprover(address approver)",
    "error ERC721InvalidOperator(address operator)",
    "error ERC721InvalidOwner(address owner)",
    "error ERC721InvalidReceiver(address receiver)",
    "error ERC721InvalidSender(address sender)",
    "error ERC721NonexistentToken(uint256 tokenId)",
    "error OwnableInvalidOwner(address owner)",
    "error OwnableUnauthorizedAccount(address account)",
    "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
    "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    "event PropertyRegistered(uint256 indexed tokenId, address indexed owner, uint64 streamId, string unibaseId)",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "function approve(address to, uint256 tokenId)",
    "function balanceOf(address owner) view returns (uint256)",
    "function getApproved(uint256 tokenId) view returns (address)",
    "function isApprovedForAll(address owner, address operator) view returns (bool)",
    "function name() view returns (string)",
    "function owner() view returns (address)",
    "function ownerOf(uint256 tokenId) view returns (address)",
    "function propertyDetails(uint256) view returns (uint64 streamId, string metadataUri, string unibaseId, uint256 registeredAt)",
    "function registerProperty(address owner, uint64 streamId, string metadataUri, string unibaseId) returns (uint256)",
    "function renounceOwnership()",
    "function safeTransferFrom(address from, address to, uint256 tokenId)",
    "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
    "function setApprovalForAll(address operator, bool approved)",
    "function supportsInterface(bytes4 interfaceId) view returns (bool)",
    "function symbol() view returns (string)",
    "function tokenByIndex(uint256 index) view returns (uint256)",
    "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
    "function tokenURI(uint256 tokenId) view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function transferFrom(address from, address to, uint256 tokenId)",
    "function transferOwnership(address newOwner)"
];

const StreamingProtocol_ABI = [
    "constructor(address _tokenAddress, address initialOwner)",
    "error OwnableInvalidOwner(address owner)",
    "error OwnableUnauthorizedAccount(address account)",
    "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)",
    "event StreamCancelled(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 amountRefunded)",
    "event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 totalAmount, uint256 flowRate, uint256 startTime, uint256 stopTime)",
    "event YieldClaimed(uint256 indexed streamId, address indexed recipient, uint256 amountClaimed)",
    "function cancelStream(uint256 streamId)",
    "function claimFromStream(uint256 streamId)",
    "function claimableBalance(uint256 streamId) view returns (uint256)",
    "function createStream(address sender, address recipient, uint256 totalAmount, uint256 duration) returns (uint256)",
    "function nextStreamId() view returns (uint256)",
    "function owner() view returns (address)",
    "function renounceOwnership()",
    "function streamToken() view returns (address)",
    "function streams(uint256) view returns (address sender, address recipient, uint256 totalAmount, uint256 flowRate, uint256 startTime, uint256 stopTime, uint256 amountWithdrawn, bool isActive)",
    "function transferOwnership(address newOwner)"
];


export const CONTRACT_CONFIG = {
    bscTestnet: {
        RWA_HUB_ADDRESS: "0xEc30ceaf9c8aedf25aa2840041C459D6831859C2",
        TOKEN_REGISTRY_ADDRESS: "0xaB546773894A311bc3c1d8f3F93bF332662A87Ea",
        STREAMING_PROTOCOL_ADDRESS: "0x7dA30575c1e88870572d999bfa9c390A078B8598",
        STREAM_TOKEN_ADDRESS: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
        MOCK_ERC20_ADDRESS: "0xeD24FC36d5Ee211Ea25A80239Fb8C4Cfd80f12Ee",
    },
    bsc: {
        RWA_HUB_ADDRESS: "0x..._MAINNET_ADDRESS_...",
        TOKEN_REGISTRY_ADDRESS: "0x..._MAINNET_ADDRESS_...",
        STREAMING_PROTOCOL_ADDRESS: "0x..._MAINNET_ADDRESS_...",
        STREAM_TOKEN_ADDRESS: "0x..._MAINNET_ADDRESS_...",
        MOCK_ERC20_ADDRESS: "0x..._MAINNET_ADDRESS_...",
    },
    ABIS: {
        RWAHub: RWAHub_ABI,
        TokenRegistry: PropertyRegistry_ABI,
        StreamingProtocol: StreamingProtocol_ABI,
        MockERC20: [
            "function transfer(address to, uint256 amount) returns (bool)",
            "function approve(address spender, uint256 amount) returns (bool)",
        ]
    },
};
