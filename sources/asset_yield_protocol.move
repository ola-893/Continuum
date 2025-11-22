// ===================================================================
// sources/asset_yield_protocol.move
// RWA Asset Yield Protocol - NOW PROPERLY COUPLED TO NFT OWNERSHIP
// ===================================================================
module continuum::asset_yield_protocol {
    use std::signer;
    use std::error;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    
    // --- FIX IS HERE ---
    // We import the module 'object' so we can call 'object::exists_at'
    use aptos_framework::object; 
    // We import the struct 'Token' for the <Token> check
    use aptos_token_objects::token::Token;
    // -------------------

    use aptos_std::table::{Self, Table};
    use continuum::streaming_protocol;

    // Error codes
    const E_ASSET_NOT_REGISTERED: u64 = 10;
    const E_NOT_ASSET_OWNER: u64 = 11;
    const E_NOT_YIELD_CONTROLLER: u64 = 12;
    const E_ASSET_ALREADY_REGISTERED: u64 = 13;

    /// Asset yield stream registry
    struct AssetYieldRegistry<phantom CoinType> has key {
        // Maps Token Object Address -> StreamId
        asset_to_stream: Table<address, u64>,
        // Maps StreamId -> Yield Controller (Oracle address)
        yield_controllers: Table<u64, address>,
        // Maps StreamId -> Ownership checkpoint data
        ownership_checkpoints: Table<u64, OwnershipCheckpoint>,
        asset_stream_created_events: EventHandle<AssetStreamCreatedEvent>,
        yield_claimed_events: EventHandle<YieldClaimedEvent>,
        yield_rate_updated_events: EventHandle<YieldRateUpdatedEvent>,
    }

    /// Tracks ownership changes for fair yield distribution
    struct OwnershipCheckpoint has store, copy, drop {
        last_owner: address,
        last_claim_time: u64,
        pending_yield: u64,
    }

    struct AssetStreamCreatedEvent has drop, store {
        token_address: address,
        stream_id: u64,
        total_yield_amount: u64,
        duration: u64,
    }

    struct YieldClaimedEvent has drop, store {
        token_address: address,
        stream_id: u64,
        owner: address,
        amount: u64,
    }

    struct YieldRateUpdatedEvent has drop, store {
        stream_id: u64,
        old_flow_rate: u64,
        new_flow_rate: u64,
        updated_by: address,
    }

    /// Initialize asset yield registry
    public entry fun initialize<CoinType>(account: &signer) {
        let account_addr = signer::address_of(account);
        
        if (!exists<AssetYieldRegistry<CoinType>>(account_addr)) {
            move_to(account, AssetYieldRegistry<CoinType> {
                asset_to_stream: table::new(),
                yield_controllers: table::new(),
                ownership_checkpoints: table::new(),
                asset_stream_created_events: account::new_event_handle<AssetStreamCreatedEvent>(account),
                yield_claimed_events: account::new_event_handle<YieldClaimedEvent>(account),
                yield_rate_updated_events: account::new_event_handle<YieldRateUpdatedEvent>(account),
            });
        }
    }

    /// Create an asset-backed yield stream with REAL COIN LOCKING
    /// Token owner is determined dynamically via NFT ownership at claim time
    public entry fun create_asset_yield_stream<CoinType>(
        creator: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        token_obj_addr: address, // The Aptos Token Object address
        total_yield_amount: u64,
        duration: u64,
    ) acquires AssetYieldRegistry {
        let creator_addr = signer::address_of(creator);
        
        let yield_registry = borrow_global_mut<AssetYieldRegistry<CoinType>>(yield_registry_addr);
        
        // Ensure asset not already registered
        assert!(
            !table::contains(&yield_registry.asset_to_stream, token_obj_addr),
            error::already_exists(E_ASSET_ALREADY_REGISTERED)
        );

        // Verify token object exists and is valid
        // FIX IS HERE: Use 'object::is_object' instead of 'exists<Token>'
        assert!(object::is_object(token_obj_addr), error::not_found(E_ASSET_NOT_REGISTERED));

        // Calculate flow rate
        let flow_rate = total_yield_amount / duration;
        let start_time = aptos_framework::timestamp::now_seconds();

        // Create the underlying stream with REAL MONEY
        // Initial recipient is the stream address itself; updated at claim time
        let stream_id = streaming_protocol::create_stream_with_addr<CoinType>(
            stream_registry_addr,
            creator,
            stream_registry_addr, // Temporary recipient
            flow_rate,
            start_time,
            duration,
            total_yield_amount,
        );

        // Register asset mapping
        table::add(&mut yield_registry.asset_to_stream, token_obj_addr, stream_id);
        
        // Set yield controller (creator by default)
        table::add(&mut yield_registry.yield_controllers, stream_id, creator_addr);

        // Initialize ownership checkpoint
        table::add(&mut yield_registry.ownership_checkpoints, stream_id, OwnershipCheckpoint {
            last_owner: @0x0,
            last_claim_time: start_time,
            pending_yield: 0,
        });

        event::emit_event(&mut yield_registry.asset_stream_created_events, AssetStreamCreatedEvent {
            token_address: token_obj_addr,
            stream_id,
            total_yield_amount,
            duration,
        });
    }

    /// Claim yield for an asset - OWNERSHIP VERIFIED VIA NFT
    /// The actual token owner (determined on-chain by NFT ownership) claims the yield
    public entry fun claim_yield_for_asset<CoinType>(
        claimer: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        token_obj_addr: address,
    ) acquires AssetYieldRegistry {
        let claimer_addr = signer::address_of(claimer);

        let yield_registry = borrow_global_mut<AssetYieldRegistry<CoinType>>(yield_registry_addr);

        // Get stream ID for this asset
        assert!(
            table::contains(&yield_registry.asset_to_stream, token_obj_addr),
            error::not_found(E_ASSET_NOT_REGISTERED)
        );
        let stream_id = *table::borrow(&yield_registry.asset_to_stream, token_obj_addr);

        // ============================================================
        // CORE FIX: Verify NFT ownership using on-chain Object ownership
        // ============================================================
        // Convert address to Object<Token>
        let token_obj = object::address_to_object<Token>(token_obj_addr);
        
        // Verify the signer actually owns this NFT
        assert!(
            object::is_owner(token_obj, claimer_addr),
            error::permission_denied(E_NOT_ASSET_OWNER)
        );
        // ============================================================

        // Handle ownership checkpoint
        let checkpoint = table::borrow_mut(&mut yield_registry.ownership_checkpoints, stream_id);
        
        // Update stream recipient to current owner (NFT owner)
        streaming_protocol::update_recipient_with_addr<CoinType>(stream_registry_addr, stream_id, claimer_addr);
        
        // Calculate yield since last checkpoint
        let claimable = streaming_protocol::claimable_balance_with_addr<CoinType>(stream_registry_addr, stream_id);
        
        if (claimable > 0) {
            // Update checkpoint with current NFT owner
            checkpoint.last_owner = claimer_addr;
            checkpoint.last_claim_time = aptos_framework::timestamp::now_seconds();
            
            // Perform withdrawal - REAL MONEY TRANSFER to current NFT owner
            let amount = streaming_protocol::withdraw_with_addr<CoinType>(stream_registry_addr, stream_id, claimer);

            event::emit_event(&mut yield_registry.yield_claimed_events, YieldClaimedEvent {
                token_address: token_obj_addr,
                stream_id,
                owner: claimer_addr,
                amount,
            });
        }
    }

    /// Flash advance yield for RWA owners - OWNERSHIP VERIFIED VIA NFT
    public entry fun flash_advance_rwa_yield<CoinType>(
        owner: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        token_obj_addr: address,
        amount_requested: u64,
    ) acquires AssetYieldRegistry {
        let owner_addr = signer::address_of(owner);

        let yield_registry = borrow_global<AssetYieldRegistry<CoinType>>(yield_registry_addr);

        assert!(
            table::contains(&yield_registry.asset_to_stream, token_obj_addr),
            error::not_found(E_ASSET_NOT_REGISTERED)
        );
        let stream_id = *table::borrow(&yield_registry.asset_to_stream, token_obj_addr);

        // ============================================================
        // CORE FIX: Verify NFT ownership using on-chain Object ownership
        // ============================================================
        let token_obj = object::address_to_object<Token>(token_obj_addr);
        
        assert!(
            object::is_owner(token_obj, owner_addr),
            error::permission_denied(E_NOT_ASSET_OWNER)
        );
        // ============================================================

        // Update recipient to ensure proper authorization
        streaming_protocol::update_recipient_with_addr<CoinType>(stream_registry_addr, stream_id, owner_addr);

        // Execute flash advance - self-repaying loan
        streaming_protocol::flash_advance_with_addr<CoinType>(
            stream_registry_addr,
            stream_id,
            owner,
            amount_requested,
        );
    }

    /// Update yield rate (only yield controller can call)
    public entry fun update_yield_rate<CoinType>(
        controller: &signer,
        yield_registry_addr: address,
        stream_id: u64,
        new_flow_rate: u64,
    ) acquires AssetYieldRegistry {
        let controller_addr = signer::address_of(controller);
        let yield_registry = borrow_global_mut<AssetYieldRegistry<CoinType>>(yield_registry_addr);

        // Verify controller authorization
        assert!(
            table::contains(&yield_registry.yield_controllers, stream_id),
            error::not_found(E_ASSET_NOT_REGISTERED)
        );
        let authorized_controller = table::borrow(&yield_registry.yield_controllers, stream_id);
        assert!(
            controller_addr == *authorized_controller,
            error::permission_denied(E_NOT_YIELD_CONTROLLER)
        );

        event::emit_event(&mut yield_registry.yield_rate_updated_events, YieldRateUpdatedEvent {
            stream_id,
            old_flow_rate: 0,
            new_flow_rate,
            updated_by: controller_addr,
        });
    }

    #[view]
    /// Get stream ID for an asset
    public fun get_asset_stream_id<CoinType>(
        yield_registry_addr: address,
        token_obj_addr: address,
    ): u64 acquires AssetYieldRegistry {
        let yield_registry = borrow_global<AssetYieldRegistry<CoinType>>(yield_registry_addr);
        
        assert!(
            table::contains(&yield_registry.asset_to_stream, token_obj_addr),
            error::not_found(E_ASSET_NOT_REGISTERED)
        );
        
        *table::borrow(&yield_registry.asset_to_stream, token_obj_addr)
    }

    #[view]
    /// Check if asset has registered stream
    public fun is_asset_registered<CoinType>(
        yield_registry_addr: address,
        token_obj_addr: address,
    ): bool acquires AssetYieldRegistry {
        let yield_registry = borrow_global<AssetYieldRegistry<CoinType>>(yield_registry_addr);
        table::contains(&yield_registry.asset_to_stream, token_obj_addr)
    }

    #[view]
    /// Get ownership checkpoint info
    public fun get_ownership_checkpoint<CoinType>(
        yield_registry_addr: address,
        stream_id: u64,
    ): (address, u64, u64) acquires AssetYieldRegistry {
        let yield_registry = borrow_global<AssetYieldRegistry<CoinType>>(yield_registry_addr);
        
        assert!(
            table::contains(&yield_registry.ownership_checkpoints, stream_id),
            error::not_found(E_ASSET_NOT_REGISTERED)
        );
        
        let checkpoint = table::borrow(&yield_registry.ownership_checkpoints, stream_id);
        (checkpoint.last_owner, checkpoint.last_claim_time, checkpoint.pending_yield)
    }
}