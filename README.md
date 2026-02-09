# 🌐 Continuum Protocol

> **Tokenized Real-World Assets with Live Yield Streaming on Tezos**

📊 **[View Pitch Deck](https://www.canva.com/design/DAG5h9VH2_0/G-h4K2yC4yjSU-DoLZES-w/view?utm_content=DAG5h9VH2_0&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h0aae785077)**

## The Problem: The "Rich Asset, Poor Liquidity" Paradox

In the current Real World Asset (RWA) market, asset ownership is static while financial needs are dynamic.

- **The Liquidity Trap**: An asset owner (e.g., a landlord) might own a property worth $1M generating $5,000/month, but they cannot access that future income today to pay for immediate expenses (like a roof repair) without taking out a high-interest bank loan with weeks of paperwork.
- **The "Decoupling" Risk**: When a tokenized asset is sold on a secondary market (like an NFT marketplace), the income stream often fails to move with it automatically. This creates a chaotic scenario where the old owner keeps receiving rent that belongs to the new owner, requiring manual reconciliation.
- **Compliance Friction**: RWA protocols struggle to enforce real-time regulatory checks (KYC/AML) at the exact moment of income withdrawal, exposing issuers to regulatory fines if funds stream to a sanctioned wallet.

## The Solution: Continuum - The Solvency-Aware RWA Protocol

Continuum is a compliant, object-oriented streaming protocol on Tezos that turns static assets into liquid, programmable cash flow.

### 1. Instant Liquidity via "Flash Advance" (The Innovation)

**How it works**: We utilise the deterministic nature of money streaming to allow asset owners to "borrow" from their own future.

**The Fix**: Instead of waiting 30 days for rent, a landlord can trigger a Flash Advance to withdraw 3 months of future income instantly. The smart contract mathematically guarantees solvency by "pausing" their future withdrawals until time catches up to the debt. No banks, no interest, just time-travelling liquidity.

### 2. True Asset-Yield Coupling (The Architecture)

**How it works**: By leveraging Tezos smart contracts, we bind the income stream directly to the NFT, not a user address.

**The Fix**: If Alice sells her Real Estate NFT to Bob on a marketplace, the stream instantly redirects the very next second of yield to Bob. There is no manual transfer required; the yield follows the asset, ensuring 100% fair distribution during secondary sales.

### 3. The "Compliance Guard" Layer (The Safety)

**How it works**: A modular governance wrapper that intercepts every withdrawal request.

**The Fix**: Before a single USDC leaves the contract, the system verifies the recipient’s on-chain Identity (DID). If a user's KYC has expired or they are sanctioned, the stream automatically freezes, protecting the issuer from regulatory liability.

Continuum is a next-generation RWA (Real World Asset) protocol built on Aptos that enables tokenisation of real-world assets with continuous yield distribution through on-chain streaming.

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

## 🌐 Deployed Contracts (Tezos Mainnet)

**Network**: Tezos Mainnet  
**Explorer**: https://tzkt.io

### Live Contracts

| Contract | Address | Explorer |
|----------|---------|----------|
| **RWA Hub** | `KT1...` | [View on TzKT](https://tzkt.io/) |
| **Asset Yield Protocol** | `KT1...` | [View on TzKT](https://tzkt.io/) |
| **Streaming Protocol** | `KT1...` | [View on TzKT](https://tzkt.io/) |
| **Compliance Guard** | `KT1...` | [View on TzKT](https://tzkt.io/) |
| **Token Registry** | `KT1...` | [View on TzKT](https://tzkt.io/) |

### Test with Faucet

Get testnet XTZ tokens: [Tezos Faucet](https://faucet.ghostnet.teztnets.xyz)

---

## 💡 Usage

### For Users

1. **Connect Wallet** - Use Temple, Kukai, or Umami
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
    COMPLIANCE: "compliance_guard",
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

## 📖 Documentation

All documentation has been consolidated into the `docs/` folder. See the [Documentation Index](./DOCUMENTATION_INDEX.md) for a complete guide.

**Quick Links:**
- [User Guide](./docs/user-guide-getting-started.md) - How to use the protocol
- [API Reference](./docs/api-reference.md) - Complete API documentation
- [Deployment Guide](./docs/deployment/how-to-deploy-step-by-step.md) - Deploy contracts and frontend
- [Troubleshooting](./docs/troubleshooting-common-issues.md) - Common issues and solutions

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

## 📞 Support
- **Website**: https://continuumprotocol.io
- **CodeBase**: https://github.com/ola-893/Continuum
- **Socials**: https://www.linkedin.com/in/olaoluwa-marvellous/
---

**Built with ❤️ on Tezos**
