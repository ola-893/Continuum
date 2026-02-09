# Continuum Protocol - Tezos Implementation

This directory contains the Tezos smart contracts and deployment scripts for the Continuum Protocol migration from Aptos.

## Project Structure

```
tezos/
├── contracts/           # SmartPy smart contracts
│   ├── streaming_protocol.py
│   ├── asset_yield_protocol.py
│   ├── compliance_guard.py
│   ├── token_registry.py
│   ├── rwa_hub.py
│   └── fa2_token.py
├── tests/              # SmartPy test files
│   ├── test_streaming_protocol.py
│   ├── test_asset_yield_protocol.py
│   ├── test_compliance_guard.py
│   ├── test_token_registry.py
│   ├── test_rwa_hub.py
│   └── test_fa2_token.py
├── scripts/            # Deployment and utility scripts
│   ├── deploy_ghostnet.py
│   ├── deploy_mainnet.py
│   └── verify_deployment.py
├── config/             # Configuration files
│   ├── ghostnet.json
│   └── mainnet.json
└── README.md
```

## Prerequisites

### SmartPy CLI Installation

Install SmartPy CLI for contract development and testing:

```bash
# Install SmartPy CLI
bash <(curl -s https://smartpy.io/cli/install.sh)

# Verify installation
~/smartpy-cli/SmartPy.sh --version
```

### Node.js and Taquito Setup

For frontend integration and deployment scripts:

```bash
# Install Node.js dependencies (run from project root)
cd frontend
npm install @taquito/taquito @taquito/beacon-wallet @airgap/beacon-sdk
```

## Development Workflow

### 1. Compile Contracts

```bash
# Compile a single contract
~/smartpy-cli/SmartPy.sh compile contracts/streaming_protocol.py output/

# Compile all contracts
for contract in contracts/*.py; do
  ~/smartpy-cli/SmartPy.sh compile "$contract" output/
done
```

### 2. Run Tests

```bash
# Run tests for a specific contract
~/smartpy-cli/SmartPy.sh test tests/test_streaming_protocol.py output/

# Run all tests
for test in tests/*.py; do
  ~/smartpy-cli/SmartPy.sh test "$test" output/
done
```

### 3. Deploy to Ghostnet

```bash
# Deploy all contracts to Ghostnet
~/smartpy-cli/SmartPy.sh run scripts/deploy_ghostnet.py
```

## Ghostnet Configuration

### RPC Endpoints

- **Primary**: https://ghostnet.ecadinfra.com
- **Backup**: https://rpc.ghostnet.teztnets.xyz
- **Block Explorer**: https://ghostnet.tzkt.io

### Faucet Access

Get test XTZ for Ghostnet:
- **Faucet URL**: https://faucet.ghostnet.teztnets.xyz
- Request test tokens by providing your Tezos address

### Network Information

- **Network ID**: NetXnHfVqm9iesp
- **Chain ID**: NetXnHfVqm9iesp
- **Protocol**: PtNairobiyssHuh87hEhfVBGCVrK3WnS8Z2FT4ymB5tAa4r1nQf

## Contract Addresses (Ghostnet)

After deployment, contract addresses will be stored in `config/ghostnet.json`:

```json
{
  "network": "ghostnet",
  "rpc_endpoint": "https://ghostnet.ecadinfra.com",
  "contracts": {
    "streaming_protocol": "KT1...",
    "asset_yield_protocol": "KT1...",
    "compliance_guard": "KT1...",
    "token_registry": "KT1...",
    "rwa_hub": "KT1...",
    "fa2_token": "KT1..."
  },
  "admin_address": "tz1...",
  "deployed_at": "2026-02-06T00:00:00Z"
}
```

## Testing Strategy

### Unit Tests
- Test specific examples and edge cases
- Verify error conditions
- Test integration points between contracts

### Property-Based Tests
- Verify universal correctness properties
- Run 100+ iterations with randomized inputs
- Each property test validates a specific correctness property from the design document

### Coverage Goals
- Smart Contracts: 90%+ code coverage
- All 43 correctness properties implemented as tests

## Gas Optimization

Target gas costs for operations:
- Stream creation: < 50,000 gas
- Withdrawal: < 30,000 gas
- Flash advance: < 35,000 gas
- NFT transfer with hook: < 60,000 gas
- Batch whitelist (10 users): < 100,000 gas

## Security Considerations

- All admin functions protected by access control
- Input validation on all entrypoints
- State updates before external calls (reentrancy prevention)
- Escrow balance invariants enforced
- Emergency pause functionality for critical vulnerabilities

## Resources

- [SmartPy Documentation](https://smartpy.io/docs/)
- [Taquito Documentation](https://tezostaquito.io/)
- [FA2 Token Standard (TZIP-12)](https://tzip.tezosagora.org/proposal/tzip-12/)
- [Tezos Developer Portal](https://tezos.com/developers/)
- [Ghostnet Explorer](https://ghostnet.tzkt.io)

## Support

For questions or issues:
1. Check the [Troubleshooting Guide](../docs/troubleshooting-common-issues.md)
2. Review the [Getting Started Guide](../docs/development/getting-started-for-developers.md)
3. See the [Deployment Guide](../docs/deployment/how-to-deploy-step-by-step.md)
4. Review the design document at `.kiro/specs/aptos-to-tezos-migration/design.md`
5. Review the requirements at `.kiro/specs/aptos-to-tezos-migration/requirements.md`
