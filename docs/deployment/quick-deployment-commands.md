# Quick Deployment Reference

One-page reference for deploying Continuum Protocol to Ghostnet.

## Prerequisites Checklist

```bash
# 1. Check SmartPy
smartpy --version  # Should be 0.18.x (stable)

# 2. Check octez-client
octez-client --version

# 3. Check Python
python3 --version  # 3.8+

# 4. Install dependencies
pip install requests

# 5. Configure octez-client
octez-client --endpoint https://ghostnet.ecadinfra.com config update

# 6. Import admin account
octez-client import secret key admin unencrypted:edsk...

# 7. Check balance (need 10+ XTZ)
octez-client get balance for admin
```

## Deployment Commands

```bash
cd tezos/scripts

# Deploy all contracts
python deploy_ghostnet.py --admin $(octez-client show address admin | grep Hash | awk '{print $2}')

# Follow prompts and execute origination commands
# Enter each deployed contract address when prompted

# Verify deployment
python verify_deployment.py --network ghostnet
```

## Contract Deployment Order

1. **Streaming Protocol** → No dependencies
2. **Asset Yield Protocol** → Needs Streaming Protocol
3. **Compliance Guard** → No dependencies
4. **Token Registry** → No dependencies
5. **FA2 Token** → Needs Asset Yield Protocol
6. **RWA Hub** → Needs all others

## Quick Test Commands

```bash
# Load addresses
STREAMING=$(jq -r '.contracts.streaming_protocol' ../config/ghostnet.json)
COMPLIANCE=$(jq -r '.contracts.compliance_guard' ../config/ghostnet.json)
RWA_HUB=$(jq -r '.contracts.rwa_hub' ../config/ghostnet.json)

# Test 1: Register KYC
octez-client transfer 0 from admin to $COMPLIANCE \
  --entrypoint register_identity \
  --arg "(Pair \"tz1...\" (Pair \"US\" (Pair 1 \"2027-12-31T23:59:59Z\")))" \
  --burn-cap 1

# Test 2: Whitelist for real estate
octez-client transfer 0 from admin to $COMPLIANCE \
  --entrypoint whitelist_address \
  --arg "(Pair \"tz1...\" {0})" \
  --burn-cap 1

# Test 3: Create stream
octez-client transfer 0 from alice to $STREAMING \
  --entrypoint create_stream \
  --arg "(Pair \"tz1Bob\" (Pair \"KT1Token\" (Pair 0 (Pair 11 (Pair 86400 1000000)))))" \
  --burn-cap 2
```

## Verification Checklist

- [ ] All 6 contracts deployed
- [ ] All addresses in config/ghostnet.json
- [ ] Verification script passes
- [ ] Storage initialized correctly
- [ ] Cross-contract refs correct
- [ ] Manual test 1-3 pass

## Block Explorer

View contracts: `https://ghostnet.tzkt.io/KT1...`

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Script_rejected | Check parameter format |
| Insufficient funds | Get XTZ from faucet |
| Contract not found | Verify address in config |
| Storage mismatch | Re-deploy with correct init |
| RPC timeout | Use backup RPC endpoint |

## Important Files

- Deployment script: `deploy_ghostnet.py`
- Verification script: `verify_deployment.py`
- Config file: `../config/ghostnet.json`
- Full guide: `DEPLOYMENT_GUIDE.md`
- Test guide: `MANUAL_TESTING_GUIDE.md`

## Support

- Full deployment guide: `DEPLOYMENT_GUIDE.md`
- Manual testing: `MANUAL_TESTING_GUIDE.md`
- Checklist: `DEPLOYMENT_CHECKLIST.md`
- Tezos docs: https://tezos.gitlab.io

## Faucet

Get test XTZ: https://faucet.ghostnet.teztnets.xyz

---

**Quick Start:** `python deploy_ghostnet.py --admin tz1YourAddress`
