# Quick Start Guide - Tezos Development

## Installation (One-Time Setup)

```bash
# Run automated setup script from project root
./setup.sh

# Or manually install SmartPy
bash <(curl -s https://smartpy.io/cli/install.sh)

# Install frontend dependencies
cd frontend && npm install
```

## Daily Development Workflow

### 1. Compile Contracts

```bash
# Compile a single contract
~/smartpy-cli/SmartPy.sh compile tezos/contracts/streaming_protocol.py tezos/output/

# Compile all contracts
for contract in tezos/contracts/*.py; do
  ~/smartpy-cli/SmartPy.sh compile "$contract" tezos/output/
done
```

### 2. Run Tests

```bash
# Run tests for a specific contract
~/smartpy-cli/SmartPy.sh test tezos/tests/test_streaming_protocol.py tezos/output/

# Run all tests
for test in tezos/tests/*.py; do
  ~/smartpy-cli/SmartPy.sh test "$test" tezos/output/
done
```

### 3. Deploy to Ghostnet

```bash
# Deploy all contracts
~/smartpy-cli/SmartPy.sh run tezos/scripts/deploy_ghostnet.py

# Verify deployment
python3 tezos/scripts/verify_deployment.py --network ghostnet
```

### 4. Run Frontend

```bash
cd frontend
npm run dev
# Open http://localhost:5173
```

## Common Commands

### SmartPy

```bash
# Show help
~/smartpy-cli/SmartPy.sh --help

# Compile with output
~/smartpy-cli/SmartPy.sh compile <contract.py> <output_dir>

# Run tests
~/smartpy-cli/SmartPy.sh test <test.py> <output_dir>

# Run script
~/smartpy-cli/SmartPy.sh run <script.py>
```

### Frontend

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Network Configuration

### Ghostnet (Testnet)

- **RPC**: https://ghostnet.ecadinfra.com
- **Explorer**: https://ghostnet.tzkt.io
- **Faucet**: https://faucet.ghostnet.teztnets.xyz

### Mainnet (Production)

- **RPC**: https://mainnet.api.tez.ie
- **Explorer**: https://tzkt.io

## Environment Variables

Edit `frontend/.env`:

```bash
# Set network (ghostnet or mainnet)
VITE_TEZOS_NETWORK=ghostnet

# Contract addresses (populated after deployment)
VITE_GHOSTNET_STREAMING_PROTOCOL=KT1...
VITE_GHOSTNET_ASSET_YIELD_PROTOCOL=KT1...
# ... etc
```

## Troubleshooting

### SmartPy not found

```bash
# Add to PATH
echo 'export PATH="$HOME/smartpy-cli:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Frontend build errors

```bash
# Clear cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### Wallet connection issues

1. Ensure wallet extension is installed (Temple/Kukai)
2. Check you're on correct network (Ghostnet/Mainnet)
3. Clear browser cache
4. Try different browser

## Resources

- **SmartPy Docs**: https://smartpy.io/docs/
- **Taquito Docs**: https://tezostaquito.io/
- **FA2 Standard**: https://tzip.tezosagora.org/proposal/tzip-12/
- **Tezos Discord**: https://discord.gg/tezos

## Project Structure

```
tezos/
├── contracts/          # SmartPy contracts (.py)
├── tests/             # Test files (.py)
├── scripts/           # Deployment scripts
├── config/            # Network configs (.json)
└── output/            # Compilation output (gitignored)
```

## Next Steps

1. ✅ Environment setup complete
2. 📝 Implement streaming protocol contract
3. 🧪 Write property-based tests
4. 🚀 Deploy to Ghostnet
5. 🎨 Migrate frontend to Taquito
6. 🔄 Test end-to-end flows

Happy coding! 🎉
