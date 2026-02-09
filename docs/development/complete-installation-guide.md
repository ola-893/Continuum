# Installation Instructions - Continuum Protocol Tezos Migration

## Overview

This document provides step-by-step instructions to complete the development environment setup for the Continuum Protocol migration from Aptos to Tezos.

## What Has Been Set Up

✅ **Project Structure Created**:
- `tezos/` directory with contracts, tests, scripts, and config subdirectories
- Placeholder contract files for all 6 smart contracts
- Placeholder test files for property-based testing
- Deployment scripts for Ghostnet and Mainnet
- Network configuration files (ghostnet.json, mainnet.json)

✅ **Frontend Configuration**:
- Updated `package.json` with Taquito and Beacon SDK dependencies
- Created `tezos.ts` configuration file for network management
- Created `.env` and `.env.example` for environment variables
- Set up Ghostnet and Mainnet configurations

✅ **Documentation**:
- `SETUP_GUIDE.md` - Comprehensive setup guide
- `tezos/README.md` - Tezos-specific documentation
- `tezos/QUICK_START.md` - Quick reference for daily development
- `INSTALLATION_INSTRUCTIONS.md` - This file

✅ **Automation**:
- `setup.sh` - Automated setup script (executable)
- `.gitignore` - Configured for Tezos development

## Required Manual Steps

### 1. Install SmartPy CLI

SmartPy is required for smart contract development and testing.

```bash
# Install SmartPy CLI
bash <(curl -s https://smartpy.io/cli/install.sh)

# Verify installation
~/smartpy-cli/SmartPy.sh --version
```

**Expected Output**: `SmartPy CLI version X.X.X`

### 2. Install Frontend Dependencies

Install Taquito, Beacon SDK, and other frontend dependencies.

```bash
# Navigate to frontend directory
cd frontend

# Install all dependencies (including Taquito and Beacon SDK)
npm install

# Verify Taquito installation
npm list @taquito/taquito

# Verify Beacon SDK installation
npm list @taquito/beacon-wallet
```

**Expected Output**: Both packages should be listed with version numbers.

### 3. Get Ghostnet Test Tokens

For development and testing, you'll need test XTZ tokens.

**Steps**:
1. Install a Tezos wallet:
   - [Temple Wallet](https://templewallet.com/) (browser extension)
   - [Kukai Wallet](https://wallet.kukai.app/) (web wallet)

2. Create a new wallet and save your seed phrase securely

3. Get test tokens:
   - Visit: https://faucet.ghostnet.teztnets.xyz
   - Enter your Tezos address (starts with tz1, tz2, or tz3)
   - Request tokens (you'll receive ~100 XTZ)

4. Verify your balance:
   - Check in your wallet
   - Or visit: https://ghostnet.tzkt.io and search your address

### 4. Configure Environment Variables

Edit the `.env` file in the frontend directory:

```bash
# Edit frontend/.env
# Set network to ghostnet for development
VITE_TEZOS_NETWORK=ghostnet

# Contract addresses will be populated after deployment
# Leave empty for now
```

## Automated Setup (Alternative)

Instead of manual steps, you can run the automated setup script:

```bash
# From project root
./setup.sh
```

This script will:
- Check prerequisites (Node.js, Python)
- Install SmartPy CLI
- Install frontend dependencies
- Set up environment variables
- Verify the installation

## Verification Checklist

After completing the installation, verify everything is working:

```bash
# 1. Check SmartPy
~/smartpy-cli/SmartPy.sh --version
# Should output: SmartPy CLI version X.X.X

# 2. Check Node.js
node --version
# Should output: v18.x.x or higher

# 3. Check Python
python3 --version
# Should output: Python 3.8.x or higher

# 4. Check Taquito (from frontend directory)
cd frontend
npm list @taquito/taquito
# Should show @taquito/taquito@20.0.1 or similar

# 5. Check Beacon SDK
npm list @taquito/beacon-wallet
# Should show @taquito/beacon-wallet@20.0.1 or similar

# 6. Test SmartPy compilation
cd ..
~/smartpy-cli/SmartPy.sh compile tezos/contracts/streaming_protocol.py tezos/output/
# Should complete without errors
```

## Project Structure

After setup, your project should have this structure:

```
continuum-protocol/
├── tezos/                              # Tezos smart contracts
│   ├── contracts/                      # SmartPy contract files
│   │   ├── streaming_protocol.py
│   │   ├── asset_yield_protocol.py
│   │   ├── compliance_guard.py
│   │   ├── token_registry.py
│   │   ├── rwa_hub.py
│   │   └── fa2_token.py
│   ├── tests/                          # Contract tests
│   │   ├── test_streaming_protocol.py
│   │   ├── test_asset_yield_protocol.py
│   │   ├── test_compliance_guard.py
│   │   ├── test_token_registry.py
│   │   ├── test_rwa_hub.py
│   │   └── test_fa2_token.py
│   ├── scripts/                        # Deployment scripts
│   │   ├── deploy_ghostnet.py
│   │   ├── deploy_mainnet.py
│   │   └── verify_deployment.py
│   ├── config/                         # Network configurations
│   │   ├── ghostnet.json
│   │   └── mainnet.json
│   ├── README.md
│   └── QUICK_START.md
├── frontend/                           # React frontend
│   ├── src/
│   │   ├── config/
│   │   │   ├── tezos.ts               # Tezos network config
│   │   │   └── ...
│   │   └── ...
│   ├── .env                            # Environment variables
│   ├── .env.example
│   └── package.json                    # Includes Taquito & Beacon SDK
├── sources/                            # Original Aptos contracts
├── .gitignore                          # Updated for Tezos
├── setup.sh                            # Automated setup script
├── SETUP_GUIDE.md                      # Comprehensive guide
└── INSTALLATION_INSTRUCTIONS.md        # This file
```

## Network Information

### Ghostnet (Testnet)

- **Network ID**: NetXnHfVqm9iesp
- **RPC Endpoint**: https://ghostnet.ecadinfra.com
- **Block Explorer**: https://ghostnet.tzkt.io
- **Faucet**: https://faucet.ghostnet.teztnets.xyz

### Mainnet (Production)

- **Network ID**: NetXdQprcVkpaWU
- **RPC Endpoint**: https://mainnet.api.tez.ie
- **Block Explorer**: https://tzkt.io

## Next Steps

Once installation is complete:

1. **Review Documentation**:
   - Read `SETUP_GUIDE.md` for detailed information
   - Review `tezos/QUICK_START.md` for daily workflow
   - Check `.kiro/specs/aptos-to-tezos-migration/design.md` for architecture

2. **Start Development**:
   - Implement Task 2: Streaming Protocol Contract
   - Write property-based tests
   - Deploy to Ghostnet for testing

3. **Frontend Migration**:
   - Update wallet integration to use Beacon SDK
   - Replace Aptos SDK calls with Taquito
   - Test with Ghostnet contracts

## Troubleshooting

### SmartPy Installation Issues

If SmartPy installation fails:

```bash
# Try manual installation
mkdir -p ~/smartpy-cli
cd ~/smartpy-cli
curl -s https://smartpy.io/cli/install.sh | bash
```

### npm Install Errors

If npm install fails:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Permission Denied on setup.sh

If you get permission denied:

```bash
chmod +x setup.sh
./setup.sh
```

## Resources

- **SmartPy Documentation**: https://smartpy.io/docs/
- **Taquito Documentation**: https://tezostaquito.io/
- **Beacon SDK Documentation**: https://docs.walletbeacon.io/
- **FA2 Token Standard**: https://tzip.tezosagora.org/proposal/tzip-12/
- **Tezos Developer Portal**: https://tezos.com/developers/
- **Tezos Discord**: https://discord.gg/tezos

## Support

For issues or questions:

1. Check the troubleshooting sections in this document
2. Review `SETUP_GUIDE.md` for detailed solutions
3. Check the design document for architecture questions
4. Ask in Tezos community channels (Discord, Stack Exchange)

## Summary

This task has successfully set up:
- ✅ Tezos project structure with contracts, tests, and scripts
- ✅ Frontend configuration with Taquito and Beacon SDK
- ✅ Network configurations for Ghostnet and Mainnet
- ✅ Comprehensive documentation and guides
- ✅ Automated setup script

**Requirements Validated**: 15.5 (Deployment documentation), 15.6 (Frontend configuration)

You're now ready to begin implementing the smart contracts! 🚀
