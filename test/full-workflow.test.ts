import { expect } from "chai";
import hre from "hardhat";
import { describe, it } from "mocha";
import { parseEther, decodeEventLog } from "viem";

describe("RWAHub Full Workflow", function () {
  let deployer, sender, recipient, publicClient;
  let erc20, tokenRegistry, streamingProtocol, rwaHub;

  beforeEach(async function () {
    [deployer, sender, recipient] = await hre.viem.getWalletClients();
    publicClient = await hre.viem.getPublicClient();

    erc20 = await hre.viem.deployContract("MockERC20", ["Test Token", "TST"]);
    tokenRegistry = await hre.viem.deployContract("TokenRegistry", [deployer.account.address]);
    streamingProtocol = await hre.viem.deployContract("StreamingProtocol", [erc20.address, deployer.account.address]);
    rwaHub = await hre.viem.deployContract("RWAHub", [tokenRegistry.address, streamingProtocol.address, deployer.account.address]);

    await tokenRegistry.write.transferOwnership([rwaHub.address]);
    await streamingProtocol.write.transferOwnership([rwaHub.address]);

    const streamAmount = parseEther("100");
    await erc20.write.mint([sender.account.address, streamAmount]);
    const senderErc20 = await hre.viem.getContractAt("MockERC20", erc20.address, { walletClient: sender });
    await senderErc20.write.approve([streamingProtocol.address, streamAmount]);
  });

  it("should handle the full lifecycle: create, claim, and cancel a stream", async function () {
    const streamAmount = parseEther("100");
    const duration = 30 * 24 * 60 * 60; // 30 days
    const senderRwaHub = await hre.viem.getContractAt("RWAHub", rwaHub.address, { walletClient: sender });
    
    const txHash = await senderRwaHub.write.createCompliantRWAStream([
      recipient.account.address,
      0,
      "ipfs://your-metadata-hash",
      streamAmount,
      duration
    ]);
    
    const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
    const { abi } = await hre.viem.getContractAt("RWAHub", rwaHub.address);
    const eventLog = receipt.logs.find(log => log.address.toLowerCase() === rwaHub.address.toLowerCase());
    const decodedEvent = decodeEventLog({ ...eventLog, abi });
    const { streamId } = decodedEvent.args;

    expect(streamId).to.be.a('bigint').and.to.be.above(0);

    await publicClient.send({ method: 'evm_increaseTime', params: [5 * 24 * 60 * 60] }); // 5 days
    await publicClient.send({ method: 'evm_mine', params: [] });

    const recipientStreamingProtocol = await hre.viem.getContractAt("StreamingProtocol", streamingProtocol.address, { walletClient: recipient });
    const initialClaimable = await recipientStreamingProtocol.read.claimableBalance([streamId]);
    expect(initialClaimable).to.be.above(0);

    const balanceBeforeClaim = await erc20.read.balanceOf([recipient.account.address]);
    await recipientStreamingProtocol.write.claimFromStream([streamId]);
    const balanceAfterClaim = await erc20.read.balanceOf([recipient.account.address]);
    expect(balanceAfterClaim).to.be.above(balanceBeforeClaim);
    
    const senderStreamingProtocol = await hre.viem.getContractAt("StreamingProtocol", streamingProtocol.address, { walletClient: sender });
    await senderStreamingProtocol.write.cancelStream([streamId]);
    
    const streamDetails = await streamingProtocol.read.streams([streamId]);
    const isActive = streamDetails[7];
    expect(isActive).to.be.false;
  });
});
