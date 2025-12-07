# Continuum: Real Estate RWA Yield-Streaming Protocol

This project showcases a Hardhat 3 Beta project using the native Node.js test runner (`node:test`) and the `viem` library for Ethereum interactions, specifically designed for **Real Estate Real-World Assets (RWAs)**.

To learn more about the Hardhat 3 Beta, please visit the [Getting Started guide](https://hardhat.org/docs/getting-started#getting-started-with-hardhat-3). To share your feedback, join our [Hardhat 3 Beta](https://hardhat.org/hardhat3-beta-telegram-group) Telegram group or [open an issue](https://github.com/NomicFoundation/hardhat/issues/new) in our GitHub issue tracker.

## Project Overview

Continuum is a decentralized finance (DeFi) protocol enabling the tokenization and yield-streaming of real estate assets. It provides a comprehensive framework for managing real estate RWAs on the blockchain, from registration and ownership via NFTs to continuous yield distribution through streaming payments.

Key features include:

- **Real Estate NFT Representation:** Each real estate asset is represented as a unique ERC721 NFT, providing clear digital ownership and transferability.
- **Yield Streaming:** Automated, per-second distribution of rental income or other real estate-derived yields to NFT holders using Superfluid Protocol.
- **Admin & Compliance Dashboards:** Tools for administrators to monitor asset status, manage compliance (simulated), and handle emergency actions like freezing streams.
- **Asset Explorer & Marketplace:** A frontend application for users to discover available real estate RWAs and manage their owned assets.

This example project specifically focuses on real estate and includes:

- A simple Hardhat configuration file.
- Foundry-compatible Solidity unit tests.
- TypeScript integration tests using [`node:test`](nodejs.org/api/test.html), the new Node.js native test runner, and [`viem`](https://viem.sh/).
- Examples demonstrating how to connect to different types of networks, including locally simulating OP mainnet.

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `node:test` tests:

```shell
npx hardhat test solidity
npx hardhat test nodejs
```

### Make a deployment to BNB Smart Chain (Testnet)

This project includes an example Ignition module to deploy the contract. You can deploy this module to a locally simulated chain or to BNB Smart Chain Testnet.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/DeployYieldStream.js
```

To run the deployment to BNB Smart Chain Testnet, you need an account with funds to send the transaction. The provided Hardhat configuration includes a Configuration Variable called `BSC_TESTNET_PRIVATE_KEY`, which you can use to set the private key of the account you want to use.

You can set the `BSC_TESTNET_PRIVATE_KEY` config variable using `hardhat-keystore`:

```shell
npx hardhat keystore set BSC_TESTNET_PRIVATE_KEY
```

After setting the variable, you can run the deployment with the BNB Smart Chain Testnet network:

```shell
npx hardhat ignition deploy --network bscTestnet ignition/modules/DeployYieldStream.js
```
