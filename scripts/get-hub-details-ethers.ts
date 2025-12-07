import hre from "hardhat";
import { ethers } from "ethers";

async function main() {
  console.log("Deploying contracts with pure ethers.js...");

  // 1. Get signer
  // hre.ethers is available when running with `npx hardhat run`
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // 2. Deploy MockERC20
  const ERC20Factory = await hre.ethers.getContractFactory("MockERC20");
  const erc20 = await ERC20Factory.connect(deployer).deploy("Test Token", "TST");
  await erc20.waitForDeployment();
  console.log(`MockERC20 deployed to: ${await erc20.getAddress()}`);

  // 3. Deploy TokenRegistry
  const TokenRegistryFactory = await hre.ethers.getContractFactory("TokenRegistry");
  const tokenRegistry = await TokenRegistryFactory.connect(deployer).deploy(deployer.address);
  await tokenRegistry.waitForDeployment();
  console.log(`TokenRegistry deployed to: ${await tokenRegistry.getAddress()}`);

  // 4. Deploy StreamingProtocol
  const StreamingProtocolFactory = await hre.ethers.getContractFactory("StreamingProtocol");
  const streamingProtocol = await StreamingProtocolFactory.connect(deployer).deploy(await erc20.getAddress(), deployer.address);
  await streamingProtocol.waitForDeployment();
  console.log(`StreamingProtocol deployed to: ${await streamingProtocol.getAddress()}`);
  
  // 5. Deploy RWAHub
  const RWAHubFactory = await hre.ethers.getContractFactory("RWAHub");
  const rwaHub = await RWAHubFactory.connect(deployer).deploy(await tokenRegistry.getAddress(), await streamingProtocol.getAddress(), deployer.address);
  await rwaHub.waitForDeployment();
  console.log(`RWAHub deployed to: ${await rwaHub.getAddress()}`);
  
  // 6. Transfer ownership to RWAHub
  await tokenRegistry.transferOwnership(await rwaHub.getAddress());
  await streamingProtocol.transferOwnership(await rwaHub.getAddress());
  console.log("Transferred ownership of TokenRegistry and StreamingProtocol to RWAHub.");

  console.log("\n--- Verification using ethers.js ---");

  // Call the view functions on the contract
  const tokenRegistryAddress = await rwaHub.tokenRegistry();
  const streamingProtocolAddress = await rwaHub.streamingProtocol();
  const ownerAddress = await rwaHub.owner();

  console.log(`RWAHub Owner (from ethers): ${ownerAddress}`);
  console.log(`TokenRegistry Address (from ethers): ${tokenRegistryAddress}`);
  console.log(`StreamingProtocol Address (from ethers): ${streamingProtocolAddress}`);

  const tokenRegistryAddr = await tokenRegistry.getAddress();
  const streamingProtocolAddr = await streamingProtocol.getAddress();

  if (
    tokenRegistryAddress.toLowerCase() === tokenRegistryAddr.toLowerCase() &&
    streamingProtocolAddress.toLowerCase() === streamingProtocolAddr.toLowerCase()
  ) {
    console.log("✅ Verification successful: Ethers.js correctly read the contract addresses.");
  } else {
    console.error("❌ Verification failed.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
