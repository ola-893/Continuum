const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("YieldStreamModule", (m) => {
  // Define deployment parameters
  const streamTokenAddress = m.getParameter(
    "streamTokenAddress",
    "0x55d398326f99059fF775485246999027B3197955" // BUSD on BSC mainnet, replace for testnet
  );
  const initialOwner = m.getAccount(0);

  // 1. Deploy the PropertyRegistry contract
  const propertyRegistry = m.contract("PropertyRegistry", [initialOwner]);

  // 2. Deploy the StreamingProtocol contract
  const streamingProtocol = m.contract("StreamingProtocol", [
    streamTokenAddress,
    initialOwner,
  ]);

  // 3. Deploy the RWAHub, linking the other two contracts
  const rwaHub = m.contract("RWAHub", [
    propertyRegistry,
    streamingProtocol,
    initialOwner,
  ]);

  // 4. After deployment, transfer ownership of the sub-contracts to the RWAHub
  m.call(propertyRegistry, "transferOwnership", [rwaHub]);
  m.call(streamingProtocol, "transferOwnership", [rwaHub]);

  return { propertyRegistry, streamingProtocol, rwaHub };
});
