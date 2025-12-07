import { ethers } from "ethers";

// --- Configuration ---
// This is the address of the RWAHub contract after you deploy it.
// You will need to run `npx hardhat run scripts/deploy-for-standalone.ts --network localhost` first,
// and then copy the resulting RWAHub address here.
const RWA_HUB_ADDRESS = "YOUR_DEPLOYED_RWAHUB_ADDRESS_HERE"; 

// --- Main Script ---
async function main() {
  if (RWA_HUB_ADDRESS === "YOUR_DEPLOYED_RWAHUB_ADDRESS_HERE") {
    console.error("Please update the RWA_HUB_ADDRESS in the script before running.");
    process.exit(1);
  }

  console.log(`Connecting to local Hardhat node and reading from RWAHub at ${RWA_HUB_ADDRESS}...`);

  // Connect to the local Hardhat node's JSON-RPC server
  const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/");

  // We need the ABI of the RWAHub to interact with it.
  // This is a simplified ABI containing only the functions we need.
  const rwaHubAbi = [
    "function owner() view returns (address)",
    "function tokenRegistry() view returns (address)",
    "function streamingProtocol() view returns (address)"
  ];

  // Create an ethers Contract instance
  const rwaHub = new ethers.Contract(RWA_HUB_ADDRESS, rwaHubAbi, provider);

  try {
    // Call the view functions
    const owner = await rwaHub.owner();
    const tokenRegistry = await rwaHub.tokenRegistry();
    const streamingProtocol = await rwaHub.streamingProtocol();

    console.log("\n--- RWAHub Details ---");
    console.log(`Owner: ${owner}`);
    console.log(`TokenRegistry: ${tokenRegistry}`);
    console.log(`StreamingProtocol: ${streamingProtocol}`);
    console.log("\n✅ Successfully read data from the contract.");

  } catch (error: any) {
    if (error.code === 'CALL_EXCEPTION') {
      console.error(
        `\n❌ Error: Could not read from the contract. This might be because:\n` +
        `   1. The RWA_HUB_ADDRESS ('${RWA_HUB_ADDRESS}') is incorrect.\n` +
        `   2. The contracts are not deployed on the network you're connected to.\n` +
        `   3. The local Hardhat node is not running.`
      );
    } else {
      console.error("\nAn unexpected error occurred:");
      console.error(error);
    }
    process.exit(1);
  }
}

main();
