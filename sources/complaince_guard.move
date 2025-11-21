// ===================================================================
// sources/compliance_guard.move
// Compliance & Governance Module
// ===================================================================
module aptos_rwa::compliance_guard {
    use std::signer;
    use std::error;
    use std::vector;
    use aptos_std::table::{Self, Table};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::account;
    use aptos_rwa::streaming_protocol;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 20;
    const E_COMPLIANCE_FAILED: u64 = 21;
    const E_STREAM_FROZEN: u64 = 22;
    const E_NOT_WHITELISTED: u64 = 23;

    /// Asset type categories for compliance
    const ASSET_TYPE_REAL_ESTATE: u8 = 1;
    const ASSET_TYPE_SECURITIES: u8 = 2;
    const ASSET_TYPE_COMMODITIES: u8 = 3;
    const ASSET_TYPE_ART: u8 = 4;

    /// Compliance registry
    struct ComplianceRegistry has key {
        whitelist: Table<address, vector<u8>>,
        frozen_streams: Table<u64, FreezeInfo>,
        admins: vector<address>,
        did_registry: Table<address, IdentityInfo>,
        compliance_events: EventHandle<ComplianceEvent>,
        freeze_events: EventHandle<FreezeEvent>,
    }

    struct FreezeInfo has store, copy, drop {
        reason: vector<u8>,
        frozen_at: u64,
        frozen_by: address,
    }

    struct IdentityInfo has store, copy, drop {
        is_kyc_verified: bool,
        jurisdiction: vector<u8>,
        verification_level: u8,
        expiry_time: u64,
    }

    struct ComplianceEvent has drop, store {
        user: address,
        asset_type: u8,
        action: vector<u8>,
        timestamp: u64,
    }

    struct FreezeEvent has drop, store {
        stream_id: u64,
        reason: vector<u8>,
        frozen: bool,
        timestamp: u64,
    }

    /// Initialize compliance registry
    public entry fun initialize(account: &signer) {
        let account_addr = signer::address_of(account);
        
        if (!exists<ComplianceRegistry>(account_addr)) {
            let admins = vector::empty<address>();
            vector::push_back(&mut admins, account_addr);

            move_to(account, ComplianceRegistry {
                whitelist: table::new(),
                frozen_streams: table::new(),
                admins,
                did_registry: table::new(),
                compliance_events: account::new_event_handle<ComplianceEvent>(account),
                freeze_events: account::new_event_handle<FreezeEvent>(account),
            });
        }
    }

    /// Add address to whitelist for specific asset types
    public entry fun whitelist_address(
        admin: &signer,
        compliance_addr: address,
        user: address,
        asset_types: vector<u8>,
    ) acquires ComplianceRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<ComplianceRegistry>(compliance_addr);
        
        assert!(
            vector::contains(&registry.admins, &admin_addr),
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        if (table::contains(&registry.whitelist, user)) {
            table::remove(&mut registry.whitelist, user);
        };
        table::add(&mut registry.whitelist, user, asset_types);

        event::emit_event(&mut registry.compliance_events, ComplianceEvent {
            user,
            asset_type: 0,
            action: b"whitelisted",
            timestamp: aptos_framework::timestamp::now_seconds(),
        });
    }

    /// Remove address from whitelist
    public entry fun remove_from_whitelist(
        admin: &signer,
        compliance_addr: address,
        user: address,
    ) acquires ComplianceRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<ComplianceRegistry>(compliance_addr);
        
        assert!(
            vector::contains(&registry.admins, &admin_addr),
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        if (table::contains(&registry.whitelist, user)) {
            table::remove(&mut registry.whitelist, user);
        };

        event::emit_event(&mut registry.compliance_events, ComplianceEvent {
            user,
            asset_type: 0,
            action: b"removed_from_whitelist",
            timestamp: aptos_framework::timestamp::now_seconds(),
        });
    }

    /// Register KYC/DID information
    public entry fun register_identity(
        admin: &signer,
        compliance_addr: address,
        user: address,
        is_kyc_verified: bool,
        jurisdiction: vector<u8>,
        verification_level: u8,
        expiry_time: u64,
    ) acquires ComplianceRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<ComplianceRegistry>(compliance_addr);
        
        assert!(
            vector::contains(&registry.admins, &admin_addr),
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        let identity = IdentityInfo {
            is_kyc_verified,
            jurisdiction,
            verification_level,
            expiry_time,
        };

        if (table::contains(&registry.did_registry, user)) {
            table::remove(&mut registry.did_registry, user);
        };
        table::add(&mut registry.did_registry, user, identity);

        event::emit_event(&mut registry.compliance_events, ComplianceEvent {
            user,
            asset_type: 0,
            action: b"kyc_registered",
            timestamp: aptos_framework::timestamp::now_seconds(),
        });
    }

    /// Check if user is authorized to receive RWA funds
    #[view]
    public fun is_authorized_recipient(
        compliance_addr: address,
        user: address,
        asset_type: u8,
    ): bool acquires ComplianceRegistry {
        let registry = borrow_global<ComplianceRegistry>(compliance_addr);

        // Check whitelist
        if (!table::contains(&registry.whitelist, user)) {
            return false
        };

        let authorized_types = table::borrow(&registry.whitelist, user);
        if (!vector::contains(authorized_types, &asset_type)) {
            return false
        };

        // Check KYC
        if (table::contains(&registry.did_registry, user)) {
            let identity = table::borrow(&registry.did_registry, user);
            if (!identity.is_kyc_verified) {
                return false
            };
            
            let current_time = aptos_framework::timestamp::now_seconds();
            if (current_time > identity.expiry_time) {
                return false
            };
        };

        true
    }

    /// Freeze/unfreeze a stream
    public entry fun toggle_stream_freeze<CoinType>(
        admin: &signer,
        compliance_addr: address,
        stream_registry_addr: address,
        stream_id: u64,
        freeze: bool,
        reason: vector<u8>,
    ) acquires ComplianceRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<ComplianceRegistry>(compliance_addr);
        
        assert!(
            vector::contains(&registry.admins, &admin_addr),
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        if (freeze) {
            let freeze_info = FreezeInfo {
                reason,
                frozen_at: aptos_framework::timestamp::now_seconds(),
                frozen_by: admin_addr,
            };
            
            if (table::contains(&registry.frozen_streams, stream_id)) {
                table::remove(&mut registry.frozen_streams, stream_id);
            };
            table::add(&mut registry.frozen_streams, stream_id, freeze_info);

            let stream_registry = streaming_protocol::borrow_registry_mut<CoinType>(stream_registry_addr);
            streaming_protocol::update_status<CoinType>(stream_registry, stream_id, 1);
        } else {
            if (table::contains(&registry.frozen_streams, stream_id)) {
                table::remove(&mut registry.frozen_streams, stream_id);
            };

            let stream_registry = streaming_protocol::borrow_registry_mut<CoinType>(stream_registry_addr);
            streaming_protocol::update_status<CoinType>(stream_registry, stream_id, 0);
        };

        event::emit_event(&mut registry.freeze_events, FreezeEvent {
            stream_id,
            reason,
            frozen: freeze,
            timestamp: aptos_framework::timestamp::now_seconds(),
        });
    }

    /// Check if stream is frozen
    #[view]
    public fun is_stream_frozen(
        compliance_addr: address,
        stream_id: u64,
    ): bool acquires ComplianceRegistry {
        let registry = borrow_global<ComplianceRegistry>(compliance_addr);
        table::contains(&registry.frozen_streams, stream_id)
    }

    /// Get freeze info
    #[view]
    public fun get_freeze_info(
        compliance_addr: address,
        stream_id: u64,
    ): (vector<u8>, u64, address) acquires ComplianceRegistry {
        let registry = borrow_global<ComplianceRegistry>(compliance_addr);
        
        assert!(
            table::contains(&registry.frozen_streams, stream_id),
            error::not_found(E_STREAM_FROZEN)
        );
        
        let info = table::borrow(&registry.frozen_streams, stream_id);
        (info.reason, info.frozen_at, info.frozen_by)
    }

    /// Add admin
    public entry fun add_admin(
        admin: &signer,
        compliance_addr: address,
        new_admin: address,
    ) acquires ComplianceRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<ComplianceRegistry>(compliance_addr);
        
        assert!(
            vector::contains(&registry.admins, &admin_addr),
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        if (!vector::contains(&registry.admins, &new_admin)) {
            vector::push_back(&mut registry.admins, new_admin);
        }
    }

    /// Remove admin
    public entry fun remove_admin(
        admin: &signer,
        compliance_addr: address,
        admin_to_remove: address,
    ) acquires ComplianceRegistry {
        let admin_addr = signer::address_of(admin);
        let registry = borrow_global_mut<ComplianceRegistry>(compliance_addr);
        
        assert!(
            vector::contains(&registry.admins, &admin_addr),
            error::permission_denied(E_NOT_AUTHORIZED)
        );

        let (found, index) = vector::index_of(&registry.admins, &admin_to_remove);
        if (found) {
            vector::remove(&mut registry.admins, index);
        };
    }

    /// Check if address is admin
    #[view]
    public fun is_admin(
        compliance_addr: address,
        user: address,
    ): bool acquires ComplianceRegistry {
        let registry = borrow_global<ComplianceRegistry>(compliance_addr);
        vector::contains(&registry.admins, &user)
    }

    /// Get identity info
    #[view]
    public fun get_identity_info(
        compliance_addr: address,
        user: address,
    ): (bool, vector<u8>, u8, u64) acquires ComplianceRegistry {
        let registry = borrow_global<ComplianceRegistry>(compliance_addr);
        
        assert!(
            table::contains(&registry.did_registry, user),
            error::not_found(E_NOT_AUTHORIZED)
        );
        
        let identity = table::borrow(&registry.did_registry, user);
        (
            identity.is_kyc_verified,
            identity.jurisdiction,
            identity.verification_level,
            identity.expiry_time
        )
    }

    /// Check if user has valid KYC
    #[view]
    public fun has_valid_kyc(
        compliance_addr: address,
        user: address,
    ): bool acquires ComplianceRegistry {
        let registry = borrow_global<ComplianceRegistry>(compliance_addr);
        
        if (!table::contains(&registry.did_registry, user)) {
            return false
        };
        
        let identity = table::borrow(&registry.did_registry, user);
        let current_time = aptos_framework::timestamp::now_seconds();
        
        identity.is_kyc_verified && current_time <= identity.expiry_time
    }
}