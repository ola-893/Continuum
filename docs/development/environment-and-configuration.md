# Environment Configuration Guide

This guide explains how to configure the Continuum Protocol frontend for different environments (development, staging, production).

## Overview

The frontend uses Vite's environment variable system to manage configuration across different deployment environments. Environment variables are prefixed with `VITE_` to be accessible in the browser.

## Environment Files

The project includes several environment files:

- `.env` - Default configuration (not committed to git)
- `.env.example` - Template with all available variables
- `.env.development` - Development-specific configuration
- `.env.staging` - Staging environment configuration
- `.env.production` - Production environment configuration

## Available Environment Variables

### Network Configuration

```bash
# Network selection: 'ghostnet' for testnet, 'mainnet' for production
VITE_TEZOS_NETWORK=ghostnet
```

### Ghostnet Contract Addresses

```bash
VITE_GHOSTNET_STREAMING_PROTOCOL=KT1...
VITE_GHOSTNET_ASSET_YIELD_PROTOCOL=KT1...
VITE_GHOSTNET_COMPLIANCE_GUARD=KT1...
VITE_GHOSTNET_TOKEN_REGISTRY=KT1...
VITE_GHOSTNET_RWA_HUB=KT1...
VITE_GHOSTNET_FA2_TOKEN=KT1...
```

### Mainnet Contract Addresses

```bash
VITE_MAINNET_STREAMING_PROTOCOL=KT1...
VITE_MAINNET_ASSET_YIELD_PROTOCOL=KT1...
VITE_MAINNET_COMPLIANCE_GUARD=KT1...
VITE_MAINNET_TOKEN_REGISTRY=KT1...
VITE_MAINNET_RWA_HUB=KT1...
VITE_MAINNET_FA2_TOKEN=KT1...
```

### Optional: Custom RPC Endpoints

```bash
# Override default RPC endpoints
VITE_GHOSTNET_RPC=https://ghostnet.ecadinfra.com
VITE_MAINNET_RPC=https://mainnet.api.tez.ie
```

### Optional: Environment-Specific Settings

```bash
# Environment identifier
VITE_ENVIRONMENT=development|staging|production

# Enable debug logging
VITE_ENABLE_DEBUG=true|false
```

## Environment Setup

### Development Environment

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure for Ghostnet:
   ```bash
   VITE_TEZOS_NETWORK=ghostnet
   VITE_ENVIRONMENT=development
   VITE_ENABLE_DEBUG=true
   ```

3. Add Ghostnet contract addresses after deployment:
   ```bash
   VITE_GHOSTNET_STREAMING_PROTOCOL=KT1abc...
   VITE_GHOSTNET_ASSET_YIELD_PROTOCOL=KT1def...
   # ... etc
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

### Staging Environment

1. Use `.env.staging` or create it:
   ```bash
   cp .env.example .env.staging
   ```

2. Configure for Ghostnet with staging settings:
   ```bash
   VITE_TEZOS_NETWORK=ghostnet
   VITE_ENVIRONMENT=staging
   VITE_ENABLE_DEBUG=false
   ```

3. Build for staging:
   ```bash
   npm run build -- --mode staging
   ```

### Production Environment

1. Use `.env.production` or create it:
   ```bash
   cp .env.example .env.production
   ```

2. Configure for Mainnet:
   ```bash
   VITE_TEZOS_NETWORK=mainnet
   VITE_ENVIRONMENT=production
   VITE_ENABLE_DEBUG=false
   ```

3. Add Mainnet contract addresses:
   ```bash
   VITE_MAINNET_STREAMING_PROTOCOL=KT1xyz...
   VITE_MAINNET_ASSET_YIELD_PROTOCOL=KT1uvw...
   # ... etc
   ```

4. Build for production:
   ```bash
   npm run build
   ```

## Contract Address Override

You can override contract addresses at runtime using environment variables. This is useful for:

- Testing with different contract deployments
- Switching between contract versions
- Local development with test contracts

### Example: Override Single Contract

```bash
VITE_GHOSTNET_RWA_HUB=KT1NewAddress... npm run dev
```

### Example: Override All Contracts

Create a custom `.env.local` file (not committed to git):

```bash
# .env.local
VITE_GHOSTNET_STREAMING_PROTOCOL=KT1test1...
VITE_GHOSTNET_ASSET_YIELD_PROTOCOL=KT1test2...
VITE_GHOSTNET_COMPLIANCE_GUARD=KT1test3...
VITE_GHOSTNET_TOKEN_REGISTRY=KT1test4...
VITE_GHOSTNET_RWA_HUB=KT1test5...
VITE_GHOSTNET_FA2_TOKEN=KT1test6...
```

## Network Switching

The application supports switching between Ghostnet and Mainnet:

### Method 1: Environment Variable

Change `VITE_TEZOS_NETWORK` in your `.env` file:

```bash
# For Ghostnet
VITE_TEZOS_NETWORK=ghostnet

# For Mainnet
VITE_TEZOS_NETWORK=mainnet
```

Then restart the development server or rebuild.

### Method 2: Build-Time Override

```bash
# Build for Ghostnet
VITE_TEZOS_NETWORK=ghostnet npm run build

# Build for Mainnet
VITE_TEZOS_NETWORK=mainnet npm run build
```

### Method 3: Runtime (User Preference)

Users can switch networks through the UI, which stores their preference in localStorage. However, contract addresses are still determined by the build-time configuration.

## Deployment Workflows

### Deploy to Staging (Ghostnet)

```bash
# 1. Ensure staging environment is configured
cat .env.staging

# 2. Build with staging configuration
npm run build -- --mode staging

# 3. Deploy dist/ folder to staging server
# (e.g., Netlify, Vercel, AWS S3, etc.)
```

### Deploy to Production (Mainnet)

```bash
# 1. Ensure production environment is configured
cat .env.production

# 2. Verify all Mainnet contract addresses are set
grep VITE_MAINNET .env.production

# 3. Build with production configuration
npm run build -- --mode production

# 4. Deploy dist/ folder to production server
```

## Validation

### Check Current Configuration

The application provides utilities to validate configuration:

```typescript
import { validateContractAddresses, getMissingContracts } from './services/networkService';

// Check if all contracts are configured
const isValid = validateContractAddresses();

// Get list of missing contracts
const missing = getMissingContracts();
console.log('Missing contracts:', missing);
```

### Configuration Warnings

The UI displays warnings when:
- Contract addresses are missing
- Network mismatch detected (wallet on different network)
- RPC endpoint is not configured

## Troubleshooting

### Issue: Contract addresses not loading

**Solution**: Ensure environment variables are prefixed with `VITE_` and restart dev server.

### Issue: Network mismatch warning

**Solution**: 
1. Check `VITE_TEZOS_NETWORK` in your `.env` file
2. Ensure your wallet is connected to the same network
3. Switch network in your wallet or update `.env`

### Issue: Changes not reflected

**Solution**: 
1. Restart development server after changing `.env` files
2. Clear browser cache and localStorage
3. Rebuild the application

### Issue: Missing contracts in production

**Solution**:
1. Verify `.env.production` has all contract addresses
2. Check build logs for environment variable loading
3. Inspect built files: `grep -r "VITE_" dist/`

## Security Considerations

### Do NOT commit sensitive data

- Never commit `.env` files with real contract addresses to public repositories
- Use `.env.example` as a template without real values
- Add `.env.local` to `.gitignore` for local overrides

### Environment-specific secrets

For production deployments:
- Use your hosting platform's environment variable management
- Examples: Netlify Environment Variables, Vercel Environment Variables, AWS Parameter Store

### Contract address validation

Always validate contract addresses before deployment:
```bash
# Check format (should start with KT1)
echo $VITE_MAINNET_RWA_HUB | grep -E '^KT1[a-zA-Z0-9]{33}$'
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build for production
        env:
          VITE_TEZOS_NETWORK: mainnet
          VITE_MAINNET_STREAMING_PROTOCOL: ${{ secrets.MAINNET_STREAMING_PROTOCOL }}
          VITE_MAINNET_ASSET_YIELD_PROTOCOL: ${{ secrets.MAINNET_ASSET_YIELD_PROTOCOL }}
          VITE_MAINNET_COMPLIANCE_GUARD: ${{ secrets.MAINNET_COMPLIANCE_GUARD }}
          VITE_MAINNET_TOKEN_REGISTRY: ${{ secrets.MAINNET_TOKEN_REGISTRY }}
          VITE_MAINNET_RWA_HUB: ${{ secrets.MAINNET_RWA_HUB }}
          VITE_MAINNET_FA2_TOKEN: ${{ secrets.MAINNET_FA2_TOKEN }}
        run: npm run build
      
      - name: Deploy
        # Your deployment step here
```

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Tezos Network Information](https://tezos.com/developers/)
- [TzKT Block Explorer](https://tzkt.io/)
