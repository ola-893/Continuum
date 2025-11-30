// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TokenRegistry.sol";
import "./StreamingProtocol.sol";

/**
 * @title RWAHub
 * @dev The central orchestration contract for the YieldStream ecosystem.
 * It integrates the TokenRegistry, StreamingProtocol, and (eventually) the
 * ComplianceGuard to provide a single, secure entry point for all major functions.
 */
contract RWAHub is Ownable {
    TokenRegistry public tokenRegistry;
    StreamingProtocol public streamingProtocol;

    // Eventually, a ComplianceGuard contract will be added here
    // address public complianceGuard;

    event RWAStreamCreated(
        uint256 indexed tokenId,
        uint256 indexed streamId,
        address indexed owner,
        string metadataUri
    );

    /**
     * @param _registryAddress The address of the deployed TokenRegistry contract.
     * @param _protocolAddress The address of the deployed StreamingProtocol contract.
     * @param initialOwner The ultimate owner of the hub and the entire system.
     */
    constructor(
        address _registryAddress,
        address _protocolAddress,
        address initialOwner
    ) Ownable(initialOwner) {
        tokenRegistry = TokenRegistry(_registryAddress);
        streamingProtocol = StreamingProtocol(_protocolAddress);
    }

    /**
     * @dev A compliant function to create a new RWA, including minting the NFT,
     * creating the yield stream, and registering the asset.
     */
    function createCompliantRWAStream(
        address owner,
        uint8 assetType,
        string memory metadataUri,
        uint256 totalYield,
        uint256 duration
    ) public {
        // In the future, a call to a ComplianceGuard contract would go here:
        // require(IComplianceGuard(complianceGuard).isAddressWhitelisted(msg.sender, assetType), "Not authorized");

        // Step 1: Create the yield stream. The RWAHub is the owner of the StreamingProtocol,
        // so it can call createStream. The funds are transferred from the caller (msg.sender)
        // to the StreamingProtocol contract.
        uint256 streamId = streamingProtocol.createStream(msg.sender, owner, totalYield, duration);

        // Step 2: Register the RWA as an NFT. The RWAHub is the owner of the TokenRegistry,
        // so it can call registerToken.
        uint256 tokenId = tokenRegistry.registerToken(
            owner,
            assetType,
            uint64(streamId),
            metadataUri
        );

        emit RWAStreamCreated(tokenId, streamId, owner, metadataUri);
    }

    // --- Other hub functions (claim, flash advance, etc.) will be added here ---
}
