// ===================================================================
// sources/token_registry.move
// Static Index Registry - "The Phonebook"
// ===================================================================
module continuum::token_registry {
    use std::signer;
    use std::vector;
    use aptos_framework::object;
    use aptos_framework::timestamp;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_token_objects::token::Token;
    use aptos_std::table::{Self, Table};
    use aptos_std::smart_table::{Self, SmartTable};

    // Declare rwa_hub as a friend module so it can call register_token
    friend continuum::rwa_hub;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_REGISTRY_NOT_INITIALIZED: u64 = 2;
    const E_TOKEN_ALREADY_REGISTERED: u64 = 3;
    const E_TOKEN_NOT_FOUND: u64 = 4;
    const E_INVALID_ASSET: u64 = 5;
    const E_NOT_RWA_HUB: u64 = 6;

    // Asset type constants
    const ASSET_TYPE_REAL_ESTATE: u8 = 0;
    const ASSET_TYPE_CAR: u8 = 1;
    const ASSET_TYPE_COMMODITIES: u8 = 2;

    /// IMMUTABLE TOKEN INFO - Only stores permanent data
    struct TokenIndexEntry has store, copy, drop {
        token_address: address,
        asset_type: u8,
        stream_id: u64,
        metadata_uri: vector<u8>,
        registered_at: u64,
    }

    /// Events for marketplace indexing
    struct TokenRegisteredEvent has drop, store {
        token_address: address,
        asset_type: u8,
        stream_id: u64,
        timestamp: u64,
    }

    struct TokenUnregisteredEvent has drop, store {
        token_address: address,
        timestamp: u64,
    }

    /// STATIC INDEX REGISTRY
    struct TokenRegistry has key {
        token_index: SmartTable<address, TokenIndexEntry>,
        type_index: Table<u8, vector<address>>,
        stream_index: Table<u64, address>,
        admin: address,
        token_count: u64,
        token_registered_events: EventHandle<TokenRegisteredEvent>,
        token_unregistered_events: EventHandle<TokenUnregisteredEvent>,
    }

    /// Initialize the registry (called once by module publisher)
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        assert!(!exists<TokenRegistry>(account_addr), E_REGISTRY_NOT_INITIALIZED);
        
        move_to(account, TokenRegistry {
            token_index: smart_table::new<address, TokenIndexEntry>(),
            type_index: table::new<u8, vector<address>>(),
            stream_index: table::new<u64, address>(),
            admin: account_addr,
            token_count: 0,
            token_registered_events: account::new_event_handle<TokenRegisteredEvent>(account),
            token_unregistered_events: account::new_event_handle<TokenUnregisteredEvent>(account),
        });
    }

    /// Register token - only accessible by RWA hub
    public(friend) fun register_token(
        token_address: address,
        asset_type: u8,
        stream_id: u64,
        metadata_uri: vector<u8>,
    ) acquires TokenRegistry {
        let registry_addr = @continuum;
        assert!(exists<TokenRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global_mut<TokenRegistry>(registry_addr);
        
        // Validate token exists
        assert!(object::object_exists<Token>(token_address), E_INVALID_ASSET);
        
        // Check if token already registered
        assert!(
            !smart_table::contains(&registry.token_index, token_address),
            E_TOKEN_ALREADY_REGISTERED
        );
        
        // Check if stream_id already used
        assert!(
            !table::contains(&registry.stream_index, stream_id),
            E_TOKEN_ALREADY_REGISTERED
        );
        
        // Create immutable entry
        let entry = TokenIndexEntry {
            token_address,
            asset_type,
            stream_id,
            metadata_uri,
            registered_at: timestamp::now_seconds(),
        };
        
        // Add to main index
        smart_table::add(&mut registry.token_index, token_address, entry);
        registry.token_count = registry.token_count + 1;
        
        // Add to type index
        if (!table::contains(&registry.type_index, asset_type)) {
            table::add(&mut registry.type_index, asset_type, vector::empty<address>());
        };
        let type_tokens = table::borrow_mut(&mut registry.type_index, asset_type);
        vector::push_back(type_tokens, token_address);
        
        // Add to stream index
        table::add(&mut registry.stream_index, stream_id, token_address);
        
        // Emit event
        event::emit_event(&mut registry.token_registered_events, TokenRegisteredEvent {
            token_address,
            asset_type,
            stream_id,
            timestamp: timestamp::now_seconds(),
        });
    }

    #[view]
    /// Get all tokens in registry
    public fun get_all_tokens(): vector<TokenIndexEntry> acquires TokenRegistry {
        let registry_addr = @continuum;
        
        if (!exists<TokenRegistry>(registry_addr)) {
            return vector::empty<TokenIndexEntry>()
        };
        
        let registry = borrow_global<TokenRegistry>(registry_addr);
        let result = vector::empty<TokenIndexEntry>();
        
        smart_table::for_each_ref(&registry.token_index, |_key, value| {
            vector::push_back(&mut result, *value);
        });
        
        result
    }

    #[view]
    /// Get paginated tokens for efficient marketplace loading
    public fun get_all_tokens_paginated(
        offset: u64,
        limit: u64,
    ): vector<TokenIndexEntry> acquires TokenRegistry {
        let registry_addr = @continuum;
        
        if (!exists<TokenRegistry>(registry_addr)) {
            return vector::empty<TokenIndexEntry>()
        };
        
        let registry = borrow_global<TokenRegistry>(registry_addr);
        let total = smart_table::length(&registry.token_index);
        
        if (offset >= total || limit == 0) {
            return vector::empty<TokenIndexEntry>()
        };
        
        let result = vector::empty<TokenIndexEntry>();
        let mut_count = 0;
        let mut_current = 0;
        
        smart_table::for_each_ref(&registry.token_index, |_key, value| {
            if (mut_current >= offset && mut_count < limit) {
                vector::push_back(&mut result, *value);
                mut_count = mut_count + 1;
            };
            mut_current = mut_current + 1;
        });
        
        result
    }

    #[view]
    /// Get total number of registered tokens
    public fun get_token_count(): u64 acquires TokenRegistry {
        let registry_addr = @continuum;
        
        if (!exists<TokenRegistry>(registry_addr)) {
            return 0
        };
        
        let registry = borrow_global<TokenRegistry>(registry_addr);
        smart_table::length(&registry.token_index)
    }

    #[view]
    /// Get tokens by asset type
    public fun get_tokens_by_type(asset_type: u8): vector<TokenIndexEntry> acquires TokenRegistry {
        let registry_addr = @continuum;
        
        if (!exists<TokenRegistry>(registry_addr)) {
            return vector::empty<TokenIndexEntry>()
        };
        
        let registry = borrow_global<TokenRegistry>(registry_addr);
        
        if (!table::contains(&registry.type_index, asset_type)) {
            return vector::empty<TokenIndexEntry>()
        };
        
        let token_addresses = table::borrow(&registry.type_index, asset_type);
        let result = vector::empty<TokenIndexEntry>();
        
        let len = vector::length(token_addresses);
        let i = 0;
        while (i < len) {
            let token_addr = *vector::borrow(token_addresses, i);
            if (smart_table::contains(&registry.token_index, token_addr)) {
                let entry = *smart_table::borrow(&registry.token_index, token_addr);
                vector::push_back(&mut result, entry);
            };
            i = i + 1;
        };
        
        result
    }

    #[view]
    /// Get token entry by address
    public fun get_token(token_address: address): TokenIndexEntry acquires TokenRegistry {
        let registry_addr = @continuum;
        assert!(exists<TokenRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global<TokenRegistry>(registry_addr);
        assert!(
            smart_table::contains(&registry.token_index, token_address),
            E_TOKEN_NOT_FOUND
        );
        
        *smart_table::borrow(&registry.token_index, token_address)
    }

    #[view]
    /// Get token by stream ID
    public fun get_token_by_stream_id(stream_id: u64): TokenIndexEntry acquires TokenRegistry {
        let registry_addr = @continuum;
        assert!(exists<TokenRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global<TokenRegistry>(registry_addr);
        assert!(
            table::contains(&registry.stream_index, stream_id),
            E_TOKEN_NOT_FOUND
        );
        
        let token_addr = *table::borrow(&registry.stream_index, stream_id);
        *smart_table::borrow(&registry.token_index, token_addr)
    }

    /// Admin removal for broken/fraudulent assets
    public entry fun unregister_token(
        account: &signer,
        token_address: address,
    ) acquires TokenRegistry {
        let registry_addr = @continuum;
        assert!(exists<TokenRegistry>(registry_addr), E_REGISTRY_NOT_INITIALIZED);
        
        let registry = borrow_global_mut<TokenRegistry>(registry_addr);
        let account_addr = signer::address_of(account);
        
        assert!(account_addr == registry.admin, E_NOT_AUTHORIZED);
        assert!(
            smart_table::contains(&registry.token_index, token_address),
            E_TOKEN_NOT_FOUND
        );
        
        let entry = smart_table::remove(&mut registry.token_index, token_address);
        registry.token_count = registry.token_count - 1;
        
        // Remove from stream index
        table::remove(&mut registry.stream_index, entry.stream_id);
        
        // Remove from type index
        if (table::contains(&registry.type_index, entry.asset_type)) {
            let type_tokens = table::borrow_mut(&mut registry.type_index, entry.asset_type);
            let (found, idx) = vector::index_of(type_tokens, &token_address);
            if (found) {
                vector::remove(type_tokens, idx);
            };
        };
        
        event::emit_event(&mut registry.token_unregistered_events, TokenUnregisteredEvent {
            token_address,
            timestamp: timestamp::now_seconds(),
        });
    }
}