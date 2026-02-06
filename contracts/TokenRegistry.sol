// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title TokenRegistry
 * @dev A contract for registering Real-World Assets as unique ERC721 tokens.
 * It serves as the central "phonebook" for all RWAs in the YieldStream ecosystem.
 */
contract TokenRegistry is ERC721, Ownable {
    // Counter to keep track of the next token ID
    uint256 private _nextTokenId;

    // Struct to store the immutable information for each registered RWA
    struct TokenIndexEntry {
        uint8 assetType;
        uint64 streamId;
        string metadataUri; // Using string for IPFS URI
        uint256 registeredAt;
    }

    // Mapping from a tokenId to its TokenIndexEntry
    mapping(uint256 => TokenIndexEntry) public tokenDetails;

    event TokenRegistered(
        uint256 indexed tokenId,
        uint8 assetType,
        uint64 streamId,
        address owner
    );

    /**
     * @dev Sets the name, symbol for the token collection, and the initial owner.
     */
    constructor(address initialOwner)
        ERC721("YieldStream RWA", "YS-RWA")
        Ownable(initialOwner)
    {}

    /**
     * @dev Registers a new RWA, mints an NFT for it, and stores its details.
     * This function can only be called by the contract owner (e.g., the RWAHub).
     * @param owner The address that will own the new RWA token.
     * @param assetType The type of the asset (e.g., 0 for Real Estate, 1 for Vehicle).
     * @param streamId The ID of the associated yield stream.
     * @param metadataUri The IPFS URI for the asset's metadata.
     * @return The ID of the newly minted token.
     */
    function registerToken(
        address owner,
        uint8 assetType,
        uint64 streamId,
        string memory metadataUri
    ) public onlyOwner returns (uint256) {
        uint256 newItemId = _nextTokenId;
        _nextTokenId++;

        _safeMint(owner, newItemId);

        TokenIndexEntry memory newEntry = TokenIndexEntry({
            assetType: assetType,
            streamId: streamId,
            metadataUri: metadataUri,
            registeredAt: block.timestamp
        });

        tokenDetails[newItemId] = newEntry;

        emit TokenRegistered(newItemId, assetType, streamId, owner);

        return newItemId;
    }

    /**
     * @dev Base URI for computing `tokenURI`. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     * The IPFS CID is stored in `metadataUri`, so we override `tokenURI` to return it directly.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(tokenDetails[tokenId].registeredAt != 0, "ERC721: URI query for nonexistent or unregistered token");
        return tokenDetails[tokenId].metadataUri;
    }
}
