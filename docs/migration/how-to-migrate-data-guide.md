# Continuum Protocol - Aptos to Tezos Migration Guide

## Overview

This guide provides comprehensive instructions for migrating the Continuum Protocol from Aptos blockchain to Tezos blockchain. The migration involves three main phases:

1. **Data Export** - Export all protocol data from Aptos
2. **Data Import** - Import data into Tezos contracts
3. **Verification** - Verify data integrity and consistency

## Prerequisites

### Software Requirements

- Python 3.8 or higher
- Aptos SDK for Python (`aptos-sdk`)
- PyTezos library (`pytezos`)
- Access to Aptos node (mainnet/testnet)
- Access to Tezos node (Ghostnet/Mainnet)
- Admin private key for Tezos contracts

### Installation

```bash
# Install Python dependencies
pip install aptos-sdk pytezos

# Or use the provided requirements file
pip install -r migration/requirements.txt
```

### Configuration

Before running the migration scripts, update the contract addresses in each script:

**In `export_aptos_data.py`:**
```python
STREAMING_PROTOCOL_ADDRESS = "0x..."  # Your Aptos address
ASSET_YIELD_PROTOCOL_ADDRESS = "0x..."
COMPLIANCE_GUARD_ADDRESS = "0x..."
TOKEN_REGISTRY_ADDRESS = "0x..."
RWA_HUB_ADDRESS = "0x..."
FA2_TOKEN_ADDRESS = "0x..."
```

**In `import_tezos_data.py`:**
```python
STREAMING_PROTOCOL_ADDRESS = "KT1..."  # Your Tezos address
ASSET_YIELD_PROTOCOL_ADDRESS = "KT1..."
COMPLIANCE_GUARD_ADDRESS = "KT1..."
TOKEN_REGISTRY_ADDRESS = "KT1..."
RWA_HUB_ADDRESS = "KT1..."
FA2_TOKEN_ADDRESS = "KT1..."
```

## Phase 1: Data Export from Aptos

### Export Process

The export script queries all protocol data from Aptos blockchain and saves it to a JSON file.

#### Step 1: Configure Export Parameters

```bash
# Set Aptos node URL (mainnet, testnet, or devnet)
export APTOS_NODE_URL="https://fullnode.mainnet.aptoslabs.com/v1"

# Or use command line arguments
```

#### Step 2: Run Export Script

```bash
# Export from mainnet
python migration/export_aptos_data.py \
  --network mainnet \
  --output aptos_export_mainnet.json

# Export from testnet
python migration/export_aptos_data.py \
  --network testnet \
  --node-url https://fullnode.testnet.aptoslabs.com/v1 \
  --output aptos_export_testnet.json
```

#### Step 3: Review Export Data

The export script will display a summary:

```
EXPORT SUMMARY
==============================================================
Streams:           42
NFTs:              15
Identities:        28
Frozen Streams:    2
Admins:            3
Asset Mappings:    15
Registered Tokens: 15
Active Rentals:    5
==============================================================
```

#### Step 4: Validate Export File

```bash
# Check the export file is valid JSON
python -m json.tool aptos_export_mainnet.json > /dev/null && echo "Valid JSON"

# View export summary
cat aptos_export_mainnet.json | jq '.metadata.summary'
```

### What Gets Exported

The export includes:

- **Streams**: All stream parameters (sender, recipient, token info, amounts, rates, timestamps, status)
- **NFTs**: Token IDs, owners, metadata URIs
- **Compliance Data**: 
  - User identities (KYC status, jurisdiction, verification level, expiry)
  - Whitelisted asset types per user
  - Frozen stream IDs and reasons
  - Admin addresses
- **Asset Mappings**: Bidirectional NFT ↔ Stream mappings
- **Token Registry**: All registered tokens with asset types and metadata
- **Active Rentals**: Token addresses mapped to rental stream IDs

### Export Limitations

**Note**: The Aptos export script uses event-based queries. For complete data:

1. **Use Aptos Indexer API** for production migrations to ensure all data is captured
2. **Verify event completeness** - some events may be pruned on older nodes
3. **Cross-reference with contract storage** - query Tables directly if possible

## Phase 2: Data Import to Tezos

### Import Process

The import script reads the exported JSON and recreates all protocol state on Tezos.

#### Step 1: Prepare Tezos Environment

```bash
# Set admin private key (use environment variable for security)
export TEZOS_ADMIN_KEY="edsk..."

# Or use a key file
export TEZOS_ADMIN_KEY=$(cat ~/.tezos/admin_key.txt)
```

**Security Warning**: Never commit private keys to version control. Use environment variables or secure key management systems.

#### Step 2: Deploy Tezos Contracts

Before importing data, ensure all Tezos contracts are deployed:

```bash
# Deploy to Ghostnet (for testing)
cd tezos/scripts
python deploy_ghostnet.py

# Deploy to Mainnet (for production)
python deploy_mainnet.py
```

Update the contract addresses in `import_tezos_data.py` with the deployed addresses.

#### Step 3: Run Import Script

```bash
# Import to Ghostnet (testing)
python migration/import_tezos_data.py \
  --input aptos_export_mainnet.json \
  --network ghostnet \
  --node-url https://ghostnet.tezos.marigold.dev \
  --output tezos_import_results.json

# Import to Mainnet (production)
python migration/import_tezos_data.py \
  --input aptos_export_mainnet.json \
  --network mainnet \
  --node-url https://mainnet.tezos.marigold.dev \
  --private-key $TEZOS_ADMIN_KEY \
  --output tezos_import_results_mainnet.json
```

#### Step 4: Monitor Import Progress

The import script will display progress for each category:

```
CONTINUUM PROTOCOL - TEZOS DATA IMPORT
==============================================================

Importing compliance admins...
  Adding admin tz1abc... (op: oo123...)
✓ Added 3/3 admins

Importing compliance identities...
  Registering identity for tz1def... (op: oo456...)
✓ Registered 28/28 identities

Minting NFTs...
  Minting NFT to tz1ghi... (op: oo789...)
✓ Minted 15/15 NFTs

...
```

#### Step 5: Review Import Results

```bash
# View import summary
cat tezos_import_results.json | jq '.metadata'

# Check for errors
cat tezos_import_results.json | jq '.errors'
```

### Import Order

The import follows a specific dependency order:

1. **Admins** - Added first (required for other operations)
2. **Compliance Identities** - KYC data and whitelisting
3. **NFTs** - Minted with original metadata and ownership
4. **Streams** - Recreated with preserved parameters
5. **Asset Mappings** - Created automatically through asset yield protocol
6. **Token Registry** - Tokens registered with asset types
7. **Frozen Streams** - Streams marked as frozen
8. **Active Rentals** - Rental streams recreated

### Import Considerations

#### Stream Parameters

- **New Stream IDs**: Tezos will assign new sequential stream IDs
- **Timestamps**: Start/stop times will be adjusted to migration time
- **Duration Preserved**: The duration (stop_time - start_time) is maintained
- **Amount Withdrawn**: If a stream had withdrawals on Aptos, this may need manual adjustment

#### NFT Ownership

- **Original Owners**: NFTs are minted to their original Aptos owners
- **Token IDs**: New sequential token IDs are assigned on Tezos
- **Metadata**: Metadata URIs are preserved exactly

#### Compliance Data

- **KYC Expiry**: Expiry times are preserved, but may need updating if migration takes time
- **Whitelisting**: Asset type permissions are recreated exactly
- **Frozen Streams**: Streams frozen on Aptos are frozen on Tezos with migration note

## Phase 3: Verification

### Verification Process

The verification script compares Aptos export with Tezos import results to ensure data integrity.

#### Step 1: Run Verification

```bash
python migration/verify_migration.py \
  --aptos-export aptos_export_mainnet.json \
  --tezos-import tezos_import_results_mainnet.json \
  --output migration_verification_report.json
```

#### Step 2: Review Verification Report

```
VERIFICATION SUMMARY
==============================================================

Overall Status: ✓ PASSED

Category Results:
  Streams:           42/42
  NFTs:              15/15
  Identities:        28/28
  Frozen Streams:    2/2
  Admins:            3/3
  Token Registry:    15/15

Total Discrepancies: 0
==============================================================
```

#### Step 3: Investigate Discrepancies

If discrepancies are found:

```bash
# View detailed discrepancies
cat migration_verification_report.json | jq '.streams.discrepancies'
cat migration_verification_report.json | jq '.nfts.discrepancies'
cat migration_verification_report.json | jq '.compliance.identities.discrepancies'
```

### Verification Checks

The verification tool checks:

1. **Stream Parameters**:
   - Sender, recipient, token addresses match
   - Total amount and flow rate match
   - Duration matches (within 60 second tolerance)
   - Status is preserved

2. **NFT Data**:
   - Ownership matches
   - Metadata URIs match
   - All NFTs are accounted for

3. **Compliance Data**:
   - All identities registered
   - Jurisdiction and verification levels match
   - Whitelisted asset types match
   - Frozen streams match
   - Admin list matches

4. **Token Registry**:
   - All tokens registered
   - Asset types match
   - Metadata URIs match

### Handling Discrepancies

#### Missing Items

If items are missing from Tezos:
1. Check import errors in `tezos_import_results.json`
2. Re-run import for specific items
3. Manually create missing items if needed

#### Parameter Mismatches

If parameters don't match:
1. Review the specific discrepancy in the report
2. Determine if it's acceptable (e.g., timestamp differences)
3. Manually correct if needed using admin functions

#### Acceptable Differences

Some differences are expected:
- **Stream IDs**: Will be different on Tezos (sequential assignment)
- **Token IDs**: Will be different on Tezos (sequential assignment)
- **Timestamps**: Start/stop times adjusted to migration time
- **Block Heights**: Not applicable on Tezos

## Migration Timeline

### Recommended Timeline

**Week 1-2: Preparation**
- Deploy contracts to Ghostnet
- Test export script on Aptos testnet
- Test import script on Ghostnet
- Run verification and fix any issues

**Week 3: Dry Run**
- Export mainnet data
- Import to Ghostnet (using mainnet data)
- Verify data integrity
- Document any issues

**Week 4: Production Migration**
- Schedule maintenance window
- Announce migration to users
- Export mainnet data
- Deploy contracts to Tezos mainnet
- Import data to mainnet
- Verify data integrity
- Update frontend to point to Tezos
- Announce migration completion

### Maintenance Window

Recommended maintenance window: **4-6 hours**

During this time:
1. Freeze all operations on Aptos (0-15 min)
2. Export final data snapshot (15-30 min)
3. Import to Tezos mainnet (1-3 hours)
4. Verify data integrity (30-60 min)
5. Update frontend configuration (15-30 min)
6. Test critical flows (30-60 min)
7. Announce completion (15 min)

## Rollback Procedures

### If Migration Fails

1. **Keep Aptos contracts active** - Don't shut down until Tezos is verified
2. **Revert frontend** - Point back to Aptos contracts
3. **Investigate issues** - Review error logs and verification report
4. **Fix and retry** - Address issues and re-run import

### Partial Migration

If only some data imports successfully:
1. **Don't panic** - Partial state is expected during migration
2. **Review errors** - Check `tezos_import_results.json` for specific failures
3. **Re-run specific imports** - Import missing items individually
4. **Verify again** - Run verification after each fix

## Post-Migration Tasks

### Immediate (Day 1)

- [ ] Verify all critical flows work on Tezos
- [ ] Monitor for errors and user reports
- [ ] Update documentation with Tezos addresses
- [ ] Announce migration completion to users

### Short-term (Week 1)

- [ ] Monitor gas costs and optimize if needed
- [ ] Verify all users can access their assets
- [ ] Test all admin functions
- [ ] Update block explorer links

### Long-term (Month 1)

- [ ] Sunset Aptos contracts (after grace period)
- [ ] Archive Aptos data for reference
- [ ] Update all external integrations
- [ ] Conduct post-migration review

## Troubleshooting

### Common Issues

#### Export Script Fails

**Problem**: "Error exporting streams: Resource not found"

**Solution**: 
- Verify contract addresses are correct
- Check Aptos node is accessible
- Try using Aptos Indexer API instead of direct queries

#### Import Script Fails

**Problem**: "Error: Insufficient balance"

**Solution**:
- Ensure admin account has sufficient XTZ for gas
- Batch operations in smaller groups
- Increase gas limits if needed

#### Verification Shows Discrepancies

**Problem**: "Stream parameters mismatch"

**Solution**:
- Review specific discrepancy details
- Check if difference is acceptable (timestamps, IDs)
- Manually correct if needed using admin functions

#### NFT Ownership Incorrect

**Problem**: "NFT owner mismatch"

**Solution**:
- Check if NFT was transferred during migration window
- Use FA2 transfer to correct ownership
- Update asset-stream mapping if needed

### Getting Help

If you encounter issues:

1. **Check logs**: Review error messages in import results
2. **Review verification report**: Identify specific discrepancies
3. **Consult documentation**: Check contract documentation for admin functions
4. **Contact support**: Reach out to the development team

## Security Considerations

### Private Key Management

- **Never commit keys to git**
- **Use environment variables** for keys in scripts
- **Use hardware wallets** for mainnet admin keys
- **Rotate keys** after migration if exposed

### Access Control

- **Limit admin access** during migration
- **Use multi-sig** for mainnet admin operations
- **Audit all operations** during migration
- **Revoke temporary access** after migration

### Data Validation

- **Verify checksums** of export files
- **Compare totals** before and after migration
- **Test with small subset** before full migration
- **Keep backups** of all export data

## Appendix

### Script Reference

#### export_aptos_data.py

```bash
python migration/export_aptos_data.py --help

Options:
  --node-url TEXT     Aptos node URL
  --output TEXT       Output filename
  --network TEXT      Aptos network (mainnet/testnet/devnet)
```

#### import_tezos_data.py

```bash
python migration/import_tezos_data.py --help

Options:
  --input TEXT        Input JSON file from Aptos export
  --node-url TEXT     Tezos node URL
  --private-key TEXT  Admin private key
  --output TEXT       Output filename for import results
  --network TEXT      Tezos network (ghostnet/mainnet)
```

#### verify_migration.py

```bash
python migration/verify_migration.py --help

Options:
  --aptos-export TEXT   Aptos export JSON file
  --tezos-import TEXT   Tezos import results JSON file
  --output TEXT         Output filename for verification report
```

### File Formats

#### Aptos Export JSON Structure

```json
{
  "metadata": {
    "export_timestamp": "2024-01-15T10:30:00Z",
    "aptos_network": "mainnet",
    "summary": { ... }
  },
  "streams": [ ... ],
  "nfts": [ ... ],
  "compliance": {
    "identities": [ ... ],
    "frozen_streams": [ ... ],
    "admins": [ ... ]
  },
  "asset_mappings": { ... },
  "token_registry": [ ... ],
  "active_rentals": { ... }
}
```

#### Tezos Import Results JSON Structure

```json
{
  "metadata": {
    "import_timestamp": "2024-01-15T12:00:00Z",
    "tezos_network": "mainnet"
  },
  "streams_created": [ ... ],
  "nfts_minted": [ ... ],
  "identities_registered": [ ... ],
  "streams_frozen": [ ... ],
  "admins_added": [ ... ],
  "tokens_registered": [ ... ],
  "rentals_created": [ ... ],
  "errors": [ ... ]
}
```

#### Verification Report JSON Structure

```json
{
  "metadata": {
    "verification_timestamp": "2024-01-15T13:00:00Z",
    "status": "passed"
  },
  "streams": {
    "total_aptos": 42,
    "total_tezos": 42,
    "matched": 42,
    "discrepancies": [ ... ]
  },
  ...
  "summary": {
    "total_checks": 6,
    "passed_checks": 6,
    "failed_checks": 0,
    "warnings": [ ... ]
  }
}
```

### Contact Information

For migration support:
- **Documentation**: See `/docs` directory
- **Issues**: Open a GitHub issue
- **Email**: support@continuum-protocol.io
- **Discord**: Join our community server

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
