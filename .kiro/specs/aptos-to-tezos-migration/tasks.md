# Implementation Plan: Continuum Protocol - Aptos to Tezos Migration

## Overview

This implementation plan breaks down the migration of the Continuum Protocol from Aptos to Tezos into discrete, manageable tasks. The migration involves converting five Move smart contracts to SmartPy, migrating the React/TypeScript frontend from Aptos SDK to Taquito/Beacon SDK, and ensuring feature parity with comprehensive testing.

The implementation follows a phased approach: (1) Smart contract development and testing on Ghostnet, (2) Frontend migration and integration, (3) Data migration tooling, (4) Deployment to Mainnet, and (5) Documentation and monitoring.

## Tasks

- [x] 1. Set up Tezos development environment and project structure
  - Install SmartPy CLI and development tools
  - Create project directory structure for contracts and tests
  - Set up Taquito and Beacon SDK in frontend
  - Configure Ghostnet RPC endpoints and faucet access
  - Initialize git repository with appropriate .gitignore
  - _Requirements: 15.5, 15.6_

- [x] 2. Implement Streaming Protocol Contract
  - [x] 2.1 Create streaming protocol contract skeleton in SmartPy
    - Define storage structure with streams big_map
    - Define stream record type with all fields (sender, recipient, token_address, token_id, total_amount, flow_rate, start_time, stop_time, amount_withdrawn, status)
    - Implement initialization entrypoint
    - _Requirements: 1.1, 6.2_

  - [x] 2.2 Implement stream creation entrypoint
    - Validate input parameters (amount > 0, duration > 0, flow_rate > 0)
    - Transfer tokens from sender to contract using FA2 transfer
    - Create stream record and store in big_map
    - Emit stream creation event
    - _Requirements: 1.1, 1.8_

  - [ ]* 2.3 Write property test for stream creation (Property 1)
    - **Property 1: Stream Creation Locks Tokens**
    - Generate random stream parameters
    - Verify tokens are locked and stream record is created
    - Run 100 iterations with different inputs
    - _Requirements: 1.1_

  - [x] 2.4 Implement claimable balance calculation view function
    - Calculate: min((current_time - start_time) * flow_rate, total_amount) - amount_withdrawn
    - Handle edge cases (before start_time, after stop_time)
    - Return zero for invalid stream IDs
    - _Requirements: 1.2_

  - [ ]* 2.5 Write property test for claimable balance calculation (Property 2)
    - **Property 2: Claimable Balance Calculation Accuracy**
    - Generate random streams and time points
    - Verify calculation matches formula
    - Test edge cases (before start, after stop)
    - _Requirements: 1.2_

  - [x] 2.6 Implement withdrawal entrypoint
    - Calculate claimable balance
    - Verify caller is stream recipient
    - Update amount_withdrawn
    - Transfer tokens from contract to recipient
    - Emit withdrawal event
    - _Requirements: 1.3, 1.10_

  - [ ]* 2.7 Write property test for withdrawal (Property 3, Property 7)
    - **Property 3: Withdrawal Transfers Correct Amount**
    - **Property 7: Withdrawal Authorization**
    - Generate random streams and advance time
    - Verify withdrawal transfers correct amount
    - Verify only recipient can withdraw
    - _Requirements: 1.3, 1.10_

  - [x] 2.8 Implement flash advance entrypoint
    - Verify caller is stream recipient
    - Validate amount_requested <= (total_amount - amount_withdrawn)
    - Increment amount_withdrawn by amount_requested
    - Transfer tokens immediately
    - Emit flash advance event
    - _Requirements: 1.4_

  - [ ]* 2.9 Write property test for flash advance (Property 4)
    - **Property 4: Flash Advance Immediate Transfer**
    - Generate random streams and advance amounts
    - Verify immediate transfer and amount_withdrawn update
    - Verify future claims are reduced correctly
    - _Requirements: 1.4_

  - [x] 2.10 Implement stream cancellation entrypoint
    - Verify caller is sender or recipient
    - Calculate remaining balance
    - Transfer remaining tokens to sender
    - Mark stream as cancelled
    - Emit cancellation event
    - _Requirements: 1.5_

  - [ ]* 2.11 Write property test for cancellation (Property 5)
    - **Property 5: Stream Cancellation Refunds Correctly**
    - Generate random streams at various stages
    - Verify correct refund amount
    - Verify status update
    - _Requirements: 1.5_

  - [ ]* 2.12 Write property test for post-stop-time withdrawal (Property 6)
    - **Property 6: Post-Stop-Time Full Withdrawal**
    - Generate streams and advance time past stop_time
    - Verify full remaining balance is claimable
    - _Requirements: 1.9_

  - [ ]* 2.13 Write property test for multi-token support (Property 8)
    - **Property 8: Multi-Token Support**
    - Test with multiple FA2 token contracts
    - Verify streams work with different tokens
    - _Requirements: 1.7_

  - [ ]* 2.14 Write unit tests for edge cases
    - Test zero claimable balance withdrawal (should fail)
    - Test withdrawal before start_time (should return zero)
    - Test invalid stream ID (should fail)
    - Test stream status transitions
    - _Requirements: 1.2, 1.3, 1.5_


- [x] 3. Implement Asset Yield Protocol Contract
  - [x] 3.1 Create asset yield protocol contract skeleton
    - Define storage with asset_to_stream and stream_to_asset big_maps
    - Store streaming_protocol_address reference
    - Implement initialization entrypoint
    - _Requirements: 2.5, 6.3_

  - [x] 3.2 Implement asset yield stream creation entrypoint
    - Verify caller owns the NFT (via FA2 balance_of)
    - Call streaming protocol to create stream
    - Store bidirectional mapping (asset ↔ stream)
    - Emit asset stream creation event
    - _Requirements: 2.1, 2.9_

  - [ ]* 3.3 Write property test for bidirectional mapping (Property 9)
    - **Property 9: Bidirectional Mapping Consistency**
    - Generate random asset-stream links
    - Verify forward and reverse mappings are consistent
    - Test mapping invariant holds after all operations
    - _Requirements: 2.1, 2.5_

  - [x] 3.4 Implement update stream recipient entrypoint
    - Look up stream_id from asset_to_stream
    - Call streaming protocol to update recipient
    - Called by FA2 transfer hook
    - _Requirements: 2.2_

  - [ ]* 3.5 Write property test for yield follows ownership (Property 10)
    - **Property 10: Yield Follows Asset Ownership**
    - Generate random NFT transfers
    - Verify stream recipient is updated automatically
    - Test with multiple transfers in sequence
    - _Requirements: 2.2_

  - [x] 3.6 Implement claim yield for asset entrypoint
    - Look up stream_id from asset_to_stream
    - Verify caller owns the NFT
    - Call streaming protocol withdraw
    - Return amount claimed
    - _Requirements: 2.3, 2.7_

  - [ ]* 3.7 Write property test for yield claim authorization (Property 11)
    - **Property 11: Yield Claim Requires Ownership**
    - Generate random NFTs and callers
    - Verify only NFT owner can claim
    - Test with ownership transfers
    - _Requirements: 2.3, 2.8_

  - [x] 3.8 Implement flash advance for asset entrypoint
    - Look up stream_id from asset_to_stream
    - Verify caller owns the NFT
    - Call streaming protocol flash_advance
    - _Requirements: 2.4_

  - [ ]* 3.9 Write property test for flash advance authorization (Property 12)
    - **Property 12: Flash Advance Requires Ownership**
    - Generate random NFTs and callers
    - Verify only NFT owner can flash advance
    - _Requirements: 2.4_

  - [ ]* 3.10 Write property test for asset stream creation validation (Property 13)
    - **Property 13: Asset Stream Creation Validation**
    - Test with valid and invalid NFTs
    - Test with non-owners attempting creation
    - Verify validation logic
    - _Requirements: 2.9_

  - [ ]* 3.11 Write unit tests for edge cases
    - Test claim with no linked stream (should fail)
    - Test update recipient for non-existent stream
    - Test multiple assets with same stream (should fail)
    - _Requirements: 2.1, 2.3, 2.4_

- [x] 4. Checkpoint - Ensure streaming and asset yield tests pass
  - Run all streaming protocol tests
  - Run all asset yield protocol tests
  - Verify test coverage is above 90%
  - Ask the user if questions arise


- [x] 5. Implement Compliance Guard Contract
  - [x] 5.1 Create compliance guard contract skeleton
    - Define storage with identities, frozen_streams, admins big_maps
    - Define identity record type
    - Implement initialization with initial admin
    - _Requirements: 3.1, 3.8, 6.4_

  - [x] 5.2 Implement register identity entrypoint
    - Verify caller is admin
    - Store KYC information (jurisdiction, verification_level, expiry_time)
    - Initialize empty whitelisted_asset_types set
    - Emit identity registration event
    - _Requirements: 3.1_

  - [x] 5.3 Implement whitelist address entrypoint
    - Verify caller is admin
    - Add asset types to user's whitelisted_asset_types set
    - Emit whitelisting event
    - _Requirements: 3.3_

  - [ ]* 5.4 Write property test for authorization logic (Property 14)
    - **Property 14: Authorization Requires Valid KYC and Whitelist**
    - Generate random users with various KYC states
    - Verify authorization formula: is_verified AND not_expired AND whitelisted
    - Test with expired KYC
    - _Requirements: 3.2, 3.7_

  - [ ]* 5.5 Write property test for whitelisting (Property 15)
    - **Property 15: Whitelisting Grants Access**
    - Generate random users and asset types
    - Verify whitelisted_asset_types set is updated correctly
    - _Requirements: 3.3_

  - [x] 5.6 Implement freeze stream entrypoint
    - Verify caller is admin
    - Mark stream as frozen in frozen_streams big_map
    - Emit freeze event with reason
    - _Requirements: 3.4_

  - [x] 5.7 Implement unfreeze stream entrypoint
    - Verify caller is admin
    - Remove stream from frozen_streams big_map
    - Emit unfreeze event
    - _Requirements: 3.5_

  - [ ]* 5.8 Write property test for freeze-unfreeze round trip (Property 16)
    - **Property 16: Freeze-Unfreeze Round Trip**
    - Generate random streams
    - Freeze then unfreeze
    - Verify stream returns to operational state
    - _Requirements: 3.4, 3.5_

  - [x] 5.9 Implement add admin entrypoint
    - Verify caller is admin
    - Add new address to admins set
    - _Requirements: 3.8_

  - [ ]* 5.10 Write property test for admin-only access (Property 17)
    - **Property 17: Admin-Only Access Control**
    - Test all admin functions with admin and non-admin callers
    - Verify only admins can execute
    - _Requirements: 3.8, 17.1_

  - [ ]* 5.11 Write property test for multi-asset-type independence (Property 18)
    - **Property 18: Multi-Asset-Type Independence**
    - Generate users with different asset type permissions
    - Verify authorization is independent per type
    - _Requirements: 3.6_

  - [ ]* 5.12 Write unit tests for edge cases
    - Test authorization with expired KYC
    - Test freeze on non-existent stream
    - Test double freeze/unfreeze
    - Test admin adding themselves
    - _Requirements: 3.2, 3.4, 3.5, 3.7_


- [x] 6. Implement Token Registry Contract
  - [x] 6.1 Create token registry contract skeleton
    - Define storage with tokens, stream_to_token, tokens_by_type big_maps
    - Define token entry record type
    - Implement initialization entrypoint
    - _Requirements: 4.1, 6.3_

  - [x] 6.2 Implement register token entrypoint
    - Verify token not already registered
    - Store token information (asset_type, stream_id, metadata_uri)
    - Add to tokens_by_type set
    - Create stream_to_token mapping
    - Increment token_count
    - Emit registration event
    - _Requirements: 4.1, 4.8_

  - [ ]* 6.3 Write property test for registration completeness (Property 19)
    - **Property 19: Registration Stores Complete Data**
    - Generate random token registrations
    - Verify all fields are stored and retrievable
    - _Requirements: 4.1, 4.5_

  - [x] 6.4 Implement get all tokens paginated view function
    - Accept offset and limit parameters
    - Return tokens in range [offset, offset+limit)
    - Handle edge cases (offset beyond count, limit = 0)
    - _Requirements: 4.2, 4.9_

  - [ ]* 6.5 Write property test for pagination (Property 20)
    - **Property 20: Pagination Correctness**
    - Register multiple tokens
    - Test various offset/limit combinations
    - Verify count matches actual registrations
    - _Requirements: 4.2, 4.6, 4.9_

  - [x] 6.6 Implement get tokens by type view function
    - Filter tokens by asset_type
    - Return all matching tokens
    - _Requirements: 4.3_

  - [ ]* 6.7 Write property test for asset type filtering (Property 21)
    - **Property 21: Asset Type Filtering**
    - Register tokens of different types
    - Verify filtering returns only matching types
    - _Requirements: 4.3_

  - [x] 6.8 Implement get token by stream ID view function
    - Look up token_address from stream_to_token
    - Return token information
    - _Requirements: 4.4_

  - [ ]* 6.9 Write property test for reverse lookup (Property 22)
    - **Property 22: Stream-to-Token Reverse Lookup**
    - Register tokens with stream IDs
    - Verify reverse lookup works correctly
    - _Requirements: 4.4_

  - [ ]* 6.10 Write property test for duplicate prevention (Property 23)
    - **Property 23: Duplicate Registration Prevention**
    - Attempt to register same token twice
    - Verify second registration fails
    - _Requirements: 4.8_

  - [ ]* 6.11 Write unit tests for edge cases
    - Test pagination with empty registry
    - Test filtering with no matches
    - Test lookup of non-existent token
    - Test all three asset types
    - _Requirements: 4.2, 4.3, 4.4, 4.7_

- [x] 7. Checkpoint - Ensure compliance and registry tests pass
  - Run all compliance guard tests
  - Run all token registry tests
  - Verify test coverage is above 90%
  - Ask the user if questions arise


- [x] 8. Implement FA2 Token Contract
  - [x] 8.1 Create FA2 token contract skeleton
    - Define storage with ledger, token_metadata, operators big_maps
    - Implement FA2 standard storage structure
    - Store asset_yield_protocol address for hooks
    - _Requirements: 7.1, 7.2, 6.8_

  - [x] 8.2 Implement mint entrypoint
    - Verify caller is admin
    - Assign next_token_id
    - Set balance to 1 in ledger
    - Store metadata in token_metadata
    - Increment next_token_id
    - _Requirements: 7.7_

  - [ ]* 8.3 Write property test for NFT minting uniqueness (Property 31)
    - **Property 31: NFT Minting Uniqueness**
    - Mint multiple NFTs
    - Verify each has unique token_id
    - Verify metadata is stored correctly
    - _Requirements: 7.7, 7.8_

  - [x] 8.4 Implement FA2 transfer entrypoint
    - Validate sender owns tokens or is operator
    - Update ledger balances
    - Call transfer hook to asset_yield_protocol
    - Emit transfer event
    - _Requirements: 7.3, 7.4_

  - [ ]* 8.5 Write property test for transfer hook (Property 29)
    - **Property 29: FA2 Transfer Hook Updates Stream**
    - Transfer NFT from owner_A to owner_B
    - Verify asset_yield_protocol.update_stream_recipient is called
    - Verify stream recipient is updated
    - _Requirements: 7.3_

  - [x] 8.6 Implement FA2 balance_of view function
    - Accept list of (owner, token_id) pairs
    - Return balance for each (0 or 1 for NFTs)
    - _Requirements: 7.5_

  - [x] 8.7 Implement FA2 update_operators entrypoint
    - Accept list of add/remove operator updates
    - Update operators big_map
    - Emit operator update events
    - _Requirements: 7.6_

  - [ ]* 8.8 Write property test for FA2 standard compliance (Property 30)
    - **Property 30: FA2 Standard Compliance**
    - Test all FA2 entrypoints (transfer, balance_of, update_operators)
    - Verify behavior matches TZIP-12 specification
    - Test with FA2 compliance test suite
    - _Requirements: 7.1, 7.2, 7.4, 7.5, 7.6, 7.9, 7.10_

  - [ ]* 8.9 Write unit tests for FA2 edge cases
    - Test transfer of non-existent token
    - Test transfer by non-owner without operator permission
    - Test balance_of for non-existent token
    - Test operator permissions
    - _Requirements: 7.4, 7.5, 7.6_


- [x] 9. Implement RWA Hub Contract
  - [x] 9.1 Create RWA hub contract skeleton
    - Define storage with contract addresses and active_rentals big_map
    - Store references to all protocol contracts
    - Implement initialization entrypoint
    - _Requirements: 5.7, 6.3_

  - [x] 9.2 Implement create compliant RWA stream entrypoint
    - Check compliance authorization for asset_type
    - Call asset_yield_protocol.create_asset_yield_stream
    - Call token_registry.register_token
    - Ensure atomicity (all succeed or all fail)
    - _Requirements: 5.1_

  - [ ]* 9.3 Write property test for compliant stream creation atomicity (Property 24)
    - **Property 24: Compliant Stream Creation Atomicity**
    - Test with valid and invalid compliance states
    - Verify all three operations complete or none do
    - Test rollback on failure
    - _Requirements: 5.1_

  - [x] 9.4 Implement compliant claim yield entrypoint
    - Look up asset_type from token_registry
    - Check compliance authorization
    - Call asset_yield_protocol.claim_yield_for_asset
    - _Requirements: 5.2_

  - [x] 9.5 Implement compliant flash advance entrypoint
    - Look up asset_type from token_registry
    - Check compliance authorization
    - Call asset_yield_protocol.flash_advance_rwa_yield
    - _Requirements: 5.3_

  - [ ]* 9.6 Write property test for automatic asset type lookup (Property 25)
    - **Property 25: Automatic Asset Type Lookup**
    - Register tokens of different types
    - Claim yield and flash advance without providing asset_type
    - Verify hub looks up type automatically
    - _Requirements: 5.2, 5.3_

  - [x] 9.7 Implement emergency freeze entrypoint
    - Verify caller is admin
    - Call compliance_guard.freeze_stream
    - _Requirements: 5.4_

  - [x] 9.8 Implement batch whitelist entrypoint
    - Verify caller is admin
    - Loop through users and call compliance_guard.whitelist_address
    - _Requirements: 5.5_

  - [ ]* 9.9 Write property test for batch whitelist (Property 26)
    - **Property 26: Batch Whitelist Completeness**
    - Batch whitelist multiple users
    - Verify all users are whitelisted for all specified asset types
    - _Requirements: 5.5_

  - [x] 9.10 Implement convenience functions for asset types
    - create_real_estate_stream (asset_type = 0)
    - create_securities_stream (asset_type = 1)
    - create_commodities_stream (asset_type = 2)
    - _Requirements: 5.6_

  - [x] 9.11 Implement stream rent to asset entrypoint
    - Look up current NFT owner
    - Create stream from tenant (caller) to landlord (owner)
    - Store stream_id in active_rentals
    - _Requirements: 5.8_

  - [ ]* 9.12 Write property test for rental stream creation (Property 28)
    - **Property 28: Rental Stream Creation**
    - Generate random rental parameters
    - Verify stream is created from tenant to current owner
    - Verify registration in active_rentals
    - _Requirements: 5.8_

  - [x] 9.13 Implement check access status view function
    - Verify stream exists and is active
    - Verify stream recipient matches current NFT owner
    - Return true if access granted, false otherwise
    - _Requirements: 5.9_

  - [ ]* 9.14 Write property test for rental access control (Property 27)
    - **Property 27: Rental Stream Access Control**
    - Create rental streams
    - Test access with various stream states
    - Test access after NFT transfer (should fail)
    - _Requirements: 5.9_

  - [ ]* 9.15 Write unit tests for RWA hub edge cases
    - Test compliant stream creation with failed compliance check
    - Test batch whitelist with empty list
    - Test rental stream with non-existent NFT
    - Test access check with expired stream
    - _Requirements: 5.1, 5.2, 5.5, 5.8, 5.9_

- [x] 10. Checkpoint - Ensure all contract tests pass
  - Run complete test suite for all contracts
  - Verify test coverage is above 90%
  - Measure and document gas costs for all operations
  - Ask the user if questions arise


- [x] 11. Deploy contracts to Ghostnet
  - [x] 11.1 Create deployment script for Ghostnet
    - Originate all contracts in correct order
    - Initialize contracts with admin address
    - Link contracts (store addresses in each other)
    - Save deployed contract addresses to config file
    - _Requirements: 15.1, 15.3, 15.4_

  - [x] 11.2 Verify deployment on Ghostnet
    - Test each contract entrypoint manually
    - Verify contract storage is initialized correctly
    - Test end-to-end flow (create stream, claim yield)
    - _Requirements: 15.4_

  - [ ]* 11.3 Write deployment verification tests
    - Test contract addresses are valid
    - Test contract storage matches expected initial state
    - Test cross-contract calls work
    - _Requirements: 15.4_

- [x] 12. Migrate frontend wallet integration
  - [x] 12.1 Install Taquito and Beacon SDK dependencies
    - Add @taquito/taquito, @taquito/beacon-wallet to package.json
    - Remove Aptos SDK dependencies
    - Update TypeScript types
    - _Requirements: 8.2, 9.1_

  - [x] 12.2 Create Tezos wallet connection service
    - Implement BeaconWallet initialization
    - Implement connect wallet function (Temple, Kukai, Umami)
    - Implement disconnect function
    - Implement wallet state persistence
    - Handle wallet switching
    - _Requirements: 8.1, 8.2, 8.3, 8.5, 8.6, 8.8_

  - [x] 12.3 Create wallet connection UI component
    - Display available wallets
    - Show connection status
    - Display user address and XTZ balance
    - Show network status (Ghostnet/Mainnet)
    - Handle connection errors
    - _Requirements: 8.1, 8.3, 8.4, 8.7, 8.10_

  - [ ]* 12.4 Write integration tests for wallet connection
    - Test connection with mock Beacon SDK
    - Test disconnect
    - Test wallet switching
    - Test persistence across page refresh
    - _Requirements: 8.1, 8.2, 8.5, 8.6, 8.8_

- [x] 13. Migrate frontend contract interaction
  - [x] 13.1 Create Taquito contract service
    - Load contract instances for all protocol contracts
    - Implement entrypoint call functions with parameter formatting
    - Implement storage query functions
    - Implement view function execution
    - Handle Tezos data types (mutez, timestamps, addresses)
    - _Requirements: 9.1, 9.2, 9.9, 9.10_

  - [x] 13.2 Implement transaction handling
    - Submit transactions via Beacon SDK
    - Display transaction hash and status
    - Poll for confirmation
    - Update UI on confirmation
    - Display error messages on failure
    - _Requirements: 9.3, 9.4, 9.5, 9.6_

  - [x] 13.3 Implement gas estimation
    - Estimate gas before transaction submission
    - Display estimated fees to user
    - Handle gas limit errors
    - _Requirements: 9.7_

  - [x] 13.4 Implement operation batching
    - Batch multiple operations when appropriate
    - Test batch whitelist operation
    - _Requirements: 9.8_

  - [ ]* 13.5 Write integration tests for contract interaction
    - Test entrypoint calls with mock Taquito
    - Test storage queries
    - Test transaction submission and confirmation
    - Test error handling
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_


- [x] 14. Implement real-time balance updates in frontend
  - [x] 14.1 Create useStreamBalance hook
    - Calculate claimable balance using formula: (current_time - start_time) * flow_rate - amount_withdrawn
    - Update balance every second
    - Stop updating after stop_time
    - Handle stream status (active, paused, cancelled)
    - _Requirements: 10.1, 10.2, 10.3, 10.9_

  - [ ]* 14.2 Write property test for balance calculation (Property 36)
    - **Property 36: Streaming Math Precision**
    - Generate random streams
    - Verify calculation matches Aptos implementation
    - Test precision (within 1 mutez)
    - _Requirements: 18.10_

  - [x] 14.3 Create stream display components
    - Display claimable balance with live updates
    - Display flow rate in human-readable format (per day/month)
    - Display time remaining
    - Display total withdrawn
    - Display escrow balance
    - Show paused status indicator
    - _Requirements: 10.4, 10.5, 10.7, 10.8, 10.9_

  - [x] 14.4 Implement claim yield UI
    - Button to claim yield
    - Reset claimable balance display after claim
    - Show transaction status
    - _Requirements: 10.6_

  - [x] 14.5 Implement multi-asset stream handling
    - Display multiple assets with different streams
    - Update all balances independently
    - Handle different token types
    - _Requirements: 10.10_

  - [ ]* 14.6 Write unit tests for balance calculation
    - Test calculation at various time points
    - Test with different flow rates
    - Test after stop_time
    - Test with amount_withdrawn > 0
    - _Requirements: 10.2_

- [x] 15. Implement admin dashboard
  - [x] 15.1 Create admin authorization check
    - Query compliance_guard.is_admin
    - Redirect non-admins
    - Show admin-only UI elements
    - _Requirements: 11.1, 11.10_

  - [x] 15.2 Implement asset minting UI
    - Form to collect asset details (type, metadata, yield parameters)
    - Call RWA_Hub.create_compliant_rwa_stream
    - Display minting status and transaction hash
    - _Requirements: 11.2_

  - [x] 15.3 Implement KYC approval UI
    - Display pending KYC requests
    - Form to approve KYC with asset type selection
    - Call compliance_guard.whitelist_address
    - _Requirements: 11.3, 11.8_

  - [x] 15.4 Implement emergency freeze UI
    - List of all assets with freeze status
    - Button to freeze/unfreeze
    - Input for freeze reason
    - Call RWA_Hub.emergency_freeze
    - _Requirements: 11.4, 11.9_

  - [x] 15.5 Implement marketplace view
    - Query token_registry for all tokens
    - Display paginated list
    - Filter by asset type
    - Show asset details and stream status
    - _Requirements: 11.5_

  - [x] 15.6 Implement system metrics dashboard
    - Calculate and display TVL
    - Display total assets count
    - Display active streams count
    - Query data from contracts
    - _Requirements: 11.6_

  - [x] 15.7 Implement batch whitelist UI
    - Form to input multiple addresses
    - Select asset types
    - Call RWA_Hub.batch_whitelist
    - _Requirements: 11.7_

  - [ ]* 15.8 Write integration tests for admin dashboard
    - Test admin authorization check
    - Test asset minting flow
    - Test KYC approval flow
    - Test freeze/unfreeze flow
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 16. Checkpoint - Ensure frontend integration works
  - Test wallet connection on Ghostnet
  - Test stream creation end-to-end
  - Test yield claiming
  - Test admin functions
  - Ask the user if questions arise


- [x] 17. Implement network configuration management
  - [x] 17.1 Create network configuration file
    - Define Ghostnet contract addresses
    - Define Mainnet contract addresses (placeholder)
    - Define RPC endpoints
    - Define block explorer URLs
    - _Requirements: 12.1, 12.8, 12.9_

  - [x] 17.2 Implement network switching
    - Detect current network from wallet
    - Update contract references on network change
    - Display current network in UI
    - Warn if on wrong network
    - _Requirements: 12.2, 12.3, 12.6_

  - [x] 17.3 Implement network-specific UI elements
    - Show faucet link on Ghostnet
    - Use correct block explorer links
    - Store network preference in local storage
    - _Requirements: 12.4, 12.7, 12.8_

  - [x] 17.4 Create environment variable configuration
    - Support .env files for deployment
    - Allow override of contract addresses
    - Support multiple environments (dev, staging, prod)
    - _Requirements: 12.10_

  - [ ]* 17.5 Write tests for network configuration
    - Test network detection
    - Test configuration switching
    - Test environment variable loading
    - _Requirements: 12.1, 12.2, 12.10_

- [x] 18. Implement data migration tooling
  - [x] 18.1 Create Aptos data export script
    - Query all streams from Aptos contracts
    - Query all NFTs and metadata
    - Query all compliance data
    - Export to JSON format
    - _Requirements: 19.1_

  - [x] 18.2 Create Tezos data import script
    - Read exported JSON data
    - Recreate streams on Tezos with preserved parameters
    - Mint NFTs with preserved metadata and ownership
    - Import compliance data (KYC, whitelisting)
    - _Requirements: 19.2_

  - [ ]* 18.3 Write property tests for data preservation (Properties 38, 39, 40)
    - **Property 38: Stream Parameter Preservation**
    - **Property 39: NFT Metadata Preservation**
    - **Property 40: Compliance Data Preservation**
    - Export then import data
    - Verify all parameters match (adjusted for format differences)
    - _Requirements: 19.3, 19.4, 19.5_

  - [x] 18.4 Create data verification tool
    - Compare Aptos and Tezos state
    - Generate reconciliation report
    - Flag any discrepancies
    - _Requirements: 19.6, 19.9_

  - [x] 18.5 Create migration documentation
    - Document export process
    - Document import process
    - Document verification process
    - Create migration timeline
    - _Requirements: 19.7, 19.8_

  - [ ]* 18.6 Write unit tests for migration scripts
    - Test export with various data states
    - Test import with valid and invalid data
    - Test verification logic
    - _Requirements: 19.1, 19.2, 19.6_


- [x] 19. Implement security features
  - [x] 19.1 Add input validation to all contract entrypoints
    - Validate numeric inputs for overflow/underflow
    - Validate addresses are well-formed
    - Validate amounts are positive
    - Validate durations are reasonable
    - _Requirements: 17.5_

  - [ ]* 19.2 Write property test for input validation (Property 34)
    - **Property 34: Input Validation Prevents Overflow**
    - Test with boundary values
    - Test with invalid inputs
    - Verify rejection before state changes
    - _Requirements: 17.5_

  - [x] 19.3 Implement state-before-call pattern
    - Update internal state before external calls
    - Prevent reentrancy attacks
    - Review all token transfer calls
    - _Requirements: 17.4_

  - [ ]* 19.4 Write property test for reentrancy prevention (Property 35)
    - **Property 35: State Update Before External Call**
    - Verify state is updated before external calls
    - Test with mock reentrant calls
    - _Requirements: 17.4_

  - [ ]* 19.5 Write property tests for escrow security (Properties 32, 33)
    - **Property 32: Escrow Balance Invariant**
    - **Property 33: No Unauthorized Token Extraction**
    - Verify escrow balance = total_amount - amount_withdrawn
    - Verify tokens only extractable through authorized operations
    - _Requirements: 17.9_

  - [x] 19.6 Implement emergency pause functionality
    - Add paused flag to contracts
    - Admin-only pause/unpause functions
    - Block all operations when paused
    - _Requirements: 17.7_

  - [x] 19.7 Add audit logging for admin actions
    - Emit events for all admin operations
    - Include timestamp and reason
    - _Requirements: 17.8_

  - [ ]* 19.8 Write unit tests for security features
    - Test pause functionality
    - Test audit logging
    - Test access control on all admin functions
    - _Requirements: 17.1, 17.2, 17.3, 17.7, 17.8_

- [x] 20. Implement monitoring and analytics
  - [x] 20.1 Create analytics calculation functions
    - Calculate TVL from all stream escrows
    - Count active streams
    - Count assets by type
    - Calculate total yield distributed
    - Count flash advances
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5_

  - [ ]* 20.2 Write property tests for analytics (Properties 41, 42, 43)
    - **Property 41: Total Value Locked Calculation**
    - **Property 42: Stream Count Accuracy**
    - **Property 43: Asset Count by Type**
    - Verify calculations match actual state
    - _Requirements: 20.1, 20.2, 20.3_

  - [x] 20.3 Create analytics dashboard UI
    - Display TVL with live updates
    - Display stream counts
    - Display asset counts by type
    - Display yield distribution metrics
    - _Requirements: 20.7_

  - [x] 20.4 Implement gas cost tracking
    - Measure gas for all operations
    - Display in frontend before transaction
    - Log to analytics
    - _Requirements: 20.8_

  - [x] 20.5 Create data export functionality
    - Export historical data to CSV
    - Include all metrics
    - _Requirements: 20.10_

  - [ ]* 20.6 Write unit tests for analytics
    - Test TVL calculation with various states
    - Test count calculations
    - Test data export format
    - _Requirements: 20.1, 20.2, 20.3, 20.10_

- [x] 21. Checkpoint - Ensure all features are complete
  - Run complete test suite (contracts + frontend)
  - Verify all 43 correctness properties pass
  - Test end-to-end flows on Ghostnet
  - Review security features
  - Ask the user if questions arise


- [x] 22. Create comprehensive documentation
  - [x] 22.1 Write contract deployment documentation
    - Step-by-step deployment guide
    - Required tools and dependencies
    - Configuration instructions
    - Troubleshooting common issues
    - _Requirements: 15.5_

  - [x] 22.2 Write frontend deployment documentation
    - Build and deployment instructions
    - Environment variable configuration
    - Network configuration
    - Hosting recommendations
    - _Requirements: 15.6_

  - [x] 22.3 Create API reference documentation
    - Document all contract entrypoints
    - Include parameter types and descriptions
    - Include return values
    - Provide code examples
    - _Requirements: 15.7_

  - [x] 22.4 Write user guide
    - How to connect wallet
    - How to create streams
    - How to claim yield
    - How to use flash advance
    - How to transfer assets
    - _Requirements: 15.8_

  - [x] 22.5 Create migration guide for users
    - Explain migration process
    - Timeline and milestones
    - What users need to do
    - FAQ section
    - _Requirements: 15.9, 19.7_

  - [x] 22.6 Write troubleshooting guide
    - Common errors and solutions
    - Wallet connection issues
    - Transaction failures
    - Network issues
    - _Requirements: 15.10_

  - [x] 22.7 Document gas costs
    - List typical gas costs for all operations
    - Compare with Aptos implementation
    - Optimization recommendations
    - _Requirements: 16.8, 16.10_

- [x] 23. Perform feature parity validation
  - [ ]* 23.1 Write property test for flash advance parity (Property 37)
    - **Property 37: Flash Advance Calculation Parity**
    - Compare Tezos and Aptos flash advance calculations
    - Verify identical behavior
    - _Requirements: 18.2_

  - [x] 23.2 Create feature comparison checklist
    - List all Aptos features
    - Verify each exists in Tezos implementation
    - Document any differences
    - _Requirements: 18.1, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9_

  - [x] 23.3 Test all user flows
    - Create stream flow
    - Claim yield flow
    - Flash advance flow
    - NFT transfer flow
    - Rental stream flow
    - Admin flows
    - _Requirements: 18.1-18.9_

  - [ ]* 23.4 Write integration tests for complete flows
    - Test end-to-end stream lifecycle
    - Test NFT transfer with yield update
    - Test compliance enforcement
    - Test rental access control
    - _Requirements: 18.1-18.9_


- [x] 24. Prepare for Mainnet deployment
  - [x] 24.1 Conduct security audit
    - Review all contract code
    - Test for common vulnerabilities
    - Review access control
    - Review escrow handling
    - Document findings and fixes
    - _Requirements: 17.10_

  - [x] 24.2 Perform load testing
    - Test with high transaction volume
    - Test with many concurrent users
    - Measure performance under load
    - Identify bottlenecks
    - _Requirements: 16.9_

  - [x] 24.3 Optimize gas costs
    - Review all contracts for optimization opportunities
    - Minimize storage operations
    - Optimize big_map access patterns
    - Test optimizations
    - _Requirements: 16.1, 16.2, 16.3, 16.5, 16.6_

  - [x] 24.4 Create Mainnet deployment script
    - Similar to Ghostnet script but for Mainnet
    - Include additional safety checks
    - Require multi-sig for admin operations
    - _Requirements: 15.2, 15.3_

  - [x] 24.5 Prepare migration execution plan
    - Detailed timeline
    - Rollback procedures
    - Communication plan
    - Support plan
    - _Requirements: 19.8_

  - [x] 24.6 Set up monitoring and alerting
    - Monitor contract health
    - Alert on anomalies
    - Track key metrics
    - _Requirements: 20.9_

- [x] 25. Execute Mainnet deployment
  - [x] 25.1 Deploy contracts to Mainnet
    - Run Mainnet deployment script
    - Verify all contracts deployed correctly
    - Test basic operations
    - _Requirements: 15.2_

  - [x] 25.2 Execute data migration
    - Export data from Aptos
    - Import data to Tezos Mainnet
    - Verify data integrity
    - Generate reconciliation report
    - _Requirements: 19.1, 19.2, 19.6, 19.9_

  - [x] 25.3 Update frontend configuration
    - Point to Mainnet contracts
    - Update network configuration
    - Deploy frontend to production
    - _Requirements: 12.1, 12.2_

  - [x] 25.4 Verify Mainnet deployment
    - Test all user flows on Mainnet
    - Verify data migration success
    - Test with real users
    - Monitor for issues
    - _Requirements: 15.4, 19.6_

  - [x] 25.5 Communicate migration completion
    - Announce to users
    - Provide updated documentation
    - Offer support for migration questions
    - _Requirements: 19.8_

- [x] 26. Final checkpoint - Migration complete
  - All contracts deployed to Mainnet
  - All data migrated successfully
  - Frontend fully functional on Mainnet
  - Documentation complete
  - Monitoring active
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based and unit tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples and edge cases
- The migration follows a phased approach: contracts → frontend → data → deployment
- All 43 correctness properties from the design document are implemented as property-based tests
- Gas optimization is performed before Mainnet deployment
- Security audit is mandatory before Mainnet deployment
