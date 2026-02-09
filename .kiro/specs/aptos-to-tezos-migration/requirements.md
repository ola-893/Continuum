# Requirements Document: Continuum Protocol - Aptos to Tezos Migration

## Introduction

This document specifies the requirements for migrating the Continuum Protocol, a Real World Asset (RWA) streaming platform, from the Aptos blockchain to the Tezos blockchain. The migration involves converting smart contracts from Move language to Tezos-compatible languages (SmartPy/LIGO), adapting the frontend from Aptos wallet integration to Tezos wallet integration, and ensuring feature parity while maintaining the protocol's core innovations: yield streaming, flash advances, NFT-yield coupling, compliance enforcement, and rental management.

The Continuum Protocol enables tokenization of real-world assets (real estate, vehicles, commodities) with continuous yield distribution through on-chain streaming. The protocol's key innovation is the "Flash Advance" feature, which allows asset owners to borrow against their own future yield streams without interest or traditional lending mechanisms.

## Glossary

- **Continuum_Protocol**: The complete RWA streaming platform being migrated from Aptos to Tezos
- **Stream**: A time-based payment flow that distributes tokens continuously from sender to recipient
- **Flash_Advance**: A feature allowing asset owners to withdraw future yield immediately, with the stream pausing until time catches up
- **RWA**: Real World Asset - physical assets tokenized as NFTs (real estate, vehicles, commodities)
- **Yield_Stream**: A stream specifically tied to an NFT representing asset ownership and income generation
- **Compliance_Guard**: A module enforcing KYC/AML checks before allowing yield withdrawals
- **Asset_Yield_Protocol**: A module coupling NFT ownership to yield streams, ensuring yield follows asset transfers
- **Streaming_Protocol**: The core module handling time-based token distribution calculations
- **Token_Registry**: A global registry tracking all minted RWA NFTs for marketplace discovery
- **RWA_Hub**: The main orchestrator module coordinating all protocol components
- **Rental_Stream**: A payment stream from tenant to landlord enabling pay-as-you-go asset access
- **Move**: The smart contract language used on Aptos blockchain
- **SmartPy**: A Python-based smart contract language for Tezos
- **LIGO**: A statically-typed smart contract language for Tezos
- **FA2**: Tezos token standard (similar to ERC-1155) for fungible and non-fungible tokens
- **Taquito**: TypeScript library for interacting with Tezos blockchain
- **Beacon_SDK**: Tezos wallet connection standard and SDK
- **big_map**: Tezos storage structure for large key-value mappings (similar to Aptos Tables)
- **Aptos_Object**: Aptos's composable resource model for NFTs and ownership
- **Temple_Wallet**: A popular Tezos browser extension wallet
- **Kukai_Wallet**: A Tezos web wallet with social login features
- **Umami_Wallet**: A Tezos desktop and mobile wallet
- **Ghostnet**: Tezos public testnet for development and testing
- **Mainnet**: Tezos production blockchain network
- **Escrow**: Locked funds held in a smart contract until conditions are met
- **Flow_Rate**: The amount of tokens distributed per second in a stream
- **Claimable_Balance**: The amount of tokens a recipient can withdraw at the current time
- **KYC**: Know Your Customer - identity verification process
- **AML**: Anti-Money Laundering - compliance checks for financial transactions
- **Octas**: The smallest unit of APT token on Aptos (1 APT = 10^8 octas)
- **Mutez**: The smallest unit of XTZ token on Tezos (1 XTZ = 10^6 mutez)

## Requirements

### Requirement 1: Smart Contract Migration - Streaming Protocol

**User Story:** As a protocol developer, I want to migrate the core streaming protocol from Move to Tezos, so that users can create and manage time-based token streams on Tezos blockchain.

#### Acceptance Criteria

1. WHEN a user creates a stream on Tezos, THE Streaming_Protocol SHALL lock the specified token amount in escrow and initialize stream parameters (sender, recipient, flow_rate, start_time, duration, total_amount)
2. WHEN calculating claimable balance, THE Streaming_Protocol SHALL compute the amount as (current_time - start_time) * flow_rate - amount_withdrawn, capped at total_amount
3. WHEN a recipient withdraws from a stream, THE Streaming_Protocol SHALL transfer the claimable balance from escrow to the recipient and update amount_withdrawn
4. WHEN a user requests a flash advance, THE Streaming_Protocol SHALL immediately transfer the requested amount from escrow and increment amount_withdrawn by that amount
5. WHEN a stream is cancelled, THE Streaming_Protocol SHALL return remaining escrow funds to the sender and mark the stream as cancelled
6. WHEN querying stream status, THE Streaming_Protocol SHALL return current stream state including sender, recipient, total_amount, flow_rate, start_time, stop_time, amount_withdrawn, and status
7. THE Streaming_Protocol SHALL support multiple token types through FA2 standard integration
8. THE Streaming_Protocol SHALL emit events for stream creation, withdrawal, cancellation, and flash advance operations
9. WHEN a stream reaches its stop_time, THE Streaming_Protocol SHALL allow withdrawal of all remaining funds
10. THE Streaming_Protocol SHALL prevent unauthorized withdrawals by verifying the caller is the stream recipient

### Requirement 2: Smart Contract Migration - Asset Yield Protocol

**User Story:** As a protocol developer, I want to migrate the asset yield protocol from Move to Tezos, so that NFT ownership is automatically coupled with yield streams.

#### Acceptance Criteria

1. WHEN an asset yield stream is created, THE Asset_Yield_Protocol SHALL create a stream and link it to the specified NFT token address
2. WHEN an NFT is transferred to a new owner, THE Asset_Yield_Protocol SHALL update the linked stream's recipient to the new owner's address
3. WHEN a user claims yield for an asset, THE Asset_Yield_Protocol SHALL verify NFT ownership before allowing withdrawal
4. WHEN a user requests a flash advance on asset yield, THE Asset_Yield_Protocol SHALL verify NFT ownership and delegate to the streaming protocol
5. THE Asset_Yield_Protocol SHALL maintain a bidirectional mapping between NFT addresses and stream IDs
6. THE Asset_Yield_Protocol SHALL support FA2 NFT standard for asset representation
7. WHEN querying yield for an asset, THE Asset_Yield_Protocol SHALL return the claimable balance from the linked stream
8. THE Asset_Yield_Protocol SHALL prevent yield claims by non-owners of the associated NFT
9. WHEN an asset yield stream is created, THE Asset_Yield_Protocol SHALL validate that the NFT exists and the creator has appropriate permissions
10. THE Asset_Yield_Protocol SHALL emit events for asset stream creation, yield claims, and ownership updates

### Requirement 3: Smart Contract Migration - Compliance Guard

**User Story:** As a protocol administrator, I want to migrate the compliance guard from Move to Tezos, so that KYC/AML checks are enforced before yield withdrawals.

#### Acceptance Criteria

1. WHEN a user registers their identity, THE Compliance_Guard SHALL store their KYC information including jurisdiction, verification_level, and expiry_time
2. WHEN checking authorization, THE Compliance_Guard SHALL verify the user has valid KYC and is whitelisted for the specific asset type
3. WHEN an administrator whitelists a user, THE Compliance_Guard SHALL grant access to specified asset types
4. WHEN an administrator freezes a stream, THE Compliance_Guard SHALL mark the stream as frozen and prevent all withdrawals
5. WHEN an administrator unfreezes a stream, THE Compliance_Guard SHALL remove the freeze status and allow normal operations
6. THE Compliance_Guard SHALL support multiple asset types (real estate, securities, commodities, art) with independent authorization
7. WHEN KYC expires, THE Compliance_Guard SHALL automatically revoke authorization for that user
8. THE Compliance_Guard SHALL maintain an admin list with permissions to manage compliance settings
9. WHEN checking stream status, THE Compliance_Guard SHALL return whether the stream is frozen
10. THE Compliance_Guard SHALL emit events for identity registration, whitelisting, freezing, and unfreezing operations

### Requirement 4: Smart Contract Migration - Token Registry

**User Story:** As a protocol developer, I want to migrate the token registry from Move to Tezos, so that all minted RWA NFTs are discoverable in a global marketplace.

#### Acceptance Criteria

1. WHEN an RWA NFT is minted, THE Token_Registry SHALL register the token with its address, asset_type, stream_id, and metadata_uri
2. WHEN querying all tokens, THE Token_Registry SHALL return a list of all registered tokens with pagination support
3. WHEN filtering by asset type, THE Token_Registry SHALL return only tokens matching the specified type
4. WHEN looking up by stream ID, THE Token_Registry SHALL return the associated token information
5. WHEN looking up by token address, THE Token_Registry SHALL return the token's asset type, stream ID, and metadata
6. THE Token_Registry SHALL maintain a count of total registered tokens
7. THE Token_Registry SHALL support three asset types: real estate (0), vehicles (1), and commodities (2)
8. THE Token_Registry SHALL prevent duplicate registrations for the same token address
9. WHEN paginating results, THE Token_Registry SHALL return tokens in the specified offset and limit range
10. THE Token_Registry SHALL emit events for token registration

### Requirement 5: Smart Contract Migration - RWA Hub

**User Story:** As a protocol developer, I want to migrate the RWA hub orchestrator from Move to Tezos, so that all protocol components work together seamlessly.

#### Acceptance Criteria

1. WHEN creating a compliant RWA stream, THE RWA_Hub SHALL verify compliance authorization, create the asset yield stream, and register the token in one transaction
2. WHEN a user claims yield through the hub, THE RWA_Hub SHALL automatically look up the asset type from the registry and verify compliance before allowing the claim
3. WHEN a user requests a flash advance through the hub, THE RWA_Hub SHALL automatically look up the asset type and verify compliance before processing
4. WHEN an administrator freezes a stream, THE RWA_Hub SHALL delegate to the compliance guard and update stream status
5. WHEN an administrator batch whitelists users, THE RWA_Hub SHALL process multiple whitelist operations in a single transaction
6. THE RWA_Hub SHALL provide convenience functions for creating real estate, securities, and commodities streams
7. WHEN initializing the ecosystem, THE RWA_Hub SHALL initialize all protocol modules (streaming, asset yield, compliance, token registry)
8. WHEN a tenant creates a rental stream, THE RWA_Hub SHALL create a payment stream from tenant to current asset owner and register it as an active rental
9. WHEN checking rental access status, THE RWA_Hub SHALL verify the stream is active and the recipient matches the current asset owner
10. THE RWA_Hub SHALL provide view functions for querying stream status, user compliance status, and marketplace tokens

### Requirement 6: Smart Contract Migration - Storage Patterns

**User Story:** As a protocol developer, I want to adapt Aptos storage patterns to Tezos equivalents, so that data structures function correctly on the new blockchain.

#### Acceptance Criteria

1. WHEN migrating Aptos Tables, THE System SHALL use Tezos big_maps for key-value storage
2. WHEN storing stream data, THE System SHALL use big_maps indexed by stream_id
3. WHEN storing asset-to-stream mappings, THE System SHALL use big_maps indexed by token address
4. WHEN storing compliance data, THE System SHALL use big_maps indexed by user address
5. THE System SHALL handle big_map initialization in contract origination
6. WHEN accessing big_map entries, THE System SHALL handle missing keys gracefully with appropriate error messages
7. THE System SHALL optimize big_map usage to minimize storage costs on Tezos
8. WHEN migrating Aptos Objects, THE System SHALL use FA2 NFT standard with appropriate metadata
9. THE System SHALL maintain data integrity across all storage structures
10. THE System SHALL support efficient querying of stored data for frontend integration

### Requirement 7: Smart Contract Migration - Token Standards

**User Story:** As a protocol developer, I want to migrate from Aptos token standards to Tezos FA2 standard, so that assets and yields work with Tezos ecosystem tools.

#### Acceptance Criteria

1. WHEN representing RWA NFTs, THE System SHALL use FA2 non-fungible token standard
2. WHEN handling yield tokens, THE System SHALL use FA2 fungible token standard
3. WHEN transferring NFTs, THE System SHALL trigger yield stream recipient updates through FA2 transfer hooks
4. THE System SHALL implement FA2 transfer entrypoints for token operations
5. THE System SHALL implement FA2 balance_of view for querying token ownership
6. THE System SHALL implement FA2 update_operators for delegation support
7. WHEN minting RWA NFTs, THE System SHALL assign unique token IDs and store metadata URIs
8. THE System SHALL support token metadata following TZIP-16 standard
9. WHEN querying token ownership, THE System SHALL return the current owner address
10. THE System SHALL emit FA2-compliant events for all token operations

### Requirement 8: Frontend Migration - Wallet Integration

**User Story:** As a user, I want to connect my Tezos wallet to the Continuum Protocol, so that I can interact with the platform using Temple, Kukai, or Umami wallets.

#### Acceptance Criteria

1. WHEN a user clicks connect wallet, THE Frontend SHALL display available Tezos wallets (Temple, Kukai, Umami)
2. WHEN a user selects a wallet, THE Frontend SHALL use Beacon SDK to establish connection
3. WHEN wallet connection succeeds, THE Frontend SHALL display the user's Tezos address
4. WHEN wallet connection fails, THE Frontend SHALL display an appropriate error message
5. THE Frontend SHALL persist wallet connection across page refreshes
6. WHEN a user disconnects, THE Frontend SHALL clear the wallet connection and update UI state
7. THE Frontend SHALL display the user's XTZ balance after connection
8. THE Frontend SHALL handle wallet switching when user changes accounts
9. THE Frontend SHALL support both browser extension and mobile wallet connections
10. THE Frontend SHALL display network status (Ghostnet/Mainnet) and warn if on wrong network

### Requirement 9: Frontend Migration - Contract Interaction

**User Story:** As a developer, I want to replace Aptos SDK calls with Taquito calls, so that the frontend can interact with Tezos smart contracts.

#### Acceptance Criteria

1. WHEN calling contract entrypoints, THE Frontend SHALL use Taquito's contract API with proper parameter formatting
2. WHEN reading contract storage, THE Frontend SHALL use Taquito's storage access methods
3. WHEN submitting transactions, THE Frontend SHALL use Beacon SDK for user confirmation
4. WHEN a transaction is pending, THE Frontend SHALL display transaction hash and status
5. WHEN a transaction confirms, THE Frontend SHALL update UI with new data
6. WHEN a transaction fails, THE Frontend SHALL display the error message from the blockchain
7. THE Frontend SHALL handle Tezos-specific gas estimation and fee calculation
8. THE Frontend SHALL batch multiple operations when appropriate to save gas
9. WHEN querying view functions, THE Frontend SHALL use Taquito's view execution without requiring transactions
10. THE Frontend SHALL handle Tezos-specific data types (mutez, timestamps, addresses) correctly

### Requirement 10: Frontend Migration - Real-Time Balance Updates

**User Story:** As a user, I want to see my yield balance update in real-time, so that I can watch my earnings accumulate continuously.

#### Acceptance Criteria

1. WHEN viewing an asset with an active stream, THE Frontend SHALL calculate and display the current claimable balance
2. THE Frontend SHALL update the displayed balance every second using the formula: (current_time - start_time) * flow_rate - amount_withdrawn
3. WHEN the stream reaches its end time, THE Frontend SHALL stop updating and show the final claimable amount
4. THE Frontend SHALL display flow rate in human-readable format (tokens per day/month)
5. THE Frontend SHALL show time remaining until stream completion
6. WHEN a user claims yield, THE Frontend SHALL reset the claimable balance display to zero
7. THE Frontend SHALL display total amount withdrawn from the stream
8. THE Frontend SHALL show escrow balance remaining in the stream
9. WHEN a stream is paused (after flash advance), THE Frontend SHALL indicate the paused status
10. THE Frontend SHALL handle multiple assets with different streams simultaneously

### Requirement 11: Frontend Migration - Admin Dashboard

**User Story:** As an administrator, I want to access admin functions through the Tezos-connected frontend, so that I can manage compliance, mint assets, and handle emergencies.

#### Acceptance Criteria

1. WHEN an admin accesses the admin dashboard, THE Frontend SHALL verify admin status through the compliance guard contract
2. WHEN minting a new RWA NFT, THE Frontend SHALL collect asset details and call the RWA hub's create stream function
3. WHEN approving KYC, THE Frontend SHALL call the compliance guard's whitelist function with selected asset types
4. WHEN freezing an asset, THE Frontend SHALL call the emergency freeze function and display confirmation
5. WHEN viewing all assets, THE Frontend SHALL query the token registry and display a paginated list
6. THE Frontend SHALL display system metrics including total assets, total value locked, and active streams
7. WHEN batch whitelisting users, THE Frontend SHALL accept multiple addresses and process them in one transaction
8. THE Frontend SHALL display pending KYC requests for admin review
9. WHEN unfreezing an asset, THE Frontend SHALL call the unfreeze function and update asset status
10. THE Frontend SHALL restrict admin functions to verified admin addresses only

### Requirement 12: Frontend Migration - Configuration and Network Management

**User Story:** As a developer, I want to configure the frontend for Tezos networks, so that the application works on both Ghostnet and Mainnet.

#### Acceptance Criteria

1. THE Frontend SHALL maintain separate configuration for Ghostnet and Mainnet contract addresses
2. WHEN switching networks, THE Frontend SHALL update all contract references to the correct network
3. THE Frontend SHALL display the current network prominently in the UI
4. WHEN on Ghostnet, THE Frontend SHALL provide a link to the Tezos faucet for test tokens
5. THE Frontend SHALL validate that the connected wallet is on the correct network
6. WHEN network mismatch is detected, THE Frontend SHALL prompt the user to switch networks
7. THE Frontend SHALL store network preference in local storage
8. THE Frontend SHALL use appropriate block explorer links (Ghostnet/Mainnet) for transactions
9. THE Frontend SHALL handle network-specific token addresses and contract addresses
10. THE Frontend SHALL provide environment variables for easy deployment configuration

### Requirement 13: Testing and Validation - Smart Contract Tests

**User Story:** As a protocol developer, I want comprehensive tests for Tezos smart contracts, so that I can verify correctness before deployment.

#### Acceptance Criteria

1. WHEN running streaming protocol tests, THE Test_Suite SHALL verify stream creation, withdrawal, and cancellation
2. WHEN testing flash advance, THE Test_Suite SHALL verify immediate withdrawal and amount_withdrawn updates
3. WHEN testing asset yield protocol, THE Test_Suite SHALL verify NFT-stream coupling and ownership transfers
4. WHEN testing compliance guard, THE Test_Suite SHALL verify KYC checks, whitelisting, and freezing
5. WHEN testing token registry, THE Test_Suite SHALL verify registration, lookup, and pagination
6. WHEN testing RWA hub, THE Test_Suite SHALL verify end-to-end flows from minting to claiming
7. THE Test_Suite SHALL include edge cases for zero amounts, expired streams, and unauthorized access
8. THE Test_Suite SHALL verify gas costs are within acceptable ranges for Tezos
9. WHEN testing rental streams, THE Test_Suite SHALL verify tenant-landlord payment flows and access checks
10. THE Test_Suite SHALL achieve at least 90% code coverage across all contracts

### Requirement 14: Testing and Validation - Frontend Integration Tests

**User Story:** As a developer, I want integration tests for the frontend, so that I can verify wallet connection and contract interaction work correctly.

#### Acceptance Criteria

1. WHEN running wallet connection tests, THE Test_Suite SHALL verify successful connection with mock Beacon SDK
2. WHEN testing contract calls, THE Test_Suite SHALL verify proper parameter formatting and transaction submission
3. WHEN testing real-time balance updates, THE Test_Suite SHALL verify calculation accuracy over time
4. WHEN testing admin functions, THE Test_Suite SHALL verify authorization checks and transaction execution
5. THE Test_Suite SHALL test error handling for failed transactions and network issues
6. THE Test_Suite SHALL verify UI updates correctly after transaction confirmation
7. THE Test_Suite SHALL test pagination and filtering in marketplace views
8. THE Test_Suite SHALL verify proper handling of multiple simultaneous streams
9. WHEN testing network switching, THE Test_Suite SHALL verify configuration updates correctly
10. THE Test_Suite SHALL include end-to-end tests covering complete user flows (mint, claim, transfer)

### Requirement 15: Deployment and Documentation

**User Story:** As a protocol deployer, I want deployment scripts and documentation, so that I can deploy the protocol to Tezos networks reliably.

#### Acceptance Criteria

1. THE System SHALL provide deployment scripts for originating all contracts on Ghostnet
2. THE System SHALL provide deployment scripts for originating all contracts on Mainnet
3. WHEN deploying, THE Scripts SHALL initialize all contracts with correct parameters
4. THE Scripts SHALL verify successful deployment and store contract addresses
5. THE System SHALL provide documentation for contract deployment process
6. THE System SHALL provide documentation for frontend configuration and deployment
7. THE Documentation SHALL include API reference for all contract entrypoints
8. THE Documentation SHALL include examples for common operations (create stream, claim yield, etc.)
9. THE Documentation SHALL include migration guide from Aptos to Tezos for users
10. THE Documentation SHALL include troubleshooting guide for common issues

### Requirement 16: Gas Optimization and Performance

**User Story:** As a protocol user, I want optimized gas costs on Tezos, so that I can use the protocol affordably.

#### Acceptance Criteria

1. WHEN creating a stream, THE System SHALL minimize storage operations to reduce gas costs
2. WHEN claiming yield, THE System SHALL batch operations where possible to reduce transaction costs
3. THE System SHALL use efficient big_map access patterns to minimize storage reads
4. WHEN calculating claimable balance, THE System SHALL use view functions that don't consume gas
5. THE System SHALL optimize contract code to reduce execution costs
6. WHEN minting NFTs, THE System SHALL minimize metadata storage costs
7. THE System SHALL provide gas estimates in the frontend before transaction submission
8. THE System SHALL document typical gas costs for all major operations
9. WHEN batch processing, THE System SHALL optimize to stay within Tezos gas limits
10. THE System SHALL compare gas costs with Aptos implementation and document differences

### Requirement 17: Security and Access Control

**User Story:** As a protocol administrator, I want robust security controls, so that the protocol is protected from unauthorized access and exploits.

#### Acceptance Criteria

1. WHEN accessing admin functions, THE System SHALL verify the caller is in the admin list
2. WHEN withdrawing from streams, THE System SHALL verify the caller is the stream recipient
3. WHEN claiming asset yield, THE System SHALL verify the caller owns the associated NFT
4. THE System SHALL prevent reentrancy attacks through proper state updates before external calls
5. THE System SHALL validate all input parameters to prevent overflow and underflow
6. WHEN transferring tokens, THE System SHALL verify sufficient balance before proceeding
7. THE System SHALL implement emergency pause functionality for critical vulnerabilities
8. THE System SHALL log all administrative actions for audit trails
9. WHEN handling escrow, THE System SHALL ensure funds cannot be extracted except through authorized withdrawals
10. THE System SHALL undergo security audit before mainnet deployment

### Requirement 18: Feature Parity Validation

**User Story:** As a protocol stakeholder, I want to verify feature parity between Aptos and Tezos implementations, so that no functionality is lost in migration.

#### Acceptance Criteria

1. THE Tezos_Implementation SHALL support all stream creation parameters from the Aptos version
2. THE Tezos_Implementation SHALL support flash advance with identical calculation logic
3. THE Tezos_Implementation SHALL support NFT-yield coupling with automatic recipient updates
4. THE Tezos_Implementation SHALL support compliance checks with KYC and whitelisting
5. THE Tezos_Implementation SHALL support rental streams with IoT access verification
6. THE Tezos_Implementation SHALL support token registry with marketplace discovery
7. THE Tezos_Implementation SHALL support batch operations for admin efficiency
8. THE Tezos_Implementation SHALL emit equivalent events for all operations
9. THE Tezos_Implementation SHALL provide equivalent view functions for frontend queries
10. THE Tezos_Implementation SHALL maintain calculation accuracy for streaming math (no precision loss)

### Requirement 19: Data Migration and Continuity

**User Story:** As a protocol user, I want my existing assets and streams to be migrated to Tezos, so that I don't lose my investments.

#### Acceptance Criteria

1. THE System SHALL provide tools to export asset data from Aptos contracts
2. THE System SHALL provide tools to import asset data into Tezos contracts
3. WHEN migrating streams, THE System SHALL preserve stream parameters (flow_rate, start_time, amount_withdrawn)
4. WHEN migrating NFTs, THE System SHALL preserve metadata and ownership
5. WHEN migrating compliance data, THE System SHALL preserve KYC status and whitelisting
6. THE System SHALL provide verification tools to confirm data integrity after migration
7. THE System SHALL document the migration process for users and administrators
8. THE System SHALL provide a migration timeline and communication plan
9. WHEN migration is complete, THE System SHALL provide a reconciliation report
10. THE System SHALL maintain a snapshot of Aptos state for reference and dispute resolution

### Requirement 20: Monitoring and Analytics

**User Story:** As a protocol administrator, I want monitoring and analytics tools, so that I can track protocol health and usage on Tezos.

#### Acceptance Criteria

1. THE System SHALL track total value locked (TVL) across all streams
2. THE System SHALL track number of active streams and total streams created
3. THE System SHALL track number of registered assets by type
4. THE System SHALL track total yield distributed to users
5. THE System SHALL track number of flash advances and total amount advanced
6. THE System SHALL track compliance metrics (KYC approvals, freezes, etc.)
7. THE System SHALL provide dashboard visualizations for key metrics
8. THE System SHALL track gas costs and transaction volumes
9. THE System SHALL monitor contract health and alert on anomalies
10. THE System SHALL provide historical data export for analysis
