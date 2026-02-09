# Continuum Protocol - Tezos Migration Setup Guide

This guide walks you through setting up the development environment for the Continuum Protocol migration from Aptos to Tezos.

## Prerequisites

- **Operating System**: macOS, Linux, or Windows (with WSL)
- **Node.js**: v18 or higher
- **Python**: v3.8 or higher (for SmartPy)
- **Git**: For version control

## Step 1: Install SmartPy CLI

SmartPy is the smart contract development framework for Tezos.

### Installation

```bash
# Download and install SmartPy CLI
bash <(curl -s https://smartpy.io/cli/install.sh)

# Verify installation
~/smartpy-cli/SmartPy.sh --version
```

### Add to PATH (Optional)

For easier access, add SmartPy to your PATH:

```bash
# Add to ~/.zshrc or ~/.bashrc
echo 'export PATH="$HOME/smartpy-cli:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Now you can use SmartPy.sh directly
SmartPy.sh --version
```

## Step 2: Install Frontend Dependencies

The frontend uses Taquito and Beacon SDK for Tezos integration.

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (includes Taquito and Beacon SDK)
npm install

# Verify installation
npm list @taquito/taquito @taquito/beacon-wallet
```

## Step 3: Configure Environment Variables

Set up environment variables for network configuration:

```bash
# Copy example environment file
cp .env.example .env

# Edit .env to set your network preference
# VITE_TEZOS_NETWORK=ghostnet  (for development)
# VITE_TEZOS_NETWORK=mainnet   (for production)
```

## Step 4: Get Ghostnet Test Tokens

For development and testing on Ghostnet:

1. **Create a Tezos Wallet**:
   - Install [Temple Wallet](https://templewallet.com/) browser extension
   - Or use [Kukai Wallet](https://wallet.kukai.app/)
   - Create a new wallet and save your seed phrase securely

2. **Get Test XTZ**:
   - Visit the [Ghostnet Faucet](https://faucet.ghostnet.teztnets.xyz)
   - Enter your Tezos address (starts with tz1, tz2, or tz3)
   - Request test tokens (you'll receive ~100 XTZ)

3. **Verify Balance**:
   - Check your balance in your wallet
   - Or visit [Ghostnet Explorer](https://ghostnet.tzkt.io) and search your address

## Step 5: Verify Setup

Run verification checks to ensure everything is installed correctly:

### Check SmartPy

```bash
~/smartpy-cli/SmartPy.sh --version
# Expected output: SmartPy CLI version X.X.X
```

### Check Node.js and Dependencies

```bash
node --version
# Expected: v18.x.x or higher

cd frontend
npm list @taquito/taquito
# Should show @taquito/taquito@20.0.1 or similar
```

### Test SmartPy Compilation

```bash
# Try compiling a sample contract
cd tezos
~/smartpy-cli/SmartPy.sh compile contracts/streaming_protocol.py output/
# Should complete without errors (even if contract is empty)
```

## Step 6: Project Structure Overview

After setup, your project structure should look like:

```
continuum-protocol/
├── tezos/                          # Tezos smart contracts
│   ├── contracts/                  # SmartPy contract files
│   ├── tests/                      # Contract tests
│   ├── scripts/                    # Deployment scripts
│   ├── config/                     # Network configurations
│   └── README.md
├── frontend/                       # React frontend
│   ├── src/
│   │   ├── config/
│   │   │   └── tezos.ts           # Tezos network config
│   │   └── ...
│   ├── .env                        # Environment variables
│   └── package.json                # Now includes Taquito
├── sources/                        # Original Aptos contracts
└── SETUP_GUIDE.md                 # This file
```

## Step 7: Next Steps

Now that your environment is set up, you can proceed with development:

1. **Implement Smart Contracts**: Start with Task 2 (Streaming Protocol)
2. **Write Tests**: Implement property-based and unit tests
3. **Deploy to Ghostnet**: Use deployment scripts
4. **Migrate Frontend**: Update React components to use Taquito
5. **Test End-to-End**: Verify complete user flows

## Common Issues and Solutions

### SmartPy Installation Fails

**Issue**: Installation script fails or SmartPy.sh not found

**Solution**:
```bash
# Try manual installation
mkdir -p ~/smartpy-cli
cd ~/smartpy-cli
curl -s https://smartpy.io/cli/install.sh | bash
```

### Node Module Installation Errors

**Issue**: npm install fails with dependency conflicts

**Solution**:
```bash
# Clear npm cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Wallet Connection Issues

**Issue**: Cannot connect Temple or Kukai wallet

**Solution**:
- Ensure wallet extension is installed and unlocked
- Check that you're on the correct network (Ghostnet vs Mainnet)
- Clear browser cache and reload page
- Try a different browser

### Ghostnet Faucet Not Working

**Issue**: Faucet doesn't send test tokens

**Solution**:
- Wait a few minutes and try again (rate limited)
- Try alternative faucet: https://teztnets.xyz/ghostnet-faucet
- Ask in Tezos Discord for test tokens

## Resources

### Documentation
- [SmartPy Documentation](https://smartpy.io/docs/)
- [Taquito Documentation](https://tezostaquito.io/)
- [Beacon SDK Documentation](https://docs.walletbeacon.io/)
- [FA2 Token Standard](https://tzip.tezosagora.org/proposal/tzip-12/)

### Tools
- [Ghostnet Explorer](https://ghostnet.tzkt.io)
- [Mainnet Explorer](https://tzkt.io)
- [Better Call Dev](https://better-call.dev/) - Contract explorer
- [SmartPy IDE](https://smartpy.io/ide) - Online IDE

### Community
- [Tezos Discord](https://discord.gg/tezos)
- [Tezos Stack Exchange](https://tezos.stackexchange.com/)
- [Tezos Agora](https://forum.tezosagora.org/)

## Support

If you encounter issues not covered in this guide:

1. Check the troubleshooting section in `tezos/README.md`
2. Review the design document at `.kiro/specs/aptos-to-tezos-migration/design.md`
3. Check the requirements at `.kiro/specs/aptos-to-tezos-migration/requirements.md`
4. Search existing issues in the project repository
5. Ask in the Tezos community channels

## Verification Checklist

Before proceeding with development, verify:

- [ ] SmartPy CLI installed and accessible
- [ ] Node.js v18+ installed
- [ ] Frontend dependencies installed (Taquito, Beacon SDK)
- [ ] Environment variables configured
- [ ] Tezos wallet created (Temple or Kukai)
- [ ] Ghostnet test tokens obtained
- [ ] Project structure matches expected layout
- [ ] Can compile sample SmartPy contract
- [ ] Can run frontend dev server

Once all items are checked, you're ready to begin implementation! 🚀
