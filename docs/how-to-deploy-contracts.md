# Contract Deployment Guide - Continuum Protocol

Complete guide for deploying Continuum Protocol smart contracts to Tezos Ghostnet and Mainnet.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Deployment Process](#deployment-process)
5. [Verification](#verification)
6. [Troubleshooting](#troubleshooting)
7. [Gas Costs](#gas-costs)
8. [Mainnet Deployment](#mainnet-deployment)

## Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| SmartPy CLI | Latest | Contract compilation |
| Octez Client | v18+ | Contract deployment |
| Python | 3.8+ | Deployment scripts |
| Requests | Latest | API interactions |

### System Requirements

- **OS**: macOS, Linux, or Windows WSL
- **RAM**: 4GB minimum
- **Disk**: 2GB free space
- **Network**: Stable internet connection

### Funded Account

**Ghostnet (Testing)**:
- Minimum: 10 XTZ
- Recommended: 20 XTZ
- Source: [Ghostnet Faucet](https://faucet.ghostnet.teztnets.xyz)

**Mainnet (Production)**:
- Minimum: 50 XTZ
- Recommended: 100 XTZ
- Source: Exchange purchase

## Installation

### 1. Install SmartPy CLI

```bash
# Download and install
bash <(curl -s https://smartpy.io/cli/install.sh)

# Verify installation
~/smartpy-cli/SmartPy.sh --version

# Add to PATH (optional)
echo 'export PATH="$HOME/smartpy-cli:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### 2. Install Octez Client

**Ubuntu/Debian**:
```bash
sudo add-apt-repository ppa:serokell/tezos
sudo apt-get update
sudo apt-get install octez-client
```

**macOS**:
```bash
brew tap serokell/tezos-packaging-stable https://github.com/serokell/tezos-packaging-stable.git
brew install tezos-client
```

**Manual Installation**:
```bash
# Download from official source
wget https://gitlab.com/tezos/tezos/-/package_files/latest/download
chmod +x octez-client
sudo mv octez-client /usr/local/bin/
```

### 3. Install Python Dependencies

```bash
cd tezos
pip install -r requirements.txt
```

**requirements.txt**:
```
requests>=2.28.0
pytezos>=3.10.0
python-dotenv>=1.0.0
```

## Configuration

### 1. Configure Octez Client

**For Ghostnet**:
```bash
# Set RPC endpoint
octez-client --endpoint https://ghostnet.ecadinfra.com config update

# Verify connection
octez-client rpc get /chains/main/blocks/head
```

**Alternative RPC Endpoints**:
- Primary: `https://ghostnet.ecadinfra.com`
- Backup: `https://rpc.ghostnet.teztnets.xyz`
- Backup: `https://ghostnet.tezos.marigold.dev`

### 2. Import Deployer Account

**Using Private Key**:
```bash
# Import account (NEVER share your private key!)
octez-client import secret key deployer unencrypted:edsk...

# Verify import
octez-client list known addresses
```

**Using Ledger Hardware Wallet** (Recommended for Mainnet):
```bash
# Import from Ledger
octez-client import secret key deployer "ledger://path/to/key"

# Verify
octez-client get balance for deployer
```

### 3. Check Balance

```bash
# Check XTZ balance
octez-client get balance for deployer

# Expected output: X.XX XTZ
```

If balance is insufficient, get test tokens from the faucet (Ghostnet) or purchase XTZ (Mainnet).

### 4. Prepare Configuration File

Create or verify `tezos/config/ghostnet.json`:

```json
{
  "network": "ghostnet",
  "rpc_endpoint": "https://ghostnet.ecadinfra.com",
  "block_explorer": "https://ghostnet.tzkt.io",
  "admin_address": "tz1YourAdminAddress",
  "contracts": {}
}
```

## Deployment Process

### Overview

Contracts must be deployed in this specific order due to dependencies:

```
1. Streaming Protocol (no dependencies)
2. Asset Yield Protocol (needs Streaming Protocol)
3. Compliance Guard (no dependencies)
4. Token Registry (no dependencies)
5. FA2 Token (needs Asset Yield Protocol)
6. RWA Hub (needs all contracts)
```

### Step-by-Step Deployment

#### Step 1: Navigate to Scripts Directory

```bash
cd tezos/scripts
```

#### Step 2: Run Deployment Script

```bash
# Deploy to Ghostnet
python deploy_ghostnet.py --admin tz1YourAdminAddress

# With custom RPC
python deploy_ghostnet.py \
  --admin tz1YourAdminAddress \
  --rpc https://rpc.ghostnet.teztnets.xyz
```

#### Step 3: Follow Interactive Prompts

The script will:

1. **Compile Contracts**: Converts SmartPy to Michelson
   ```
   Compiling streaming_protocol.py...
   ✓ Compilation successful
   ```

2. **Display Origination Commands**: Copy and execute each command
   ```bash
   # Example command provided by script
   octez-client originate contract streaming_protocol \
     transferring 0 from deployer \
     running output_deploy/streaming_protocol/streaming_protocol.tz \
     --init "$(cat output_deploy/streaming_protocol/streaming_protocol_storage.tz)" \
     --burn-cap 10 \
     --endpoint https://ghostnet.ecadinfra.com
   ```

3. **Prompt for Contract Address**: After each origination, enter the deployed address
   ```
   Enter streaming_protocol address: KT1abc...
   ```

4. **Save Configuration**: Addresses are saved to `config/ghostnet.json`

#### Step 4: Execute Origination Commands

For each contract, copy the command from the script output and execute it:

```bash
# Example: Deploy Streaming Protocol
octez-client originate contract streaming_protocol \
  transferring 0 from deployer \
  running output_deploy/streaming_protocol/streaming_protocol.tz \
  --init "$(cat output_deploy/streaming_protocol/streaming_protocol_storage.tz)" \
  --burn-cap 10 \
  --endpoint https://ghostnet.ecadinfra.com

# Wait for confirmation (usually 30-60 seconds)
# Output will show: New contract KT1abc... originated
```

**Important Notes**:
- Wait for each transaction to confirm before proceeding
- Note the contract address (starts with KT1)
- Verify on block explorer: `https://ghostnet.tzkt.io/KT1abc...`

#### Step 5: Enter Contract Addresses

After each origination, the script will prompt:

```
Enter streaming_protocol address: KT1abc123...
✓ Address saved

Proceeding to next contract...
```

#### Step 6: Complete All Contracts

Repeat steps 4-5 for all six contracts in order.

### Automated Deployment (Advanced)

For automated deployment with private key access:

```bash
# Set environment variable
export TEZOS_PRIVATE_KEY="edsk..."

# Run automated deployment
python deploy_ghostnet.py \
  --admin tz1YourAdminAddress \
  --automated
```

**⚠️ WARNING**: Only use automated deployment in secure environments. Never commit private keys to version control.

## Verification

### Automated Verification

After deployment, run the verification script:

```bash
cd tezos/scripts
python verify_deployment.py --network ghostnet
```

The script checks:
- ✓ All contracts exist on-chain
- ✓ Storage is initialized correctly
- ✓ Cross-contract references are valid
- ✓ Admin addresses are set correctly

**Expected Output**:
```
Verifying Ghostnet Deployment...

✓ Streaming Protocol: KT1abc... (verified)
✓ Asset Yield Protocol: KT1def... (verified)
✓ Compliance Guard: KT1ghi... (verified)
✓ Token Registry: KT1jkl... (verified)
✓ FA2 Token: KT1mno... (verified)
✓ RWA Hub: KT1pqr... (verified)

All contracts verified successfully!
```

### Manual Verification

#### 1. Check Contract Existence

```bash
# Query contract storage
octez-client get contract storage for KT1abc...

# Should return contract storage structure
```

#### 2. Verify on Block Explorer

Visit `https://ghostnet.tzkt.io/KT1YourContractAddress` and check:
- Contract is originated
- Storage is initialized
- No errors in origination

#### 3. Test Basic Operations

```bash
# Example: Register KYC identity
octez-client transfer 0 from deployer to KT1ComplianceGuard \
  --entrypoint register_identity \
  --arg '(Pair "tz1User..." (Pair "US" (Pair 1 (Pair "2027-01-01T00:00:00Z" {}))))'
```

## Troubleshooting

### Common Issues

#### Issue 1: Contract Origination Fails

**Error**: `Contract_storage_failure` or `Script_rejected`

**Causes**:
- Incorrect storage initialization
- Compilation errors
- Insufficient balance

**Solutions**:
```bash
# 1. Verify compilation
~/smartpy-cli/SmartPy.sh compile contracts/streaming_protocol.py output/
# Check for errors in output

# 2. Check balance
octez-client get balance for deployer
# Ensure sufficient XTZ

# 3. Increase burn cap
# Add --burn-cap 20 to origination command

# 4. Check storage file
cat output_deploy/streaming_protocol/streaming_protocol_storage.tz
# Verify syntax is correct
```

#### Issue 2: RPC Connection Timeout

**Error**: `Failed to connect to RPC endpoint`

**Solutions**:
```bash
# 1. Try backup RPC
octez-client --endpoint https://rpc.ghostnet.teztnets.xyz config update

# 2. Check network connectivity
curl https://ghostnet.ecadinfra.com/chains/main/blocks/head

# 3. Wait and retry (RPC may be temporarily down)
```

#### Issue 3: Storage Verification Fails

**Error**: `Storage field missing or wrong type`

**Solutions**:
```bash
# 1. Re-deploy with correct initialization
# Check contract initialization in deploy script

# 2. Verify contract addresses in config
cat config/ghostnet.json
# Ensure no typos

# 3. Query storage directly
octez-client get contract storage for KT1abc...
# Compare with expected structure
```

#### Issue 4: Cross-Contract Reference Mismatch

**Error**: `Contract reference doesn't match deployed address`

**Solutions**:
```bash
# 1. Verify addresses in config file
cat config/ghostnet.json

# 2. Re-deploy contracts with incorrect references
# Example: If Asset Yield Protocol has wrong Streaming Protocol address
python deploy_ghostnet.py --redeploy asset_yield_protocol

# 3. Update references manually (advanced)
# Use octez-client to call update_references entrypoint
```

#### Issue 5: Insufficient Gas

**Error**: `Gas limit exceeded`

**Solutions**:
```bash
# 1. Increase gas limit in origination
# Add --gas-limit 100000 to command

# 2. Optimize contract code
# Review contract for gas-heavy operations

# 3. Split operations into multiple transactions
```

### Debug Mode

Enable debug logging for detailed information:

```bash
# Set debug environment variable
export DEBUG=1

# Run deployment with verbose output
python deploy_ghostnet.py --admin tz1... --verbose

# Check logs
cat deployment.log
```

### Getting Help

If issues persist:

1. **Check Logs**: Review `deployment.log` and `compilation.log`
2. **Block Explorer**: Inspect failed transactions on tzkt.io
3. **Community**: Ask in [Tezos Discord](https://discord.gg/tezos)
4. **Documentation**: Review [Tezos Docs](https://tezos.gitlab.io)

## Gas Costs

### Deployment Costs (Ghostnet)

| Contract | Gas | Storage (bytes) | Estimated Cost |
|----------|-----|-----------------|----------------|
| Streaming Protocol | ~40,000 | ~2,000 | ~0.5 XTZ |
| Asset Yield Protocol | ~35,000 | ~1,800 | ~0.4 XTZ |
| Compliance Guard | ~30,000 | ~1,500 | ~0.4 XTZ |
| Token Registry | ~25,000 | ~1,200 | ~0.3 XTZ |
| FA2 Token | ~45,000 | ~2,500 | ~0.6 XTZ |
| RWA Hub | ~50,000 | ~2,000 | ~0.5 XTZ |
| **Total** | **~225,000** | **~11,000** | **~2.7 XTZ** |

### Operation Costs (Post-Deployment)

| Operation | Gas | Storage | Cost |
|-----------|-----|---------|------|
| Create Stream | ~45,000 | ~500 bytes | ~0.15 XTZ |
| Withdraw | ~25,000 | 0 | ~0.05 XTZ |
| Flash Advance | ~30,000 | 0 | ~0.06 XTZ |
| NFT Transfer | ~55,000 | 0 | ~0.10 XTZ |
| Register KYC | ~20,000 | ~300 bytes | ~0.08 XTZ |
| Whitelist User | ~15,000 | ~100 bytes | ~0.05 XTZ |

**Notes**:
- Costs are estimates and may vary
- Mainnet costs are typically 2-3x higher
- Storage costs are one-time per entry
- Gas costs vary with network congestion

### Cost Optimization Tips

1. **Batch Operations**: Use batch whitelist instead of individual calls
2. **Minimize Storage**: Use efficient data structures
3. **Off-Peak Deployment**: Deploy during low network activity
4. **Test on Ghostnet**: Verify costs before Mainnet deployment

## Mainnet Deployment

### Pre-Deployment Checklist

Before deploying to Mainnet, ensure:

- [ ] **Security Audit**: Complete third-party audit
- [ ] **Ghostnet Testing**: Minimum 2 weeks of testing
- [ ] **Test Coverage**: 90%+ code coverage achieved
- [ ] **Property Tests**: All 43 properties passing
- [ ] **Multi-Sig Setup**: Admin operations require multiple signatures
- [ ] **Backup Plan**: Rollback procedures documented
- [ ] **Sufficient Funds**: 100+ XTZ available
- [ ] **Stakeholder Approval**: All stakeholders signed off
- [ ] **Monitoring Setup**: Alerts and dashboards configured
- [ ] **Documentation**: All docs complete and reviewed

### Mainnet Deployment Process

```bash
# 1. Configure for Mainnet
octez-client --endpoint https://mainnet.api.tez.ie config update

# 2. Import Mainnet account (use Ledger for security)
octez-client import secret key mainnet_deployer "ledger://..."

# 3. Verify balance
octez-client get balance for mainnet_deployer

# 4. Run Mainnet deployment
cd tezos/scripts
python deploy_mainnet.py --admin tz1MainnetMultisigAddress

# 5. Confirm each step carefully
# Script will ask for explicit confirmation before each contract
```

### Mainnet Safety Measures

The Mainnet deployment script includes:

1. **Confirmation Prompts**: Explicit confirmation before each action
2. **Dry Run Mode**: Test without actual deployment
3. **Multi-Sig Requirement**: Admin must be multi-sig contract
4. **Gradual Rollout**: Deploy one contract at a time
5. **Verification Steps**: Automated checks after each deployment

### Post-Mainnet Deployment

1. **Immediate Verification** (0-1 hour):
   ```bash
   python verify_deployment.py --network mainnet
   ```

2. **Small-Scale Testing** (1-24 hours):
   - Test with small amounts
   - Monitor all transactions
   - Verify all operations work correctly

3. **Monitoring Period** (24-48 hours):
   - Watch for anomalies
   - Check gas costs
   - Monitor contract storage

4. **Gradual Scaling** (48+ hours):
   - Increase transaction volume gradually
   - Monitor system health
   - Be ready to pause if issues arise

### Emergency Procedures

If critical issues are discovered:

```bash
# 1. Pause all contracts
octez-client transfer 0 from admin to KT1RWAHub \
  --entrypoint emergency_pause \
  --arg 'Unit'

# 2. Notify users immediately
# Use communication channels

# 3. Investigate issue
# Review logs and transaction history

# 4. Prepare fix
# Test thoroughly on Ghostnet

# 5. Deploy fix or rollback
# Follow established procedures
```

## Next Steps

After successful deployment:

1. **Update Frontend**: Configure contract addresses in frontend
2. **Integration Testing**: Test frontend with deployed contracts
3. **User Documentation**: Provide guides for end users
4. **Monitoring**: Set up analytics and alerting
5. **Announcement**: Communicate deployment to stakeholders

## References

- [SmartPy Documentation](https://smartpy.io/docs/)
- [Octez Client Manual](https://tezos.gitlab.io/shell/cli-commands.html)
- [Tezos Developer Portal](https://tezos.com/developers/)
- [Ghostnet Explorer](https://ghostnet.tzkt.io)
- [Mainnet Explorer](https://tzkt.io)
- [Tezos Stack Exchange](https://tezos.stackexchange.com/)

## Support

For deployment assistance:

- **Documentation**: Review this guide and linked resources
- **Community**: [Tezos Discord](https://discord.gg/tezos)
- **Stack Exchange**: [tezos.stackexchange.com](https://tezos.stackexchange.com/)
- **GitHub Issues**: Report bugs in project repository

---

**Last Updated**: February 2026  
**Version**: 1.0.0  
**Maintainer**: Continuum Protocol Team
