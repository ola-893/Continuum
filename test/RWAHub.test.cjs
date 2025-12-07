const { expect } = require("chai");

describe("RWAHub Contract", function () {
  let rwaHub, tokenRegistry, streamingProtocol, mockERC20, owner, user;

  beforeEach(async function () {
    [owner, user] = await hre.viem.getWalletClients();

    tokenRegistry = await hre.viem.deployContract("TokenRegistry", [owner.account.address]);
    mockERC20 = await hre.viem.deployContract("MockERC20", ["Mock Stream Token", "MST"]);
    streamingProtocol = await hre.viem.deployContract("StreamingProtocol", [mockERC20.address, owner.account.address]);
    rwaHub = await hre.viem.deployContract("RWAHub", [tokenRegistry.address, streamingProtocol.address, owner.account.address]);

    // Transfer ownership of the child contracts to the RWAHub
    await tokenRegistry.write.transferOwnership([rwaHub.address]);
    await streamingProtocol.write.transferOwnership([rwaHub.address]);
  });

  describe("Deployment and Ownership", function () {
    it("Should set the correct owner", async function () {
      const contractOwner = await rwaHub.read.owner();
      expect(contractOwner.toLowerCase()).to.equal(owner.account.address);
    });

    it("Should hold ownership of TokenRegistry and StreamingProtocol", async function () {
      const registryOwner = await tokenRegistry.read.owner();
      const protocolOwner = await streamingProtocol.read.owner();

      expect(registryOwner.toLowerCase()).to.equal(rwaHub.address);
      expect(protocolOwner.toLowerCase()).to.equal(rwaHub.address);
    });
  });

  describe("Access Control", function () {
    it("Should revert if a non-owner tries to create an RWA stream", async function () {
        const userRwaHub = await hre.viem.getContractAt("RWAHub", rwaHub.address, { walletClient: user });

        await expect(
            userRwaHub.write.createCompliantRWAStream([
                user.account.address,
                0, // Asset Type: Real Estate
                "ipfs://test-hash",
                1000n, // Total Yield
                3600n  // Duration in seconds
            ])
        ).to.be.rejectedWith("Ownable: caller is not the owner");
    });
  });
});
