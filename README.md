# 🌐 Continuum Protocol

> **Tokenized Real-World Assets with Live Yield Streaming on Aptos**

Continuum is a next-generation RWA (Real World Asset) protocol built on Aptos that enables tokenization of real-world assets with continuous yield distribution through on-chain streaming.

---

## 🎯 What is Continuum?

Continuum allows you to:
- **Tokenize Real Assets** - Turn real estate, vehicles, and commodities into NFTs
- **Stream Yields** - Distribute returns continuously, not just at intervals  
- **Maintain Compliance** - KYC/AML checks built into the protocol
- **Admin Control** - Emergency freeze and compliance management tools

---

## 🏗️ Architecture

### Smart Contracts (`sources/`)

| Contract | Purpose |
|----------|---------|
| **`rwa_hub.move`** | Main orchestrator - manages RWA registration and stream creation |
| **`asset_yield_protocol.move`** | Links NFTs to yield streams and track ownership |
| **`streaming_protocol.move`** | Core streaming logic - handles time-based yield distribution |
| **`compliance_guard.move`** | KYC/AML enforcement and user whitelisting |
| **`token_registry.move`** | Global registry of all minted assets for discovery |

### Frontend (`frontend/`)

A premium React + Vite app with:
- **User Dashboard** - Track assets and claim yields
- **Admin Command Center** - Mint assets, manage KYC, emergency controls
- **Live Balance Updates** - Real-time ticking yield display
- **Public Streams Gallery** - Explore all minted RWAs

---

## 🚀 Quick Start

### Prerequisites
- [Aptos CLI](https://aptos.dev/cli-tools/aptos-cli-tool/install-aptos-cli)
- [Node.js 18+](https://nodejs.org/)
- An Aptos wallet (Petra, Martian, or Pontem)

### 1. Deploy Smart Contracts

```bash
# Compile contracts
aptos move compile

# Deploy to testnet
./deploy.sh
```

The deployment script will:
1. Publish all contracts
2. Set up admin privileges
3. Initialize the ecosystem  
4. Initialize the token registry

### 2. Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:5173`

---

## 🌐 Deployed Contracts (Aptos Testnet)

**Network**: Aptos Testnet  
**Module Address**: `0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b`

### Live Contracts

| Module | Address | Explorer |
|--------|---------|----------|
| **RWA Hub** | `0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b::rwa_hub` | [View on Explorer](https://explorer.aptoslabs.com/account/0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b/modules/code/rwa_hub?network=testnet) |
| **Asset Yield Protocol** | `0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b::asset_yield_protocol` | [View on Explorer](https://explorer.aptoslabs.com/account/0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b/modules/code/asset_yield_protocol?network=testnet) |
| **Streaming Protocol** | `0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b::streaming_protocol` | [View on Explorer](https://explorer.aptoslabs.com/account/0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b/modules/code/streaming_protocol?network=testnet) |
| **Compliance Guard** | `0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b::compliance_guard` | [View on Explorer](https://explorer.aptoslabs.com/account/0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b/modules/code/compliance_guard?network=testnet) |
| **Token Registry** | `0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b::token_registry` | [View on Explorer](https://explorer.aptoslabs.com/account/0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b/modules/code/token_registry?network=testnet) |

### Test with Faucet

Get testnet APT tokens: [Aptos Faucet](https://aptoslabs.com/testnet-faucet)

---

## 💡 Usage

### For Users

1. **Connect Wallet** - Use Petra, Martian, or Pontem
2. **Get Whitelisted** - Admin must approve your KYC
3. **Add Assets** - Paste token addresses to track your RWAs
4. **Claim Yields** - Collect streaming returns anytime
5. **Flash Advance** - Borrow against future yields

### For Admins

Access the admin dashboard at `/admin`:

- **🗺️ God View** - Live map of all assets and system metrics
- **🏭 Asset Factory** - Mint NFTs and create yield streams
- **✅ Compliance Desk** - Approve/reject KYC requests
- **🚨 Fleet Control** - Emergency freeze and asset management

---

## 📊 Asset Types

| Type | ID | Examples |
|------|-----|----------|
| Real Estate | `0` | Properties, land, buildings |
| Vehicles | `1` | Cars, trucks, fleets |
| Commodities | `2` | Heavy machinery, equipment |

---

## 🔧 Configuration

Update contract address in `frontend/src/config/contracts.ts`:

```typescript
export const CONTRACT_CONFIG = {
  MODULE_ADDRESS: "0x7c68c08ed30efcb9159b90c398247bf6504ab11678b39e58db12cae2360c9dc3",
  MODULES: {
    RWA_HUB: "rwa_hub",
    ASSET_YIELD: "asset_yield_protocol",
    STREAMING: "streaming_protocol",
    COMPLIANCE: "complaince_guard",
  },
  // ...
};
```

---

## 🛠️ Development

### Project Structure

```
continuum/
├── sources/              # Move smart contracts
│   ├── rwa_hub.move
│   ├── asset_yield_protocol.move
│   ├── streaming_protocol.move
│   ├── compliance_guard.move
│   └── token_registry.move
├── frontend/             # React app
│   ├── src/
│   │   ├── services/     # Blockchain integration
│   │   ├── hooks/        # React hooks for real-time data
│   │   ├── pages/        # Dashboard and Admin pages
│   │   └── components/   # UI components
│   └── package.json
├── Move.toml             # Move package config
└── deploy.sh             # Deployment script
```

### Key Frontend Services

- **`continuumService.ts`** - All smart contract interactions
- **`useAssetStream.ts`** - Real-time yield tracking
- **`useAssetList.ts`** - Multi-asset portfolio management
- **`nftMintingService.ts`** - NFT creation helpers

---

## 🧪 Testing

```bash
# Test smart contracts
aptos move test

# Test frontend
cd frontend
npm run build
```

---

## 📖 Key Concepts

### Yield Streaming

Instead of monthly/quarterly distributions, yields flow continuously:

```
Claimable = (flow_rate * seconds_elapsed) - amount_withdrawn
```

Users can claim anytime, seeing their balance tick up in real-time.

### Flash Advance

Borrow against future yields:
- Request advance amount
- Stream pauses for calculated duration
- Resume after pause expires

### Compliance Layer

All interactions check KYC status:
- Users must be whitelisted
- Jurisdiction restrictions enforced  
- Admin can freeze assets instantly

---

## 🔐 Security

- **Emergency Freeze** - Admins can halt specific assets
- **Compliance Checks** - Every transfer validates KYC status
- **Ownership Verification** - NFT ownership checked on-chain
- **Time-Lock Mechanisms** - Flash advances pause streams

---

## 📜 License

MIT License - See LICENSE file

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📞 Support

- **Documentation**: [Coming Soon]
- **Discord**: [Coming Soon]
- **Twitter**: [Coming Soon]

---

**Built with ❤️ on Aptos**
