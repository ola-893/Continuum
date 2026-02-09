# Continuum Protocol - Deployment Guide

This guide explains how to deploy the Continuum Protocol contracts to Tezos Ghostnet and Mainnet.

## Prerequisites

### Required Tools

1. **SmartPy CLI** - For compiling contracts
   ```bash
   # Install SmartPy
   bash <(curl -s https://smartpy.io/cli/install.sh)
   ```

2. **Octez Client** - For deploying contracts
   ```bash
   # Install octez-client (Ubuntu/Debian)
   sudo add-apt-repository ppa:serokell/tezos
   sudo apt-get update
   sudo apt-get install octez-client
   
   # Or download from: https://tezos.gitlab.io/introduction/howtoget.html
   ```

3. **Python 3.8+** - For running deployment scripts
   ```bash
   python3 --version
   ```

4. **Requests library** - For verification script
   ```bash
   pip install requests
   ```

### Funded Account

You need a Tezos account with sufficient XTZ for deployment:

**Ghostnet:**
- Get test XTZ from faucet: https://faucet.ghostnet.teztnets.xyz
- Minimum recommended: 10 XTZ

**Mainnet:**
- Purchase XTZ from an exchange
- Minimum recommended: 50 XTZ (deployment costs vary)

### Configure Octez Client

```bash
# Set up octez-client for Ghostnet
octez-client --endpoint https://ghostnet.ecadinfra.com config update

# Import your account (replace with your private key)
octez-client import secret key deployer unencrypted:edsk...

# Check balance
octez-client get balance for deployer
```

## Deployment Process

### Step 1: Prepare Configuration

The deployment script uses `config/ghostnet.json` for configuration. Verify the RPC endpoint is accessible:

```bash
curl https://ghostnet.ecadinfra.com/chains/main/blocks/head
```

### Step 2: Run Deployment Script

```bash
cd tezos/scripts

# Deploy to Ghostnet
python deploy_ghostnet.py --admin tz1YourAdminAddress

# Optional: Use custom RPC endpoint
python deploy_ghostnet.py --admin tz1YourAdminAddress --rpc https://rpc.ghostnet.teztnets.xyz
```

### Step 3: Follow Deployment Instructions

The script will:
1. Compile each contract to Michelson
2. Display origination commands for octez-client
3. Prompt you to enter deployed contract addresses
4. Save addresses to `config/ghostnet.json`

**Important:** The script provides manual origination commands because automated deployment requires private key access. Copy and execute each command in your terminal.

Example origination command:
```bash
octez-client originate contract streaming_protocol \
  transferring 0 from deployer \
  running output_deploy/streaming_protocol/streaming_protocol.tz \
  --init "$(cat output_deploy/streaming_protocol/streaming_protocol_storage.tz)" \
  --burn-cap 10 \
  --endpoint https://ghostnet.ecadinfra.com
```

### Step 4: Verify Deployment

After all contracts are deployed, run the verification script:

```bash
python verify_deployment.py --network ghostnet
```

This will:
- Check that all contracts exist on-chain
- Verify storage is initialized correctly
- Verify cross-contract references
- Provide manual testing instructions

### Step 5: Manual Testing

Follow the instructions from the verification script to test:
1. Register KYC identity
2. Whitelist address for asset type
3. Create compliant RWA stream
4. Claim yield

Use octez-client or the frontend for testing.

## Deployment Order

Contracts must be deployed in this specific order due to dependencies:

1. **Streaming Protocol** - No dependencies
2. **Asset Yield Protocol** - Requires Streaming Protocol address
3. **Compliance Guard** - No dependencies
4. **Token Registry** - No dependencies
5. **FA2 Token** - Requires Asset Yield Protocol address
6. **RWA Hub** - Requires all other contract addresses

The deployment script handles this order automatically.

## Configuration Files

### ghostnet.json

```json
{
  "network": "ghostnet",
  "rpc_endpoint": "https://ghostnet.ecadinfra.com",
  "block_explorer": "https://ghostnet.tzkt.io",
  "contracts": {
    "streaming_protocol": "KT1...",
    "asset_yield_protocol": "KT1...",
    "compliance_guard": "KT1...",
    "token_registry": "KT1...",
    "fa2_token": "KT1...",
    "rwa_hub": "KT1..."
  },
  "admin_address": "tz1...",
  "deployed_at": "2026-02-06T12:00:00"
}
```

After deployment, this file is automatically updated with contract addresses.

## Troubleshooting

### Contract Origination Fails

**Error:** `Contract_storage_failure` or `Script_rejected`

**Solution:**
- Check that storage initialization is correct
- Verify contract compiles without errors
- Ensure sufficient XTZ balance for gas and storage

### Storage Verification Fails

**Error:** Storage fields missing or wrong type

**Solution:**
- Re-deploy the contract with correct initialization
- Check that contract addresses are correct in config
- Verify RPC endpoint is responding

### Cross-Contract Reference Mismatch

**Error:** Contract references don't match deployed addresses

**Solution:**
- Verify you entered correct addresses during deployment
- Check `config/ghostnet.json` for typos
- Re-deploy contracts that have incorrect references

### RPC Connection Issues

**Error:** Cannot connect to RPC endpoint

**Solution:**
- Try backup RPC: `https://rpc.ghostnet.teztnets.xyz`
- Check network connectivity
- Verify endpoint is not rate-limiting

## Gas Costs

Typical deployment costs on Ghostnet (estimates):

| Contract | Gas Cost | Storage Cost | Total XTZ |
|----------|----------|--------------|-----------|
| Streaming Protocol | ~40,000 | ~2,000 bytes | ~0.5 XTZ |
| Asset Yield Protocol | ~35,000 | ~1,800 bytes | ~0.4 XTZ |
| Compliance Guard | ~30,000 | ~1,500 bytes | ~0.4 XTZ |
| Token Registry | ~25,000 | ~1,200 bytes | ~0.3 XTZ |
| FA2 Token | ~45,000 | ~2,500 bytes | ~0.6 XTZ |
| RWA Hub | ~50,000 | ~2,000 bytes | ~0.5 XTZ |
| **Total** | | | **~2.7 XTZ** |

**Note:** Actual costs may vary. Always have extra XTZ for safety.

## Mainnet Deployment

**⚠️ WARNING:** Mainnet deployment requires additional precautions:

### Prerequisites
- [ ] Complete security audit
- [ ] Successful Ghostnet testing (minimum 2 weeks)
- [ ] Multi-sig admin setup
- [ ] Stakeholder approval
- [ ] Sufficient XTZ (50+ recommended)
- [ ] Backup plan and rollback procedures

### Process

```bash
# Deploy to Mainnet (use with extreme caution)
python deploy_mainnet.py --admin tz1YourMultisigAddress
```

The mainnet script includes additional safety checks and requires explicit confirmation.

### Post-Deployment

1. Verify deployment: `python verify_deployment.py --network mainnet`
2. Test with small amounts first
3. Monitor contracts for 24-48 hours
4. Gradually increase usage
5. Set up monitoring and alerting

## Support

For deployment issues:
1. Check this guide's troubleshooting section
2. Review contract compilation logs in `output_deploy/`
3. Check Tezos block explorer for transaction details
4. Consult Tezos documentation: https://tezos.gitlab.io

## Next Steps

After successful deployment:
1. Update frontend configuration with contract addresses
2. Test frontend integration
3. Perform end-to-end user flow testing
4. Set up monitoring and analytics
5. Prepare user documentation

## References

- Tezos Documentation: https://tezos.gitlab.io
- SmartPy Documentation: https://smartpy.io/docs
- Ghostnet Block Explorer: https://ghostnet.tzkt.io
- Mainnet Block Explorer: https://tzkt.io
- Tezos Faucet: https://faucet.ghostnet.teztnets.xyz
