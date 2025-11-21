# YieldStream Frontend

This is the frontend application for the YieldStream RWA (Real World Assets) Protocol built on Aptos.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Configuration

Update the network configuration in `src/config/constants.ts`:
- Change `NETWORK` to "mainnet", "testnet", or "devnet"
- Update registry addresses after deploying your contracts

## Features

### Ecosystem Initialization
Initialize the StreamRegistry, AssetYieldRegistry, and ComplianceRegistry (one-time setup).

### Compliance Management
- Register user identities (KYC)
- Whitelist addresses for specific asset types

### Stream Management
- Create real estate yield streams
- Claim accumulated yield
- Request flash advances against future yield

### View Functions
Query blockchain data:
- Stream information
- Asset registration status
- User compliance status
- Claimable balances

## Usage

1. Connect your Aptos wallet (Petra, Martian, or Pontem)
2. Initialize the ecosystem (if deploying for the first time)
3. Register and whitelist users for compliance
4. Create streams attached to NFT/Token Objects
5. Claim yield or request flash advances

## Notes

- All amounts are in octas (1 APT = 100,000,000 octas)
- Registry addresses are typically the deployer's address
- You need a real NFT/Token Object address to create streams
- Ensure proper KYC and whitelisting before transactions
