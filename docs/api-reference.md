# Continuum Protocol API Reference

Complete reference documentation for all smart contract entrypoints, view functions, and data types in the Continuum Protocol on Tezos.

## Table of Contents

1. [Streaming Protocol Contract](#streaming-protocol-contract)
2. [Asset Yield Protocol Contract](#asset-yield-protocol-contract)
3. [Compliance Guard Contract](#compliance-guard-contract)
4. [Token Registry Contract](#token-registry-contract)
5. [RWA Hub Contract](#rwa-hub-contract)
6. [FA2 Token Contract](#fa2-token-contract)
7. [Data Types](#data-types)
8. [Error Codes](#error-codes)
9. [Events](#events)
10. [Code Examples](#code-examples)

## Overview

The Continuum Protocol consists of six main smart contracts that work together to enable RWA tokenization with continuous yield streaming. All contracts are written in SmartPy and deployed on Tezos.

### Contract Addresses

**Ghostnet (Testnet)**:
- Streaming Protocol: `KT1...` (see deployment config)
- Asset Yield Protocol: `KT1...`
- Compliance Guard: `KT1...`
- Token Registry: `KT1...`
- RWA Hub: `KT1...`
- FA2 Token: `KT1...`

**Mainnet (Production)**:
- Streaming Protocol: `KT1...` (see deployment config)
- Asset Yield Protocol: `KT1...`
- Compliance Guard: `KT1...`
- Token Registry: `KT1...`
- RWA Hub: `KT1...`
- FA2 Token: `KT1...`

---

## Streaming Protocol Contract

Core contract for time-based token streaming with escrow functionality.

### Entrypoints

#### `create_stream`

Creates a new payment stream with tokens locked in escrow.

**Parameters**:
```python
{
  "recipient": "tz1...",        # Address (recipient of the stream)
  "token_address": "KT1...",    # Address (FA2 contract)
  "token_id": 0,                # Nat (FA2 token ID)
  "flow_rate": 1000,            # Nat (tokens per second)
  "duration": 2592000,          # Nat (duration in seconds)
  "total_amount": 2592000000    # Nat (total tokens to stream)
}
```

**Returns**: `stream_id` (Nat)

**Requirements**:
- `total_amount > 0`
- `duration > 0`
- `flow_rate > 0`
- `total_amount = flow_rate * duration`
- Caller must have approved token transfer

**Gas Cost**: ~45,000 gas


**Example**:
```typescript
import { TezosToolkit } from '@taquito/taquito';

const tezos = new TezosToolkit('https://ghostnet.ecadinfra.com');
const contract = await tezos.contract.at('KT1...');

const op = await contract.methods.create_stream(
  'tz1RecipientAddress...',
  'KT1TokenAddress...',
  0,
  1000,
  2592000,
  2592000000
).send();

await op.confirmation();
console.log('Stream ID:', op.results[0].storage.next_stream_id - 1);
```

#### `withdraw`

Allows the stream recipient to claim accumulated tokens.

**Parameters**:
```python
{
  "stream_id": 42  # Nat (ID of the stream)
}
```

**Returns**: None (transfers tokens to recipient)

**Requirements**:
- Stream must exist
- Caller must be stream recipient
- Claimable balance must be > 0
- Stream must not be frozen

**Gas Cost**: ~28,000 gas

**Example**:
```typescript
const op = await contract.methods.withdraw(42).send();
await op.confirmation();
```

#### `flash_advance`

Immediately withdraws future yield from a stream.

**Parameters**:
```python
{
  "stream_id": 42,          # Nat (ID of the stream)
  "amount_requested": 50000 # Nat (amount to advance)
}
```

**Returns**: None (transfers tokens immediately)

**Requirements**:
- Stream must exist
- Caller must be stream recipient
- `amount_requested <= (total_amount - amount_withdrawn)`
- Stream must not be frozen

**Gas Cost**: ~32,000 gas

**Example**:
```typescript
const op = await contract.methods.flash_advance(42, 50000).send();
await op.confirmation();
```


#### `cancel_stream`

Cancels a stream and refunds remaining balance to sender.

**Parameters**:
```python
{
  "stream_id": 42  # Nat (ID of the stream)
}
```

**Returns**: None (refunds remaining tokens to sender)

**Requirements**:
- Stream must exist
- Caller must be sender or recipient
- Stream must not already be cancelled

**Gas Cost**: ~30,000 gas

**Example**:
```typescript
const op = await contract.methods.cancel_stream(42).send();
await op.confirmation();
```

### View Functions

#### `get_claimable_balance`

Returns the current claimable balance for a stream.

**Parameters**:
```python
{
  "stream_id": 42  # Nat
}
```

**Returns**: `Nat` (claimable balance in tokens)

**Calculation**: `min((current_time - start_time) * flow_rate, total_amount) - amount_withdrawn`

**Example**:
```typescript
const storage = await contract.storage();
const claimable = await storage.get_claimable_balance(42);
console.log('Claimable:', claimable.toNumber());
```

#### `get_stream_info`

Returns complete information about a stream.

**Parameters**:
```python
{
  "stream_id": 42  # Nat
}
```

**Returns**:
```python
{
  "sender": "tz1...",
  "recipient": "tz1...",
  "token_address": "KT1...",
  "token_id": 0,
  "total_amount": 2592000000,
  "flow_rate": 1000,
  "start_time": "2026-01-01T00:00:00Z",
  "stop_time": "2026-02-01T00:00:00Z",
  "amount_withdrawn": 500000,
  "status": 0  # 0=active, 1=paused, 2=cancelled, 3=depleted
}
```

**Example**:
```typescript
const storage = await contract.storage();
const streamInfo = await storage.get_stream_info(42);
console.log('Stream:', streamInfo);
```


#### `get_escrow_balance`

Returns remaining tokens in escrow for a stream.

**Parameters**:
```python
{
  "stream_id": 42  # Nat
}
```

**Returns**: `Nat` (remaining escrow balance)

**Calculation**: `total_amount - amount_withdrawn`

**Example**:
```typescript
const storage = await contract.storage();
const escrow = await storage.get_escrow_balance(42);
console.log('Escrow:', escrow.toNumber());
```

---

## Asset Yield Protocol Contract

Links FA2 NFTs to yield streams and manages automatic recipient updates.

### Entrypoints

#### `create_asset_yield_stream`

Creates a yield stream linked to an NFT.

**Parameters**:
```python
{
  "token_address": "KT1...",  # Address (NFT contract)
  "total_yield": 1000000,     # Nat (total yield to distribute)
  "duration": 31536000        # Nat (duration in seconds, e.g., 1 year)
}
```

**Returns**: `stream_id` (Nat)

**Requirements**:
- Caller must own the NFT
- NFT must not already have a linked stream
- `total_yield > 0`
- `duration > 0`

**Gas Cost**: ~55,000 gas

**Example**:
```typescript
const contract = await tezos.contract.at('KT1AssetYieldProtocol...');
const op = await contract.methods.create_asset_yield_stream(
  'KT1NFTContract...',
  1000000,
  31536000
).send();
await op.confirmation();
```

#### `claim_yield_for_asset`

Claims accumulated yield for an NFT owner.

**Parameters**:
```python
{
  "token_address": "KT1..."  # Address (NFT contract)
}
```

**Returns**: None (transfers yield to caller)

**Requirements**:
- Caller must own the NFT
- NFT must have a linked stream
- Claimable balance must be > 0

**Gas Cost**: ~35,000 gas

**Example**:
```typescript
const op = await contract.methods.claim_yield_for_asset('KT1NFT...').send();
await op.confirmation();
```


#### `flash_advance_rwa_yield`

Flash advances future yield for an NFT owner.

**Parameters**:
```python
{
  "token_address": "KT1...",    # Address (NFT contract)
  "amount_requested": 50000     # Nat (amount to advance)
}
```

**Returns**: None (transfers tokens immediately)

**Requirements**:
- Caller must own the NFT
- NFT must have a linked stream
- `amount_requested <= remaining_yield`

**Gas Cost**: ~38,000 gas

**Example**:
```typescript
const op = await contract.methods.flash_advance_rwa_yield(
  'KT1NFT...',
  50000
).send();
await op.confirmation();
```

#### `update_stream_recipient`

Updates stream recipient when NFT is transferred (called by FA2 hook).

**Parameters**:
```python
{
  "token_address": "KT1...",  # Address (NFT contract)
  "new_owner": "tz1..."       # Address (new NFT owner)
}
```

**Returns**: None (updates stream recipient)

**Requirements**:
- Called automatically by FA2 transfer hook
- NFT must have a linked stream

**Gas Cost**: ~25,000 gas

**Note**: This is typically called automatically and not directly by users.

### View Functions

#### `get_stream_for_asset`

Returns the stream ID linked to an NFT.

**Parameters**:
```python
{
  "token_address": "KT1..."  # Address
}
```

**Returns**: `Nat` (stream_id) or `None` if not linked

**Example**:
```typescript
const storage = await contract.storage();
const streamId = await storage.get_stream_for_asset('KT1NFT...');
console.log('Stream ID:', streamId);
```


#### `get_asset_for_stream`

Returns the NFT address linked to a stream.

**Parameters**:
```python
{
  "stream_id": 42  # Nat
}
```

**Returns**: `Address` (token_address) or `None` if not linked

**Example**:
```typescript
const storage = await contract.storage();
const nftAddress = await storage.get_asset_for_stream(42);
console.log('NFT Address:', nftAddress);
```

#### `get_claimable_yield`

Returns claimable yield for an NFT.

**Parameters**:
```python
{
  "token_address": "KT1..."  # Address
}
```

**Returns**: `Nat` (claimable balance)

**Example**:
```typescript
const storage = await contract.storage();
const claimable = await storage.get_claimable_yield('KT1NFT...');
console.log('Claimable Yield:', claimable.toNumber());
```

---

## Compliance Guard Contract

Enforces KYC/AML requirements and provides emergency freeze capabilities.

### Entrypoints

#### `register_identity`

Registers KYC information for a user (admin only).

**Parameters**:
```python
{
  "user": "tz1...",                    # Address
  "jurisdiction": "US",                # String (ISO 3166-1 alpha-2)
  "verification_level": 1,             # Nat (0=basic, 1=enhanced, 2=institutional)
  "expiry_time": "2027-01-01T00:00:00Z"  # Timestamp
}
```

**Returns**: None

**Requirements**:
- Caller must be admin
- `verification_level` must be 0, 1, or 2

**Gas Cost**: ~22,000 gas

**Example**:
```typescript
const contract = await tezos.contract.at('KT1ComplianceGuard...');
const op = await contract.methods.register_identity(
  'tz1User...',
  'US',
  1,
  '2027-01-01T00:00:00Z'
).send();
await op.confirmation();
```


#### `whitelist_address`

Grants user access to specific asset types (admin only).

**Parameters**:
```python
{
  "user": "tz1...",        # Address
  "asset_types": [0, 1, 2] # List[Nat] (0=real_estate, 1=vehicles, 2=commodities)
}
```

**Returns**: None

**Requirements**:
- Caller must be admin
- User must have valid KYC
- Asset types must be 0, 1, or 2

**Gas Cost**: ~20,000 gas + (5,000 gas per asset type)

**Example**:
```typescript
const op = await contract.methods.whitelist_address(
  'tz1User...',
  [0, 1]  // Whitelist for real estate and vehicles
).send();
await op.confirmation();
```

#### `freeze_stream`

Emergency freeze of a stream (admin only).

**Parameters**:
```python
{
  "stream_id": 42,                    # Nat
  "reason": "Suspicious activity"     # String
}
```

**Returns**: None

**Requirements**:
- Caller must be admin
- Stream must exist

**Gas Cost**: ~18,000 gas

**Example**:
```typescript
const op = await contract.methods.freeze_stream(
  42,
  'Suspicious activity detected'
).send();
await op.confirmation();
```

#### `unfreeze_stream`

Removes freeze on a stream (admin only).

**Parameters**:
```python
{
  "stream_id": 42  # Nat
}
```

**Returns**: None

**Requirements**:
- Caller must be admin
- Stream must be frozen

**Gas Cost**: ~16,000 gas

**Example**:
```typescript
const op = await contract.methods.unfreeze_stream(42).send();
await op.confirmation();
```


#### `add_admin`

Adds a new administrator (admin only).

**Parameters**:
```python
{
  "new_admin": "tz1..."  # Address
}
```

**Returns**: None

**Requirements**:
- Caller must be admin

**Gas Cost**: ~15,000 gas

**Example**:
```typescript
const op = await contract.methods.add_admin('tz1NewAdmin...').send();
await op.confirmation();
```

### View Functions

#### `is_authorized_recipient`

Checks if a user is authorized for an asset type.

**Parameters**:
```python
{
  "user": "tz1...",     # Address
  "asset_type": 0       # Nat
}
```

**Returns**: `Bool` (true if authorized)

**Authorization Logic**: `is_verified AND current_time < expiry_time AND asset_type IN whitelisted_asset_types`

**Example**:
```typescript
const storage = await contract.storage();
const isAuthorized = await storage.is_authorized_recipient('tz1User...', 0);
console.log('Authorized:', isAuthorized);
```

#### `is_stream_frozen`

Checks if a stream is frozen.

**Parameters**:
```python
{
  "stream_id": 42  # Nat
}
```

**Returns**: `Bool` (true if frozen)

**Example**:
```typescript
const storage = await contract.storage();
const isFrozen = await storage.is_stream_frozen(42);
console.log('Frozen:', isFrozen);
```

#### `has_valid_kyc`

Checks if a user has valid KYC.

**Parameters**:
```python
{
  "user": "tz1..."  # Address
}
```

**Returns**: `Bool` (true if KYC is verified and not expired)

**Example**:
```typescript
const storage = await contract.storage();
const hasKYC = await storage.has_valid_kyc('tz1User...');
console.log('Has Valid KYC:', hasKYC);
```


#### `is_admin`

Checks if an address is an administrator.

**Parameters**:
```python
{
  "user": "tz1..."  # Address
}
```

**Returns**: `Bool` (true if admin)

**Example**:
```typescript
const storage = await contract.storage();
const isAdmin = await storage.is_admin('tz1User...');
console.log('Is Admin:', isAdmin);
```

---

## Token Registry Contract

Global registry of all RWA NFTs for marketplace discovery.

### Entrypoints

#### `register_token`

Registers a new RWA NFT in the global registry.

**Parameters**:
```python
{
  "token_address": "KT1...",              # Address (NFT contract)
  "asset_type": 0,                        # Nat (0=real_estate, 1=vehicles, 2=commodities)
  "stream_id": 42,                        # Nat (linked yield stream)
  "metadata_uri": "ipfs://QmXxx..."       # String (IPFS or HTTP URL)
}
```

**Returns**: None

**Requirements**:
- Token must not already be registered
- Asset type must be 0, 1, or 2

**Gas Cost**: ~25,000 gas

**Example**:
```typescript
const contract = await tezos.contract.at('KT1TokenRegistry...');
const op = await contract.methods.register_token(
  'KT1NFT...',
  0,  // Real estate
  42,
  'ipfs://QmXxx...'
).send();
await op.confirmation();
```

### View Functions

#### `get_token`

Returns information about a registered token.

**Parameters**:
```python
{
  "token_address": "KT1..."  # Address
}
```

**Returns**:
```python
{
  "asset_type": 0,
  "stream_id": 42,
  "metadata_uri": "ipfs://QmXxx...",
  "registration_time": "2026-01-01T00:00:00Z"
}
```

**Example**:
```typescript
const storage = await contract.storage();
const tokenInfo = await storage.get_token('KT1NFT...');
console.log('Token Info:', tokenInfo);
```


#### `get_token_by_stream_id`

Returns the token address for a stream.

**Parameters**:
```python
{
  "stream_id": 42  # Nat
}
```

**Returns**: `Address` (token_address) or `None`

**Example**:
```typescript
const storage = await contract.storage();
const tokenAddress = await storage.get_token_by_stream_id(42);
console.log('Token Address:', tokenAddress);
```

#### `get_tokens_by_type`

Returns all tokens of a specific asset type.

**Parameters**:
```python
{
  "asset_type": 0  # Nat
}
```

**Returns**: `Set[Address]` (set of token addresses)

**Example**:
```typescript
const storage = await contract.storage();
const tokens = await storage.get_tokens_by_type(0);
console.log('Real Estate Tokens:', tokens);
```

#### `get_all_tokens_paginated`

Returns a paginated list of all registered tokens.

**Parameters**:
```python
{
  "offset": 0,   # Nat (starting index)
  "limit": 20    # Nat (number of tokens to return)
}
```

**Returns**: `List[TokenEntry]` (list of token information)

**Example**:
```typescript
const storage = await contract.storage();
const tokens = await storage.get_all_tokens_paginated(0, 20);
console.log('Tokens:', tokens);
```

#### `get_token_count`

Returns the total number of registered tokens.

**Parameters**: None

**Returns**: `Nat` (total count)

**Example**:
```typescript
const storage = await contract.storage();
const count = await storage.get_token_count();
console.log('Total Tokens:', count.toNumber());
```


#### `get_asset_type_by_token`

Returns the asset type for a token.

**Parameters**:
```python
{
  "token_address": "KT1..."  # Address
}
```

**Returns**: `Nat` (asset_type) or `None`

**Example**:
```typescript
const storage = await contract.storage();
const assetType = await storage.get_asset_type_by_token('KT1NFT...');
console.log('Asset Type:', assetType);
```

---

## RWA Hub Contract

Main orchestrator coordinating all protocol components.

### Entrypoints

#### `create_compliant_rwa_stream`

One-stop function to create a compliant RWA stream with automatic compliance checks.

**Parameters**:
```python
{
  "token_address": "KT1...",          # Address (NFT contract)
  "total_yield": 1000000,             # Nat (total yield to distribute)
  "duration": 31536000,               # Nat (duration in seconds)
  "asset_type": 0,                    # Nat (0=real_estate, 1=vehicles, 2=commodities)
  "metadata_uri": "ipfs://QmXxx..."   # String (metadata URL)
}
```

**Returns**: `stream_id` (Nat)

**Requirements**:
- Caller must have valid KYC
- Caller must be whitelisted for asset_type
- Caller must own the NFT
- All parameters must be valid

**Gas Cost**: ~75,000 gas

**Example**:
```typescript
const contract = await tezos.contract.at('KT1RWAHub...');
const op = await contract.methods.create_compliant_rwa_stream(
  'KT1NFT...',
  1000000,
  31536000,
  0,  // Real estate
  'ipfs://QmXxx...'
).send();
await op.confirmation();
```

#### `compliant_claim_yield`

Claims yield with automatic compliance check and asset type lookup.

**Parameters**:
```python
{
  "token_address": "KT1..."  # Address (NFT contract)
}
```

**Returns**: None (transfers yield to caller)

**Requirements**:
- Caller must own the NFT
- Caller must have valid KYC
- Caller must be whitelisted for the asset's type
- Claimable balance must be > 0

**Gas Cost**: ~42,000 gas

**Example**:
```typescript
const op = await contract.methods.compliant_claim_yield('KT1NFT...').send();
await op.confirmation();
```


#### `compliant_flash_advance`

Flash advances yield with automatic compliance check.

**Parameters**:
```python
{
  "token_address": "KT1...",    # Address (NFT contract)
  "amount_requested": 50000     # Nat (amount to advance)
}
```

**Returns**: None (transfers tokens immediately)

**Requirements**:
- Caller must own the NFT
- Caller must have valid KYC
- Caller must be whitelisted for the asset's type
- `amount_requested <= remaining_yield`

**Gas Cost**: ~45,000 gas

**Example**:
```typescript
const op = await contract.methods.compliant_flash_advance(
  'KT1NFT...',
  50000
).send();
await op.confirmation();
```

#### `stream_rent_to_asset`

Creates a rental payment stream from tenant to current asset owner.

**Parameters**:
```python
{
  "token_address": "KT1...",  # Address (NFT contract)
  "payment_amount": 3000,     # Nat (total rent payment)
  "duration": 2592000         # Nat (rental duration in seconds)
}
```

**Returns**: `stream_id` (Nat)

**Requirements**:
- NFT must exist
- Caller (tenant) must have approved token transfer
- `payment_amount > 0`
- `duration > 0`

**Gas Cost**: ~60,000 gas

**Example**:
```typescript
const op = await contract.methods.stream_rent_to_asset(
  'KT1NFT...',
  3000,
  2592000  // 30 days
).send();
await op.confirmation();
```

#### `emergency_freeze`

Emergency freeze of a stream (admin only).

**Parameters**:
```python
{
  "stream_id": 42,                    # Nat
  "reason": "Suspicious activity"     # String
}
```

**Returns**: None

**Requirements**:
- Caller must be admin

**Gas Cost**: ~20,000 gas

**Example**:
```typescript
const op = await contract.methods.emergency_freeze(
  42,
  'Suspicious activity'
).send();
await op.confirmation();
```


#### `batch_whitelist`

Batch whitelists multiple users for asset types (admin only).

**Parameters**:
```python
{
  "users": ["tz1...", "tz1...", "tz1..."],  # List[Address]
  "asset_types": [0, 1, 2]                   # List[Nat]
}
```

**Returns**: None

**Requirements**:
- Caller must be admin
- All users must have valid KYC

**Gas Cost**: ~30,000 gas + (10,000 gas per user)

**Example**:
```typescript
const op = await contract.methods.batch_whitelist(
  ['tz1User1...', 'tz1User2...', 'tz1User3...'],
  [0, 1]  // Real estate and vehicles
).send();
await op.confirmation();
```

### View Functions

#### `can_participate`

Checks if a user can participate in the RWA ecosystem for an asset type.

**Parameters**:
```python
{
  "user": "tz1...",     # Address
  "asset_type": 0       # Nat
}
```

**Returns**: `Bool` (true if authorized)

**Example**:
```typescript
const storage = await contract.storage();
const canParticipate = await storage.can_participate('tz1User...', 0);
console.log('Can Participate:', canParticipate);
```

#### `get_stream_status`

Returns complete stream status including compliance information.

**Parameters**:
```python
{
  "stream_id": 42  # Nat
}
```

**Returns**:
```python
{
  "stream_info": {...},  # Stream details
  "is_frozen": false,    # Freeze status
  "asset_type": 0        # Asset type
}
```

**Example**:
```typescript
const storage = await contract.storage();
const status = await storage.get_stream_status(42);
console.log('Stream Status:', status);
```


#### `get_user_compliance_status`

Returns user's compliance status.

**Parameters**:
```python
{
  "user": "tz1..."  # Address
}
```

**Returns**:
```python
{
  "is_verified": true,
  "jurisdiction": "US",
  "verification_level": 1,
  "expiry_time": "2027-01-01T00:00:00Z",
  "whitelisted_asset_types": [0, 1]
}
```

**Example**:
```typescript
const storage = await contract.storage();
const complianceStatus = await storage.get_user_compliance_status('tz1User...');
console.log('Compliance Status:', complianceStatus);
```

#### `check_access_status`

Checks if a rental stream grants access to an asset (for IoT integration).

**Parameters**:
```python
{
  "stream_id": 42,          # Nat (rental stream ID)
  "token_address": "KT1..." # Address (NFT contract)
}
```

**Returns**: `Bool` (true if access granted)

**Access Logic**: `stream.status == ACTIVE AND stream.recipient == current_nft_owner`

**Example**:
```typescript
const storage = await contract.storage();
const hasAccess = await storage.check_access_status(42, 'KT1NFT...');
console.log('Has Access:', hasAccess);
```

#### `get_active_rental`

Returns the active rental stream ID for an asset.

**Parameters**:
```python
{
  "token_address": "KT1..."  # Address (NFT contract)
}
```

**Returns**: `Nat` (stream_id) or `None` if no active rental

**Example**:
```typescript
const storage = await contract.storage();
const rentalStreamId = await storage.get_active_rental('KT1NFT...');
console.log('Active Rental Stream:', rentalStreamId);
```

---

## FA2 Token Contract

Standard FA2 implementation for RWA NFTs with transfer hooks.

### Entrypoints

#### `mint`

Mints a new RWA NFT (admin only).

**Parameters**:
```python
{
  "to": "tz1...",                    # Address (initial owner)
  "metadata": {                      # Map[String, Bytes]
    "name": "Luxury Apartment #42",
    "description": "2BR apartment...",
    "image": "ipfs://QmXxx..."
  }
}
```

**Returns**: `token_id` (Nat)

**Requirements**:
- Caller must be admin

**Gas Cost**: ~30,000 gas

**Example**:
```typescript
const contract = await tezos.contract.at('KT1FA2Token...');
const op = await contract.methods.mint(
  'tz1Owner...',
  {
    name: Buffer.from('Luxury Apartment #42').toString('hex'),
    description: Buffer.from('2BR apartment...').toString('hex'),
    image: Buffer.from('ipfs://QmXxx...').toString('hex')
  }
).send();
await op.confirmation();
```


#### `transfer`

FA2 standard transfer with automatic yield stream recipient update.

**Parameters**:
```python
[
  {
    "from_": "tz1...",           # Address (current owner)
    "txs": [
      {
        "to_": "tz1...",         # Address (new owner)
        "token_id": 0,           # Nat
        "amount": 1              # Nat (always 1 for NFTs)
      }
    ]
  }
]
```

**Returns**: None (transfers NFT and updates yield stream recipient)

**Requirements**:
- Caller must be owner or approved operator
- Token must exist
- Amount must be 1 for NFTs

**Gas Cost**: ~55,000 gas (includes transfer hook)

**Example**:
```typescript
const op = await contract.methods.transfer([
  {
    from_: 'tz1CurrentOwner...',
    txs: [
      {
        to_: 'tz1NewOwner...',
        token_id: 0,
        amount: 1
      }
    ]
  }
]).send();
await op.confirmation();
```

#### `update_operators`

FA2 standard operator management for delegation.

**Parameters**:
```python
[
  {
    "add_operator": {
      "owner": "tz1...",
      "operator": "tz1...",
      "token_id": 0
    }
  },
  {
    "remove_operator": {
      "owner": "tz1...",
      "operator": "tz1...",
      "token_id": 0
    }
  }
]
```

**Returns**: None

**Requirements**:
- Caller must be the owner

**Gas Cost**: ~15,000 gas per operation

**Example**:
```typescript
const op = await contract.methods.update_operators([
  {
    add_operator: {
      owner: 'tz1Owner...',
      operator: 'tz1Operator...',
      token_id: 0
    }
  }
]).send();
await op.confirmation();
```

### View Functions

#### `balance_of`

FA2 standard balance query.

**Parameters**:
```python
{
  "requests": [
    {
      "owner": "tz1...",
      "token_id": 0
    }
  ]
}
```

**Returns**: `List[Nat]` (balances, 0 or 1 for NFTs)

**Example**:
```typescript
const storage = await contract.storage();
const balances = await storage.balance_of([
  { owner: 'tz1Owner...', token_id: 0 }
]);
console.log('Balances:', balances);
```


#### `get_balance`

Returns balance for a specific owner and token.

**Parameters**:
```python
{
  "owner": "tz1...",
  "token_id": 0
}
```

**Returns**: `Nat` (0 or 1 for NFTs)

**Example**:
```typescript
const storage = await contract.storage();
const balance = await storage.get_balance('tz1Owner...', 0);
console.log('Balance:', balance.toNumber());
```

#### `token_metadata`

Returns metadata for a token.

**Parameters**:
```python
{
  "token_id": 0  # Nat
}
```

**Returns**:
```python
{
  "token_id": 0,
  "token_info": {
    "name": "Luxury Apartment #42",
    "description": "2BR apartment...",
    "image": "ipfs://QmXxx..."
  }
}
```

**Example**:
```typescript
const storage = await contract.storage();
const metadata = await storage.token_metadata(0);
console.log('Metadata:', metadata);
```

---

## Data Types

### Stream

```python
{
  "sender": Address,           # Who created and funded the stream
  "recipient": Address,        # Who receives the streamed tokens
  "token_address": Address,    # FA2 contract address
  "token_id": Nat,            # FA2 token_id
  "total_amount": Nat,        # Total tokens locked in escrow
  "flow_rate": Nat,           # Tokens per second
  "start_time": Timestamp,    # When streaming begins
  "stop_time": Timestamp,     # When streaming ends
  "amount_withdrawn": Nat,    # Total withdrawn so far
  "status": Nat               # 0=active, 1=paused, 2=cancelled, 3=depleted
}
```

### Identity

```python
{
  "is_verified": Bool,                      # KYC verification status
  "jurisdiction": String,                   # Country/region code (ISO 3166-1 alpha-2)
  "verification_level": Nat,                # 0=basic, 1=enhanced, 2=institutional
  "expiry_time": Timestamp,                # When KYC expires
  "whitelisted_asset_types": Set[Nat]     # Asset types user can trade
}
```

### TokenEntry

```python
{
  "asset_type": Nat,           # 0=real_estate, 1=vehicles, 2=commodities
  "stream_id": Nat,           # Linked yield stream
  "metadata_uri": String,     # IPFS or HTTP URL to metadata JSON
  "registration_time": Timestamp
}
```

### Asset Types

```python
REAL_ESTATE = 0
VEHICLES = 1
COMMODITIES = 2
```

### Stream Status

```python
ACTIVE = 0
PAUSED = 1
CANCELLED = 2
DEPLETED = 3
```

### Verification Levels

```python
BASIC = 0
ENHANCED = 1
INSTITUTIONAL = 2
```

---

## Error Codes

### Streaming Protocol Errors

- `STREAM_NOT_FOUND`: Stream ID does not exist
- `STREAM_NOT_ACTIVE`: Stream is paused or cancelled
- `NOT_AUTHORIZED`: Caller is not the stream recipient
- `INVALID_PARAMETERS`: Invalid input (zero amount, negative duration, etc.)
- `NO_FUNDS_TO_WITHDRAW`: Claimable balance is zero
- `INSUFFICIENT_FUNDS`: Requested amount exceeds available balance

### Asset Yield Protocol Errors

- `NOT_NFT_OWNER`: Caller does not own the NFT
- `NFT_NOT_FOUND`: NFT does not exist
- `STREAM_NOT_LINKED`: No stream linked to this NFT
- `ALREADY_LINKED`: NFT already has a linked stream

### Compliance Guard Errors

- `NOT_ADMIN`: Caller is not an administrator
- `KYC_NOT_VERIFIED`: User's KYC is not verified
- `KYC_EXPIRED`: User's KYC has expired
- `NOT_WHITELISTED`: User is not whitelisted for this asset type
- `STREAM_FROZEN`: Stream is frozen by admin

### Token Registry Errors

- `ALREADY_REGISTERED`: Token is already registered
- `TOKEN_NOT_FOUND`: Token address not in registry
- `INVALID_ASSET_TYPE`: Asset type is not 0, 1, or 2
- `INVALID_PAGINATION`: Offset or limit is invalid

### RWA Hub Errors

- `COMPLIANCE_CHECK_FAILED`: User failed compliance authorization
- `INITIALIZATION_FAILED`: Module initialization failed
- `INVALID_RENTAL_STREAM`: Rental stream is invalid or expired

---

## Events

All contracts emit events for important operations. Events can be monitored using Tezos indexers like TzKT.

### Streaming Protocol Events

- `StreamCreated`: Emitted when a new stream is created
- `Withdrawal`: Emitted when tokens are withdrawn
- `FlashAdvance`: Emitted when a flash advance occurs
- `StreamCancelled`: Emitted when a stream is cancelled

### Asset Yield Protocol Events

- `AssetStreamCreated`: Emitted when an asset yield stream is created
- `YieldClaimed`: Emitted when yield is claimed
- `StreamRecipientUpdated`: Emitted when NFT transfer updates stream recipient

### Compliance Guard Events

- `IdentityRegistered`: Emitted when KYC is registered
- `AddressWhitelisted`: Emitted when a user is whitelisted
- `StreamFrozen`: Emitted when a stream is frozen
- `StreamUnfrozen`: Emitted when a stream is unfrozen
- `AdminAdded`: Emitted when a new admin is added

### Token Registry Events

- `TokenRegistered`: Emitted when a token is registered

### RWA Hub Events

- `CompliantStreamCreated`: Emitted when a compliant RWA stream is created
- `RentalStreamCreated`: Emitted when a rental stream is created

### FA2 Token Events

- `Transfer`: Emitted when an NFT is transferred
- `Mint`: Emitted when an NFT is minted
- `OperatorUpdated`: Emitted when operators are updated

---

## Code Examples

### Complete Stream Creation Flow

```typescript
import { TezosToolkit } from '@taquito/taquito';
import { BeaconWallet } from '@taquito/beacon-wallet';

// Initialize Tezos and wallet
const tezos = new TezosToolkit('https://ghostnet.ecadinfra.com');
const wallet = new BeaconWallet({ name: 'Continuum Protocol' });
tezos.setWalletProvider(wallet);

// Connect wallet
await wallet.requestPermissions({ network: { type: 'ghostnet' } });

// Get contract instances
const rwaHub = await tezos.wallet.at('KT1RWAHub...');
const fa2Token = await tezos.wallet.at('KT1FA2Token...');

// Step 1: Mint NFT (admin only)
const mintOp = await fa2Token.methods.mint(
  await wallet.getPKH(),
  {
    name: Buffer.from('Luxury Apartment #42').toString('hex'),
    description: Buffer.from('2BR apartment in downtown').toString('hex'),
    image: Buffer.from('ipfs://QmXxx...').toString('hex')
  }
).send();
await mintOp.confirmation();

// Step 2: Create compliant RWA stream
const createOp = await rwaHub.methods.create_compliant_rwa_stream(
  'KT1NFT...',
  1000000,      // 1M tokens total yield
  31536000,     // 1 year duration
  0,            // Real estate
  'ipfs://QmMetadata...'
).send();
await createOp.confirmation();

console.log('Stream created successfully!');
```

### Claiming Yield

```typescript
// Get contract instance
const rwaHub = await tezos.wallet.at('KT1RWAHub...');

// Claim yield for your NFT
const claimOp = await rwaHub.methods.compliant_claim_yield(
  'KT1NFT...'
).send();
await claimOp.confirmation();

console.log('Yield claimed successfully!');
```

### Flash Advance

```typescript
// Get contract instance
const rwaHub = await tezos.wallet.at('KT1RWAHub...');

// Request flash advance
const flashOp = await rwaHub.methods.compliant_flash_advance(
  'KT1NFT...',
  50000  // Advance 50,000 tokens
).send();
await flashOp.confirmation();

console.log('Flash advance successful!');
```

### Transferring NFT (Yield Follows Automatically)

```typescript
// Get FA2 contract instance
const fa2Token = await tezos.wallet.at('KT1FA2Token...');

// Transfer NFT (yield stream recipient updates automatically)
const transferOp = await fa2Token.methods.transfer([
  {
    from_: 'tz1CurrentOwner...',
    txs: [
      {
        to_: 'tz1NewOwner...',
        token_id: 0,
        amount: 1
      }
    ]
  }
]).send();
await transferOp.confirmation();

console.log('NFT transferred, yield stream updated!');
```

### Admin: Batch Whitelist Users

```typescript
// Get RWA Hub contract instance
const rwaHub = await tezos.wallet.at('KT1RWAHub...');

// Batch whitelist multiple users
const whitelistOp = await rwaHub.methods.batch_whitelist(
  [
    'tz1User1...',
    'tz1User2...',
    'tz1User3...'
  ],
  [0, 1]  // Real estate and vehicles
).send();
await whitelistOp.confirmation();

console.log('Users whitelisted successfully!');
```

### Querying Stream Information

```typescript
// Get streaming protocol contract
const streamingProtocol = await tezos.contract.at('KT1StreamingProtocol...');
const storage = await streamingProtocol.storage();

// Get stream info
const streamInfo = await storage.get_stream_info(42);
console.log('Stream Info:', {
  sender: streamInfo.sender,
  recipient: streamInfo.recipient,
  totalAmount: streamInfo.total_amount.toNumber(),
  flowRate: streamInfo.flow_rate.toNumber(),
  amountWithdrawn: streamInfo.amount_withdrawn.toNumber(),
  status: streamInfo.status.toNumber()
});

// Get claimable balance
const claimable = await storage.get_claimable_balance(42);
console.log('Claimable Balance:', claimable.toNumber());
```

### Real-Time Balance Updates

```typescript
import { useEffect, useState } from 'react';

function useStreamBalance(streamId: number) {
  const [balance, setBalance] = useState(0);
  const [streamInfo, setStreamInfo] = useState(null);

  useEffect(() => {
    // Fetch stream info once
    async function fetchStreamInfo() {
      const contract = await tezos.contract.at('KT1StreamingProtocol...');
      const storage = await contract.storage();
      const info = await storage.get_stream_info(streamId);
      setStreamInfo(info);
    }
    fetchStreamInfo();

    // Update balance every second
    const interval = setInterval(() => {
      if (streamInfo) {
        const now = Math.floor(Date.now() / 1000);
        const elapsed = now - streamInfo.start_time.toNumber();
        const streamed = elapsed * streamInfo.flow_rate.toNumber();
        const claimable = Math.min(
          streamed,
          streamInfo.total_amount.toNumber()
        ) - streamInfo.amount_withdrawn.toNumber();
        setBalance(Math.max(0, claimable));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [streamId, streamInfo]);

  return balance;
}
```

---

## Additional Resources

- [Taquito Documentation](https://tezostaquito.io/)
- [Beacon SDK Documentation](https://docs.walletbeacon.io/)
- [FA2 Token Standard (TZIP-12)](https://tzip.tezosagora.org/proposal/tzip-12/)
- [TzKT API Documentation](https://api.tzkt.io/)
- [SmartPy Documentation](https://smartpy.io/docs/)
- [Tezos Developer Portal](https://tezos.com/developers/)

## Support

For API questions and support:
- GitHub Issues: [https://github.com/your-repo/issues](https://github.com/your-repo/issues)
- Documentation: [https://docs.continuum-protocol.com](https://docs.continuum-protocol.com)
- Discord: [https://discord.gg/continuum](https://discord.gg/continuum)

---

**Last Updated**: February 2026
**Version**: 1.0.0
**Network**: Tezos (Ghostnet & Mainnet)
