# Continuum Protocol - Data Migration Tools

This directory contains tools for migrating the Continuum Protocol from Aptos blockchain to Tezos blockchain.

## Overview

The migration process consists of three main scripts:

1. **export_aptos_data.py** - Exports all protocol data from Aptos
2. **import_tezos_data.py** - Imports data into Tezos contracts
3. **verify_migration.py** - Verifies data integrity after migration

## Quick Start

### Installation

```bash
# Install dependencies
pip install -r requirements.txt
```

### Configuration

Update contract addresses in each script before running:

- `export_aptos_data.py` - Set Aptos contract addresses
- `import_tezos_data.py` - Set Tezos contract addresses and admin key

### Basic Usage

```bash
# 1. Export data from Aptos
python export_aptos_data.py --network mainnet --output aptos_export.json

# 2. Import data to Tezos
python import_tezos_data.py --input aptos_export.json --network ghostnet --output tezos_import.json

# 3. Verify migration
python verify_migration.py --aptos-export aptos_export.json --tezos-import tezos_import.json
```

## Documentation

See [how-to-migrate-data-guide.md](../docs/migration/how-to-migrate-data-guide.md) for comprehensive documentation including:

- Detailed setup instructions
- Step-by-step migration process
- Verification procedures
- Troubleshooting guide
- Security considerations
- Migration timeline recommendations

## Scripts

### export_aptos_data.py

Exports all protocol data from Aptos blockchain including streams, NFTs, compliance data, and mappings.

**Usage:**
```bash
python export_aptos_data.py [OPTIONS]

Options:
  --node-url TEXT     Aptos node URL (default: mainnet)
  --output TEXT       Output filename (default: aptos_export.json)
  --network TEXT      Network: mainnet, testnet, or devnet (default: mainnet)
  --help              Show help message
```

**Output:** JSON file containing all exported data

### import_tezos_data.py

Imports exported data into Tezos contracts, recreating all protocol state.

**Usage:**
```bash
python import_tezos_data.py [OPTIONS]

Options:
  --input TEXT        Input JSON file from Aptos export (required)
  --node-url TEXT     Tezos node URL (default: ghostnet)
  --private-key TEXT  Admin private key (or set TEZOS_ADMIN_KEY env var)
  --output TEXT       Output filename (default: tezos_import_results.json)
  --network TEXT      Network: ghostnet or mainnet (default: ghostnet)
  --help              Show help message
```

**Output:** JSON file containing import results and any errors

### verify_migration.py

Compares Aptos export with Tezos import results to verify data integrity.

**Usage:**
```bash
python verify_migration.py [OPTIONS]

Options:
  --aptos-export TEXT  Aptos export JSON file (required)
  --tezos-import TEXT  Tezos import results JSON file (required)
  --output TEXT        Output filename (default: migration_verification_report.json)
  --help               Show help message
```

**Output:** JSON file containing verification report with discrepancies

**Exit Codes:**
- 0: Verification passed (all data matches)
- 1: Verification partially passed (some discrepancies)
- 2: Verification failed (significant discrepancies)

## Data Flow

```
Aptos Blockchain
       ↓
[export_aptos_data.py]
       ↓
aptos_export.json
       ↓
[import_tezos_data.py]
       ↓
Tezos Blockchain + tezos_import_results.json
       ↓
[verify_migration.py]
       ↓
migration_verification_report.json
```

## What Gets Migrated

### Streams
- All stream parameters (sender, recipient, amounts, rates, timestamps)
- Stream status (active, paused, cancelled)
- Amount withdrawn

### NFTs
- Token metadata and URIs
- Current ownership
- Token IDs (new sequential IDs assigned on Tezos)

### Compliance Data
- User identities (KYC status, jurisdiction, verification level)
- Whitelisted asset types per user
- Frozen stream IDs
- Admin addresses

### Mappings
- Asset-to-stream bidirectional mappings
- Token registry entries
- Active rental streams

## Important Notes

### Stream IDs
Stream IDs will be different on Tezos (sequential assignment). The scripts maintain a mapping between old and new IDs.

### Timestamps
Stream start/stop times will be adjusted to the migration time, but duration is preserved.

### Amount Withdrawn
If streams had withdrawals on Aptos, the amount_withdrawn may need manual adjustment on Tezos.

### Security
- **Never commit private keys to version control**
- Use environment variables for sensitive data
- Test on Ghostnet before mainnet migration
- Keep backups of all export data

## Testing

### Test on Ghostnet

Before migrating to mainnet, test the entire process on Ghostnet:

```bash
# 1. Export from Aptos testnet
python export_aptos_data.py --network testnet --output test_export.json

# 2. Import to Tezos Ghostnet
python import_tezos_data.py \
  --input test_export.json \
  --network ghostnet \
  --output test_import.json

# 3. Verify
python verify_migration.py \
  --aptos-export test_export.json \
  --tezos-import test_import.json \
  --output test_verification.json
```

### Dry Run

Perform a dry run with mainnet data on Ghostnet:

```bash
# Export from mainnet
python export_aptos_data.py --network mainnet --output mainnet_export.json

# Import to Ghostnet (using mainnet data)
python import_tezos_data.py \
  --input mainnet_export.json \
  --network ghostnet \
  --output dryrun_import.json

# Verify
python verify_migration.py \
  --aptos-export mainnet_export.json \
  --tezos-import dryrun_import.json
```

## Troubleshooting

### Export Issues

**Problem:** "Resource not found" error

**Solution:** Verify contract addresses are correct and Aptos node is accessible

### Import Issues

**Problem:** "Insufficient balance" error

**Solution:** Ensure admin account has sufficient XTZ for gas fees

### Verification Issues

**Problem:** Many discrepancies reported

**Solution:** Review specific discrepancies in the report. Some differences (IDs, timestamps) are expected.

## Support

For issues or questions:
- See [how-to-migrate-data-guide.md](../docs/migration/how-to-migrate-data-guide.md) for detailed documentation
- Check error messages in import results JSON
- Review verification report for specific discrepancies
- Contact the development team

## License

Copyright © 2024 Continuum Protocol
