# Manual Testing Guide - Ghostnet Deployment

This guide provides step-by-step instructions for manually testing the deployed Continuum Protocol contracts on Ghostnet.

## Prerequisites

- All contracts deployed to Ghostnet
- `config/ghostnet.json` populated with contract addresses
- Octez-client configured and connected to Ghostnet
- Test account with XTZ balance
- Test FA2 token contract for yield tokens (or use existing)

## Test Environment Setup

### 1. Verify Deployment

```bash
cd tezos/scripts
python verify_deployment.py --network ghostnet
```

Expected output:
- All 6 contracts exist
- Storage initialized correctly
- Cross-contract references correct

### 2. Prepare Test Accounts

```bash
# Create test accounts
octez-client gen keys alice
octez-client gen keys bob
octez-client gen keys admin

# Fund from faucet
# Visit: https://faucet.ghostnet.teztnets.xyz
# Send XTZ to alice, bob, and admin addresses
```

### 3. Load Contract Addresses

```bash
# Load addresses from config
STREAMING_PROTOCOL=$(jq -r '.contracts.streaming_protocol' ../config/ghostnet.json)
ASSET_YIELD_PROTOCOL=$(jq -r '.contracts.asset_yield_protocol' ../config/ghostnet.json)
COMPLIANCE_GUARD=$(jq -r '.contracts.compliance_guard' ../config/ghostnet.json)
TOKEN_REGISTRY=$(jq -r '.contracts.token_registry' ../config/ghostnet.json)
FA2_TOKEN=$(jq -r '.contracts.fa2_token' ../config/ghostnet.json)
RWA_HUB=$(jq -r '.contracts.rwa_hub' ../config/ghostnet.json)

echo "Streaming Protocol: $STREAMING_PROTOCOL"
echo "Asset Yield Protocol: $ASSET_YIELD_PROTOCOL"
echo "Compliance Guard: $COMPLIANCE_GUARD"
echo "Token Registry: $TOKEN_REGISTRY"
echo "FA2 Token: $FA2_TOKEN"
echo "RWA Hub: $RWA_HUB"
```

## Test Suite

### Test 1: Compliance Guard - Register Identity

**Objective:** Register KYC identity for test user

```bash
# Get alice's address
ALICE_ADDR=$(octez-client show address alice | grep Hash | awk '{print $2}')

# Register identity (as admin)
octez-client transfer 0 from admin to $COMPLIANCE_GUARD \
  --entrypoint register_identity \
  --arg "(Pair \"$ALICE_ADDR\" (Pair \"US\" (Pair 1 \"2027-12-31T23:59:59Z\")))" \
  --burn-cap 1

# Verify on block explorer
echo "Check transaction: https://ghostnet.tzkt.io/$COMPLIANCE_GUARD"
```

**Expected Result:**
- Transaction succeeds
- Identity stored in compliance_guard.identities big_map
- is_verified = true

### Test 2: Compliance Guard - Whitelist Address

**Objective:** Whitelist alice for real estate (asset_type = 0)

```bash
# Whitelist alice for asset type 0 (real estate)
octez-client transfer 0 from admin to $COMPLIANCE_GUARD \
  --entrypoint whitelist_address \
  --arg "(Pair \"$ALICE_ADDR\" {0})" \
  --burn-cap 1

# Verify whitelisting
octez-client get contract storage for $COMPLIANCE_GUARD
```

**Expected Result:**
- Transaction succeeds
- alice's whitelisted_asset_types contains 0

### Test 3: FA2 Token - Mint NFT

**Objective:** Mint a test RWA NFT

```bash
# Mint NFT to alice
octez-client transfer 0 from admin to $FA2_TOKEN \
  --entrypoint mint \
  --arg "(Pair \"$ALICE_ADDR\" {Elt \"name\" 0x4c7578757279204170617274})" \
  --burn-cap 1

# Get token_id (should be 0 for first mint)
TOKEN_ID=0

# Verify ownership
octez-client get contract storage for $FA2_TOKEN
```

**Expected Result:**
- Transaction succeeds
- NFT minted with token_id = 0
- alice owns the NFT
- next_token_id incremented to 1

### Test 4: Streaming Protocol - Create Stream

**Objective:** Create a basic token stream

**Note:** This requires a yield token. For testing, you can use any FA2 token or deploy a simple test token.

```bash
# Assuming you have a test FA2 token at $YIELD_TOKEN_ADDR
YIELD_TOKEN_ADDR="KT1..."  # Replace with actual yield token address
YIELD_TOKEN_ID=0

# Approve streaming protocol to transfer tokens
octez-client transfer 0 from alice to $YIELD_TOKEN_ADDR \
  --entrypoint update_operators \
  --arg "{Left (Pair \"$ALICE_ADDR\" (Pair \"$STREAMING_PROTOCOL\" $YIELD_TOKEN_ID))}" \
  --burn-cap 1

# Create stream (1000 tokens over 86400 seconds = 1 day)
BOB_ADDR=$(octez-client show address bob | grep Hash | awk '{print $2}')

octez-client transfer 0 from alice to $STREAMING_PROTOCOL \
  --entrypoint create_stream \
  --arg "(Pair \"$BOB_ADDR\" (Pair \"$YIELD_TOKEN_ADDR\" (Pair $YIELD_TOKEN_ID (Pair 11 (Pair 86400 1000000)))))" \
  --burn-cap 2

# Get stream_id (should be 0 for first stream)
STREAM_ID=0
```

**Expected Result:**
- Transaction succeeds
- 1000000 tokens locked in escrow
- Stream created with stream_id = 0
- next_stream_id incremented to 1

### Test 5: Streaming Protocol - Withdraw

**Objective:** Withdraw claimable balance from stream

```bash
# Wait a few minutes for some tokens to become claimable
sleep 300  # Wait 5 minutes

# Withdraw as bob (recipient)
octez-client transfer 0 from bob to $STREAMING_PROTOCOL \
  --entrypoint withdraw \
  --arg "$STREAM_ID" \
  --burn-cap 1

# Check bob's balance increased
octez-client get contract storage for $YIELD_TOKEN_ADDR
```

**Expected Result:**
- Transaction succeeds
- Claimable balance transferred to bob
- amount_withdrawn updated in stream record

### Test 6: Streaming Protocol - Flash Advance

**Objective:** Test flash advance feature

```bash
# Flash advance 100000 tokens (as bob)
octez-client transfer 0 from bob to $STREAMING_PROTOCOL \
  --entrypoint flash_advance \
  --arg "(Pair $STREAM_ID 100000)" \
  --burn-cap 1

# Verify amount_withdrawn increased
octez-client get contract storage for $STREAMING_PROTOCOL
```

**Expected Result:**
- Transaction succeeds
- 100000 tokens immediately transferred to bob
- amount_withdrawn increased by 100000

### Test 7: Asset Yield Protocol - Create Asset Yield Stream

**Objective:** Link NFT to yield stream

```bash
# Create asset yield stream (alice owns NFT token_id 0)
octez-client transfer 0 from alice to $ASSET_YIELD_PROTOCOL \
  --entrypoint create_asset_yield_stream \
  --arg "(Pair (Pair \"$FA2_TOKEN\" $TOKEN_ID) (Pair 1000000 86400))" \
  --burn-cap 2

# Verify bidirectional mapping
octez-client get contract storage for $ASSET_YIELD_PROTOCOL
```

**Expected Result:**
- Transaction succeeds
- Stream created and linked to NFT
- asset_to_stream mapping created
- stream_to_asset mapping created

### Test 8: Asset Yield Protocol - Claim Yield

**Objective:** Claim yield for owned NFT

```bash
# Wait for some yield to accumulate
sleep 300

# Claim yield (as alice, NFT owner)
octez-client transfer 0 from alice to $ASSET_YIELD_PROTOCOL \
  --entrypoint claim_yield_for_asset \
  --arg "(Pair \"$FA2_TOKEN\" $TOKEN_ID)" \
  --burn-cap 1

# Check alice's yield token balance
octez-client get contract storage for $YIELD_TOKEN_ADDR
```

**Expected Result:**
- Transaction succeeds
- Yield transferred to alice
- amount_withdrawn updated in linked stream

### Test 9: FA2 Token - Transfer NFT

**Objective:** Transfer NFT and verify yield stream recipient updates

```bash
# Transfer NFT from alice to bob
octez-client transfer 0 from alice to $FA2_TOKEN \
  --entrypoint transfer \
  --arg "{Pair \"$ALICE_ADDR\" {Pair \"$BOB_ADDR\" (Pair $TOKEN_ID 1)}}" \
  --burn-cap 1

# Verify ownership changed
octez-client get contract storage for $FA2_TOKEN

# Verify stream recipient updated
octez-client get contract storage for $STREAMING_PROTOCOL
```

**Expected Result:**
- Transaction succeeds
- NFT ownership transferred to bob
- Linked stream recipient updated to bob
- Transfer hook executed successfully

### Test 10: Token Registry - Register Token

**Objective:** Register NFT in global registry

```bash
# Register token (as admin or through RWA Hub)
octez-client transfer 0 from admin to $TOKEN_REGISTRY \
  --entrypoint register_token \
  --arg "(Pair (Pair \"$FA2_TOKEN\" $TOKEN_ID) (Pair 0 (Pair $STREAM_ID \"ipfs://QmTest123\")))" \
  --burn-cap 1

# Verify registration
octez-client get contract storage for $TOKEN_REGISTRY
```

**Expected Result:**
- Transaction succeeds
- Token registered with metadata
- token_count incremented
- tokens_by_type updated

### Test 11: RWA Hub - Create Compliant RWA Stream

**Objective:** Test end-to-end compliant stream creation

```bash
# Create compliant RWA stream (combines compliance check + stream creation + registration)
octez-client transfer 0 from alice to $RWA_HUB \
  --entrypoint create_compliant_rwa_stream \
  --arg "(Pair (Pair \"$FA2_TOKEN\" 1) (Pair 2000000 (Pair 86400 (Pair 0 \"ipfs://QmRWA456\"))))" \
  --burn-cap 3

# Verify all three operations completed
# 1. Compliance check passed
# 2. Asset yield stream created
# 3. Token registered
```

**Expected Result:**
- Transaction succeeds
- Compliance verified
- Stream created and linked
- Token registered in registry

### Test 12: RWA Hub - Compliant Claim Yield

**Objective:** Claim yield through hub with automatic compliance check

```bash
# Claim yield through hub
octez-client transfer 0 from alice to $RWA_HUB \
  --entrypoint compliant_claim_yield \
  --arg "(Pair \"$FA2_TOKEN\" $TOKEN_ID)" \
  --burn-cap 1
```

**Expected Result:**
- Transaction succeeds
- Compliance checked automatically
- Asset type looked up from registry
- Yield claimed successfully

### Test 13: RWA Hub - Stream Rent to Asset

**Objective:** Create rental stream

```bash
# Bob rents alice's asset (alice owns NFT, bob pays rent)
octez-client transfer 0 from bob to $RWA_HUB \
  --entrypoint stream_rent_to_asset \
  --arg "(Pair (Pair \"$FA2_TOKEN\" $TOKEN_ID) (Pair 500000 86400))" \
  --burn-cap 2

# Verify rental stream created
octez-client get contract storage for $RWA_HUB
```

**Expected Result:**
- Transaction succeeds
- Rental stream created from bob to alice
- active_rentals mapping updated

### Test 14: Compliance Guard - Freeze Stream

**Objective:** Test emergency freeze functionality

```bash
# Freeze a stream (as admin)
octez-client transfer 0 from admin to $COMPLIANCE_GUARD \
  --entrypoint freeze_stream \
  --arg "(Pair $STREAM_ID \"Suspicious activity detected\")" \
  --burn-cap 1

# Try to withdraw (should fail)
octez-client transfer 0 from bob to $STREAMING_PROTOCOL \
  --entrypoint withdraw \
  --arg "$STREAM_ID" \
  --burn-cap 1
```

**Expected Result:**
- Freeze succeeds
- Withdrawal fails with "STREAM_FROZEN" error

### Test 15: Compliance Guard - Unfreeze Stream

**Objective:** Unfreeze stream and resume operations

```bash
# Unfreeze stream (as admin)
octez-client transfer 0 from admin to $COMPLIANCE_GUARD \
  --entrypoint unfreeze_stream \
  --arg "$STREAM_ID" \
  --burn-cap 1

# Try to withdraw again (should succeed)
octez-client transfer 0 from bob to $STREAMING_PROTOCOL \
  --entrypoint withdraw \
  --arg "$STREAM_ID" \
  --burn-cap 1
```

**Expected Result:**
- Unfreeze succeeds
- Withdrawal succeeds
- Stream operational again

## Test Results Checklist

After completing all tests, verify:

- [ ] All 15 tests passed
- [ ] No unexpected errors
- [ ] Storage updates correctly
- [ ] Events emitted properly
- [ ] Gas costs within acceptable ranges
- [ ] Cross-contract calls work
- [ ] Transfer hooks execute
- [ ] Compliance checks enforce correctly
- [ ] Admin functions restricted properly
- [ ] View functions return correct data

## Troubleshooting

### Transaction Fails with "Script_rejected"

- Check parameter format matches contract expectations
- Verify caller has necessary permissions
- Check compliance requirements are met

### "Sender is undefined" Error

- This is a SmartPy version bug (see CHECKPOINT_10_REPORT.md)
- Downgrade to SmartPy 0.18.x stable version

### Storage Query Returns Unexpected Data

- Verify contract address is correct
- Check RPC endpoint is synced
- Use block explorer to inspect storage visually

### Transfer Hook Not Executing

- Verify FA2 token has correct asset_yield_protocol address
- Check transfer parameters are formatted correctly
- Ensure hook entrypoint exists in asset yield protocol

## Next Steps

After successful manual testing:

1. Document any issues found
2. Update contracts if needed
3. Re-deploy and re-test
4. Proceed to frontend integration
5. Perform automated integration tests
6. Prepare for mainnet deployment

## Block Explorer Usage

View all transactions and storage on Ghostnet block explorer:

- Streaming Protocol: https://ghostnet.tzkt.io/{STREAMING_PROTOCOL}
- Asset Yield Protocol: https://ghostnet.tzkt.io/{ASSET_YIELD_PROTOCOL}
- Compliance Guard: https://ghostnet.tzkt.io/{COMPLIANCE_GUARD}
- Token Registry: https://ghostnet.tzkt.io/{TOKEN_REGISTRY}
- FA2 Token: https://ghostnet.tzkt.io/{FA2_TOKEN}
- RWA Hub: https://ghostnet.tzkt.io/{RWA_HUB}

Replace {CONTRACT_ADDRESS} with actual addresses from config/ghostnet.json.

## Support

For testing issues:
- Review contract code in `tezos/contracts/`
- Check test logs and error messages
- Consult Tezos documentation
- Use block explorer to debug transactions
