import { ethers } from "ethers";
import { createRequire } from "module";
const require = createRequire(import.meta.url);

const RWAHub = require("../artifacts/contracts/RWAHub.sol/RWAHub.json");
const TokenRegistry = require("../artifacts/contracts/TokenRegistry.sol/TokenRegistry.json");
const StreamingProtocol = require("../artifacts/contracts/StreamingProtocol.sol/StreamingProtocol.json");
const MockERC20 = require("../artifacts/contracts/MockERC20.sol/MockERC20.json");

async function main() {
  console.log("Deploying contracts with pure ethers.js to the localhost network...");

  // Connect to the local Hardhat node
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");

  // Use the first account from the node
  const deployer = await provider.getSigner(0);
  console.log("Deployment account:", await deployer.getAddress());

  // Deploy MockERC20
  const erc20Factory = new ethers.ContractFactory(MockERC20.abi, MockERC20.bytecode, deployer);
  const erc20 = await erc20Factory.deploy("Test Token", "TST");
  await erc20.waitForDeployment();
  const erc20Address = await erc20.getAddress();
  console.log(`MockERC20 deployed to: ${erc20Address}`);

  // Deploy TokenRegistry
  const tokenRegistryFactory = new ethers.ContractFactory(TokenRegistry.abi, TokenRegistry.bytecode, deployer);
  const tokenRegistry = await tokenRegistryFactory.deploy(deployer.address);
  await tokenRegistry.waitForDeployment();
  const tokenRegistryAddress = await tokenRegistry.getAddress();
  console.log(`TokenRegistry deployed to: ${tokenRegistryAddress}`);

  // Deploy StreamingProtocol
  const streamingProtocolFactory = new ethers.ContractFactory(StreamingProtocol.abi, StreamingProtocol.bytecode, deployer);
  const streamingProtocol = await streamingProtocolFactory.deploy(erc20Address, deployer.address);
  await streamingProtocol.waitForDeployment();
  const streamingProtocolAddress = await streamingProtocol.getAddress();
  console.log(`StreamingProtocol deployed to: ${streamingProtocolAddress}`);

  // Deploy RWAHub
  const rwaHubFactory = new ethers.ContractFactory(RWAHub.abi, RWAHub.bytecode, deployer);
  const rwaHub = await rwaHubFactory.deploy(tokenRegistryAddress, streamingProtocolAddress, deployer.address);
  await rwaHub.waitForDeployment();
  const rwaHubAddress = await rwaHub.getAddress();
  
  // Transfer ownership
  await tokenRegistry.transferOwnership(rwaHubAddress);
  await streamingProtocol.transferOwnership(rwaHubAddress);
  console.log("Ownership transferred to RWAHub.");

  console.log("\n--- Deployment Complete ---");
  console.log(`RWAHub deployed to: ${rwaHubAddress}`);
  console.log("\nNext steps:");
  console.log("1. Copy the RWAHub address above.");
  console.log("2. Paste it into the 'RWA_HUB_ADDRESS' variable in 'scripts/read-hub-standalone.ts'.");
  console.log("3. Run the standalone script with: ts-node scripts/read-hub-standalone.ts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
