// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PropertyRegistry
 * @dev A contract for registering Real-World Properties as unique ERC721 tokens.
 * It serves as the central "phonebook" for all Properties in the Unibase Property Matcher ecosystem.
 */
contract PropertyRegistry is ERC721, ERC721Enumerable, Ownable {
    // Counter to keep track of the next token ID
    uint256 private _nextTokenId;

    // Struct to store the immutable information for each registered Property
    struct PropertyIndexEntry {
        uint64 streamId;
        string metadataUri; // IPFS URI or similar
        string unibaseId;   // Unibase Memory ID
        uint256 registeredAt;
    }

    // Mapping from a tokenId to its PropertyIndexEntry
    mapping(uint256 => PropertyIndexEntry) public propertyDetails;

    event PropertyRegistered(
        uint256 indexed tokenId,
        uint64 streamId,
        address owner,
        string unibaseId
    );

    /**
     * @dev Sets the name, symbol for the token collection, and the initial owner.
     */
    constructor(address initialOwner)
        ERC721("Unibase Property Matcher", "UPM-PROP")
        Ownable(initialOwner)
    {}

    /**
     * @dev Registers a new Property, mints an NFT for it, and stores its details.
     * This function can only be called by the contract owner (e.g., the RWAHub).
     * @param owner The address that will own the new Property token.
     * @param streamId The ID of the associated yield stream.
     * @param metadataUri The URI for the asset's metadata.
     * @param unibaseId The Unibase ID for the asset's memory.
     * @return The ID of the newly minted token.
     */
    function registerProperty(
        address owner,
        uint64 streamId,
        string memory metadataUri,
        string memory unibaseId
    ) public onlyOwner returns (uint256) {
        uint256 newItemId = _nextTokenId;
        _nextTokenId++;

        _safeMint(owner, newItemId);

        PropertyIndexEntry memory newEntry = PropertyIndexEntry({
            streamId: streamId,
            metadataUri: metadataUri,
            unibaseId: unibaseId,
            registeredAt: block.timestamp
        });

        propertyDetails[newItemId] = newEntry;

        emit PropertyRegistered(newItemId, streamId, owner, unibaseId);

        return newItemId;
    }

    /**
     * @dev Base URI for computing `tokenURI`. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     * The IPFS CID is stored in `metadataUri`, so we override `tokenURI` to return it directly.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(propertyDetails[tokenId].registeredAt != 0, "ERC721: URI query for nonexistent or unregistered token");
        return propertyDetails[tokenId].metadataUri;
    }

    // The following functions are overrides required by Solidity.

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
