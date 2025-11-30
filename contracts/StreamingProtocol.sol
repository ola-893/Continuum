// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title StreamingProtocol
 * @dev Manages the creation and lifecycle of yield streams.
 * This contract is intended to be owned and controlled by a central Hub contract.
 */
contract StreamingProtocol is Ownable {
    // Counter for generating unique stream IDs
    uint256 private _streamIdCounter;

    // Represents a single yield stream
    struct Stream {
        address sender;
        address recipient;
        uint256 totalAmount;
        uint256 flowRate; // Amount per second
        uint256 startTime;
        uint256 stopTime;
        uint256 amountWithdrawn;
        bool isActive;
    }

    // Mapping from stream ID to the Stream struct
    mapping(uint256 => Stream) public streams;

    // The ERC20 token used for streaming (e.g., BUSD, USDC)
    IERC20 public streamToken;

    event StreamCreated(uint256 indexed streamId, address indexed sender, address indexed recipient, uint256 totalAmount);
    event ClaimedFromStream(uint256 indexed streamId, address indexed recipient, uint256 amount);
    event StreamCanceled(uint256 indexed streamId, address indexed sender, uint256 senderBalance, uint256 recipientBalance);

    error InvalidStreamId(uint256 streamId);
    error NotStreamRecipient(uint256 streamId, address caller);
    error NotSenderOrRecipient(uint256 streamId, address caller);
    error StreamNotActive(uint256 streamId);
    error InsufficientBalance();

    /**
     * @param _streamTokenAddress The address of the ERC20 token to be used for streaming.
     * @param initialOwner The owner of this contract (the Hub contract).
     */
    constructor(address _streamTokenAddress, address initialOwner) Ownable(initialOwner) {
        streamToken = IERC20(_streamTokenAddress);
    }

    /**
     * @dev Creates a new yield stream.
     * Transfers the totalAmount from the sender to this contract.
     * Can only be called by the owner (the Hub contract).
     */
    function createStream(address sender, address recipient, uint256 totalAmount, uint256 duration) public onlyOwner returns (uint256) {
        require(duration > 0, "Duration must be greater than zero");
        require(totalAmount > 0, "Total amount must be greater than zero");

        uint256 flowRate = totalAmount / duration;
        require(flowRate > 0, "Flow rate cannot be zero");

        if (streamToken.balanceOf(sender) < totalAmount) {
            revert InsufficientBalance();
        }

        bool success = streamToken.transferFrom(sender, address(this), totalAmount);
        require(success, "Token transfer failed");

        _streamIdCounter++;
        uint256 streamId = _streamIdCounter;

        streams[streamId] = Stream({
            sender: sender,
            recipient: recipient,
            totalAmount: totalAmount,
            flowRate: flowRate,
            startTime: block.timestamp,
            stopTime: block.timestamp + duration,
            amountWithdrawn: 0,
            isActive: true
        });

        emit StreamCreated(streamId, sender, recipient, totalAmount);
        return streamId;
    }

    /**
     * @dev Calculates the amount of tokens a recipient can claim from a stream at the current time.
     */
    function claimableBalance(uint256 streamId) public view returns (uint256) {
        Stream storage stream = streams[streamId];
        if (!stream.isActive) {
            return 0;
        }

        uint256 timeElapsed = block.timestamp > stream.stopTime ? stream.stopTime - stream.startTime : block.timestamp - stream.startTime;
        uint256 totalEarned = timeElapsed * stream.flowRate;
        
        return totalEarned - stream.amountWithdrawn;
    }

    /**
     * @dev Allows the recipient to withdraw their claimable balance.
     */
    function claimFromStream(uint256 streamId) public {
        Stream storage stream = streams[streamId];

        if (msg.sender != stream.recipient) {
            revert NotStreamRecipient(streamId, msg.sender);
        }
        if (!stream.isActive) {
            revert StreamNotActive(streamId);
        }

        uint256 amountToClaim = claimableBalance(streamId);
        if (amountToClaim == 0) {
            return;
        }

        stream.amountWithdrawn += amountToClaim;

        bool success = streamToken.transfer(stream.recipient, amountToClaim);
        require(success, "Token transfer failed");

        emit ClaimedFromStream(streamId, stream.recipient, amountToClaim);
    }

    /**
     * @dev Cancels a stream and refunds the remaining balance to the sender and recipient.
     * Can be called by either the sender or the recipient.
     */
    function cancelStream(uint256 streamId) public {
        Stream storage stream = streams[streamId];

        if (msg.sender != stream.sender && msg.sender != stream.recipient) {
            revert NotSenderOrRecipient(streamId, msg.sender);
        }
        if (!stream.isActive) {
            revert StreamNotActive(streamId);
        }

        uint256 recipientBalance = claimableBalance(streamId);
        uint256 senderBalance = stream.totalAmount - stream.amountWithdrawn - recipientBalance;

        stream.isActive = false;

        if (recipientBalance > 0) {
            streamToken.transfer(stream.recipient, recipientBalance);
        }
        if (senderBalance > 0) {
            streamToken.transfer(stream.sender, senderBalance);
        }

        emit StreamCanceled(streamId, stream.sender, senderBalance, recipientBalance);
    }
}
