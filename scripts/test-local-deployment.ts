import { task } from "hardhat/config";
import { parseGwei } from "viem";

task("test-local-deployment", "Deploys and verifies the contracts on a local network")
  .setAction(async (taskArgs, hre) => {
    console.log("Starting local deployment test...");

    // 1. Get a signer
    const [owner] = await hre.viem.getWalletClients();
    console.log(`Deploying with account: ${owner.account.address}`);

    // 2. Deploy a MockERC20 token to use as the stream token
    console.log("\nDeploying MockERC20 token...");
    const mockERC20 = await hre.viem.deployContract("MockERC20", [
      "Mock Stream Token",
      "MST",
      18,
      parseGwei("1000000"), // Initial supply
    ]);
    console.log(`MockERC20 deployed to: ${mockERC20.address}`);

    // 3. Deploy the main contracts using the Ignition module
    console.log("\nDeploying contracts via Ignition module 'DeployYieldStream.js'...");
    const { rwaHub } = await hre.ignition.deploy(
      "ignition/modules/DeployYieldStream.js",
      {
        parameters: {
          YieldStreamModule: {
            streamTokenAddress: mockERC20.address,
          },
        },
      }
    );

    console.log(`RWAHub deployed to: ${rwaHub.address}`);

    // 4. Verify the deployment by reading a value from the RWAHub contract
    console.log("\nVerifying deployment...");
    const tokenRegistryAddress = await rwaHub.read.tokenRegistry();
    const streamingProtocolAddress = await rwaHub.read.streamingProtocol();

    if (tokenRegistryAddress && streamingProtocolAddress) {
      console.log("✅ Verification successful!");
      console.log(`   - RWAHub is linked to TokenRegistry at: ${tokenRegistryAddress}`);
      console.log(`   - RWAHub is linked to StreamingProtocol at: ${streamingProtocolAddress}`);
    } else {
      console.error("❌ Verification failed. Contract addresses are not set correctly.");
    }

    console.log("\nLocal deployment test finished.");
  });
