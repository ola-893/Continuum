// ===================================================================
// sources/rwa_hub.move
// Integration Hub: Complete RWA Ecosystem with Auto Token Registration
// ===================================================================
module continuum::rwa_hub {
    use std::signer;
    use std::error;
    use aptos_framework::object;
    use aptos_framework::timestamp;
    use aptos_token_objects::token::Token;
    use aptos_std::table::{Self, Table};
    use continuum::streaming_protocol;
    use continuum::asset_yield_protocol;
    use continuum::compliance_guard;
    use continuum::token_registry;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 100;
    const E_COMPLIANCE_CHECK_FAILED: u64 = 101;

    /// Registry to track ACTIVE rentals for assets
    struct RentalRegistry has key {
        // Maps Asset Object Address -> Active Stream ID
        active_rentals: Table<address, u64>, 
    }

    /// Initialize the complete RWA ecosystem for a specific coin type
    public entry fun initialize_rwa_ecosystem<CoinType>(deployer: &signer) {
        streaming_protocol::initialize<CoinType>(deployer);
        asset_yield_protocol::initialize<CoinType>(deployer);
        compliance_guard::initialize(deployer);
        token_registry::initialize(deployer);

        // Initialize Rental Registry
        let deployer_addr = signer::address_of(deployer);
        if (!exists<RentalRegistry>(deployer_addr)) {
            move_to(deployer, RentalRegistry {
                active_rentals: table::new(),
            });
        };
    }

    /// Create a compliant RWA yield stream with full verification and auto-registration
    /// This is the main entry point for creating asset-backed yield streams
    /// CRITICAL FIX: No more expected_stream_id - we capture the real ID!
    public entry fun create_compliant_rwa_stream<CoinType>(
        issuer: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        compliance_addr: address,
        token_obj_addr: address,
        total_yield: u64,
        duration: u64,
        asset_type: u8, // 1=Real Estate, 2=Securities, 3=Commodities, 4=Art
        metadata_uri: vector<u8>, // NFT metadata URI for registry
        // REMOVED: expected_stream_id parameter - no longer needed!
    ) {
        let issuer_addr = signer::address_of(issuer);
        
        // Verify issuer is authorized for this asset type
        let is_authorized = compliance_guard::is_authorized_recipient(
            compliance_addr,
            issuer_addr,
            asset_type,
        );
        
        assert!(is_authorized, error::permission_denied(E_NOT_AUTHORIZED));

        // CRITICAL FIX: Capture the actual stream_id returned from creation
        let actual_stream_id = asset_yield_protocol::create_asset_yield_stream<CoinType>(
            issuer,
            stream_registry_addr,
            yield_registry_addr,
            token_obj_addr,
            total_yield,
            duration,
        );

        // Convert asset_type from compliance types (1-4) to registry types (0-based)
        let registry_asset_type = if (asset_type == 1) {
            0u8 // Real Estate
        } else if (asset_type == 2) {
            1u8 // Securities (mapped as Car for now)
        } else if (asset_type == 3) {
            2u8 // Commodities
        } else {
            0u8 // Default to Real Estate for Art/others
        };

        // CRITICAL FIX: Register using the ACTUAL stream_id
        token_registry::register_token(
            token_obj_addr,
            registry_asset_type,
            actual_stream_id,
            metadata_uri,
        );
    }

    /// Simplified version for real estate (most common use case)
    public entry fun create_real_estate_stream<CoinType>(
        issuer: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        compliance_addr: address,
        token_obj_addr: address,
        total_yield: u64,
        duration: u64,
        metadata_uri: vector<u8>,
        // 🔧 REMOVED: expected_stream_id
    ) {
        create_compliant_rwa_stream<CoinType>(
            issuer,
            stream_registry_addr,
            yield_registry_addr,
            compliance_addr,
            token_obj_addr,
            total_yield,
            duration,
            1, // ASSET_TYPE_REAL_ESTATE
            metadata_uri,
        );
    }

    /// Create securities/bonds stream
    public entry fun create_securities_stream<CoinType>(
        issuer: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        compliance_addr: address,
        token_obj_addr: address,
        total_yield: u64,
        duration: u64,
        metadata_uri: vector<u8>,
        // 🔧 REMOVED: expected_stream_id
    ) {
        create_compliant_rwa_stream<CoinType>(
            issuer,
            stream_registry_addr,
            yield_registry_addr,
            compliance_addr,
            token_obj_addr,
            total_yield,
            duration,
            2, // ASSET_TYPE_SECURITIES
            metadata_uri,
        );
    }

    /// Create commodities stream
    public entry fun create_commodities_stream<CoinType>(
        issuer: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        compliance_addr: address,
        token_obj_addr: address,
        total_yield: u64,
        duration: u64,
        metadata_uri: vector<u8>,
        // 🔧 REMOVED: expected_stream_id
    ) {
        create_compliant_rwa_stream<CoinType>(
            issuer,
            stream_registry_addr,
            yield_registry_addr,
            compliance_addr,
            token_obj_addr,
            total_yield,
            duration,
            3, // ASSET_TYPE_COMMODITIES
            metadata_uri,
        );
    }

    // ===================================================================
    // BUG FIX: Auto-Lookup Compliance Check Functions
    // ===================================================================

    /// Claim yield with AUTO-LOOKUP compliance check (Fixes the bug)
    /// No more asset_type parameter - we look it up from the registry!
    public entry fun compliant_claim_yield<CoinType>(
        claimer: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        compliance_addr: address,
        token_obj_addr: address,
    ) {
        let claimer_addr = signer::address_of(claimer);
        
        // 1. Lookup the asset type from the registry to prevent user error
        let registry_type = token_registry::get_asset_type_by_token(token_obj_addr);
        
        // 2. Convert Registry Type (0-based) back to Compliance Type (1-based)
        let compliance_type = registry_type + 1; 

        // 3. Verify claimer is authorized for this specific asset type
        let is_authorized = compliance_guard::is_authorized_recipient(
            compliance_addr,
            claimer_addr,
            compliance_type,
        );
        assert!(is_authorized, error::permission_denied(E_COMPLIANCE_CHECK_FAILED));

        // 4. Proceed with claim
        asset_yield_protocol::claim_yield_for_asset<CoinType>(
            claimer,
            stream_registry_addr,
            yield_registry_addr,
            token_obj_addr,
        );
    }

    /// Flash advance with AUTO-LOOKUP compliance check
    /// No more asset_type parameter - eliminates the mismatch bug!
    public entry fun compliant_flash_advance<CoinType>(
        owner: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        compliance_addr: address,
        token_obj_addr: address,
        amount_requested: u64,
    ) {
        let owner_addr = signer::address_of(owner);
        
        // 1. Lookup Asset Type from registry
        let registry_type = token_registry::get_asset_type_by_token(token_obj_addr);
        let compliance_type = registry_type + 1; 

        // 2. Verify owner is authorized
        let is_authorized = compliance_guard::is_authorized_recipient(
            compliance_addr,
            owner_addr,
            compliance_type,
        );
        assert!(is_authorized, error::permission_denied(E_COMPLIANCE_CHECK_FAILED));

        // 3. Proceed with flash advance
        asset_yield_protocol::flash_advance_rwa_yield<CoinType>(
            owner,
            stream_registry_addr,
            yield_registry_addr,
            token_obj_addr,
            amount_requested,
        );
    }

    /// Emergency: Freeze stream (admin only)
    public entry fun emergency_freeze<CoinType>(
        admin: &signer,
        compliance_addr: address,
        stream_registry_addr: address,
        stream_id: u64,
        reason: vector<u8>,
    ) {
        compliance_guard::toggle_stream_freeze<CoinType>(
            admin,
            compliance_addr,
            stream_registry_addr,
            stream_id,
            true,
            reason,
        );
    }

    /// Emergency: Unfreeze stream (admin only)
    public entry fun emergency_unfreeze<CoinType>(
        admin: &signer,
        compliance_addr: address,
        stream_registry_addr: address,
        stream_id: u64,
    ) {
        compliance_guard::toggle_stream_freeze<CoinType>(
            admin,
            compliance_addr,
            stream_registry_addr,
            stream_id,
            false,
            b"Unfrozen by admin",
        );
    }

    /// Batch whitelist multiple users (admin only)
    public entry fun batch_whitelist<CoinType>(
        admin: &signer,
        compliance_addr: address,
        users: vector<address>,
        asset_types: vector<u8>,
    ) {
        let i = 0;
        let len = std::vector::length(&users);
        
        while (i < len) {
            let user = *std::vector::borrow(&users, i);
            compliance_guard::whitelist_address(
                admin,
                compliance_addr,
                user,
                asset_types,
            );
            i = i + 1;
        };
    }

    /// One-stop setup: Initialize + Setup Admin KYC + Whitelist
    public entry fun quick_setup_with_admin<CoinType>(
        admin: &signer,
        jurisdiction: vector<u8>,
        verification_level: u8,
        expiry_time: u64,
    ) {
        let admin_addr = signer::address_of(admin);
        
        // Initialize entire ecosystem
        streaming_protocol::initialize<CoinType>(admin);
        asset_yield_protocol::initialize<CoinType>(admin);
        compliance_guard::initialize(admin);
        token_registry::initialize(admin);

        // Initialize Rental Registry
        if (!exists<RentalRegistry>(admin_addr)) {
            move_to(admin, RentalRegistry {
                active_rentals: table::new(),
            });
        };

        // Setup admin KYC
        compliance_guard::register_identity(
            admin,
            admin_addr,
            admin_addr,
            true,
            jurisdiction,
            verification_level,
            expiry_time,
        );

        // Whitelist admin for all asset types
        compliance_guard::whitelist_address(
            admin,
            admin_addr,
            admin_addr,
            vector[1, 2, 3, 4], // All asset types
        );
    }

    // ===================================================================
    // RENTAL & IoT INTEGRATION (Pay-as-you-go Access)
    // ===================================================================

    /// RENTAL INNOVATION: Pay-as-you-go Access
    /// Tenant streams money to the Asset Owner to gain physical access.
    /// No whitelisting required for the Tenant (Open Access).
    /// 
    /// Use Cases:
    /// - Car rentals: Stream $50/hour to unlock Tesla
    /// - Apartment rentals: Stream $3000/month to smart lock
    /// - Equipment rentals: Stream $10/day to unlock machinery
    public entry fun stream_rent_to_asset<CoinType>(
        tenant: &signer,
        stream_registry_addr: address,
        token_obj_addr: address, // The Asset (Car/House)
        payment_amount: u64,     // Total budget for this session
        duration: u64,           // How long this budget should last (in seconds)
    ) acquires RentalRegistry {
        // 1. Find out who owns the Asset right now (The Landlord/Car Rental Co.)
        let token_obj = object::address_to_object<Token>(token_obj_addr);
        let current_owner = object::owner(token_obj);

        // 2. Calculate flow rate (amount per second)
        let flow_rate = payment_amount / duration;
        let start_time = timestamp::now_seconds();

        // 3. Create the stream FROM Tenant TO Landlord
        // Tenant's coins are locked, Landlord receives them over time
        let stream_id = streaming_protocol::create_stream_with_addr<CoinType>(
            stream_registry_addr,
            tenant,               // Sender (Tenant locks money)
            current_owner,        // Recipient (Landlord gets paid)
            flow_rate,
            start_time,
            duration,
            payment_amount
        );

        // 4. Register this as the ACTIVE rental in the registry
        let rental_registry = borrow_global_mut<RentalRegistry>(@continuum);

        // If there was an old rental, remove it (overwrite)
        if (table::contains(&rental_registry.active_rentals, token_obj_addr)) {
            table::remove(&mut rental_registry.active_rentals, token_obj_addr);
        };
        
        // Save the new stream ID
        table::add(&mut rental_registry.active_rentals, token_obj_addr, stream_id);
    }

    #[view]
    /// IoT Check: Should the device operate?
    /// Returns TRUE if the tenant has an active stream paying the landlord.
    /// 
    /// Called by: Tesla Head Unit / Smart Lock / IoT Gateway / Industrial Equipment
    /// 
    /// Security Logic:
    /// 1. Stream must be ACTIVE (status = 0)
    /// 2. Stream recipient must match current asset owner
    /// 3. If asset was transferred, old streams become invalid
    public fun check_access_status<CoinType>(
        stream_registry_addr: address,
        stream_id: u64,
        token_obj_addr: address, // The Asset (Car/House/Equipment)
    ): bool {
        // 1. Get Stream Info
        let (_, recipient, _, _, _, _, _, status) = 
            streaming_protocol::get_stream_info<CoinType>(stream_registry_addr, stream_id);

        // 2. Get Current Asset Owner
        let token_obj = object::address_to_object<Token>(token_obj_addr);
        let current_owner = object::owner(token_obj);

        // 3. The Logic Rule:
        // - Stream must be ACTIVE (status = 0 means active)
        // - Stream recipient must match current asset owner (Security check)
        // - If owner changes, rental is invalidated
        
        if (status != 0) { 
            return false 
        }; 
        
        if (recipient != current_owner) { 
            return false 
        }; 
        
        true
    }

    // ===================================================================
    // View Functions for Frontend Integration
    // ===================================================================

    #[view]
    /// Check if user can participate in RWA ecosystem
    public fun can_participate(
        compliance_addr: address,
        user: address,
        asset_type: u8,
    ): bool {
        compliance_guard::is_authorized_recipient(
            compliance_addr,
            user,
            asset_type,
        )
    }

    #[view]
    /// Get complete stream status
    public fun get_stream_status<CoinType>(
        stream_registry_addr: address,
        compliance_addr: address,
        stream_id: u64,
    ): (u64, u64, u64, bool) {
        let claimable = streaming_protocol::claimable_balance_with_addr<CoinType>(stream_registry_addr, stream_id);
        let escrow_balance = streaming_protocol::get_escrow_balance<CoinType>(
            stream_registry_addr,
            stream_id,
        );
        let is_frozen = compliance_guard::is_stream_frozen(compliance_addr, stream_id);
        
        let (_, _, total_amount, _, _, _, amount_withdrawn, _) = streaming_protocol::get_stream_info<CoinType>(
            stream_registry_addr,
            stream_id,
        );
        
        (claimable, escrow_balance, total_amount - amount_withdrawn, is_frozen)
    }

    #[view]
    /// Check user's complete compliance status
    public fun get_user_compliance_status(
        compliance_addr: address,
        user: address,
    ): (bool, bool, bool) {
        let is_admin = compliance_guard::is_admin(compliance_addr, user);
        let has_kyc = compliance_guard::has_valid_kyc(compliance_addr, user);
        
        // Check if authorized for at least one asset type
        let can_trade_real_estate = compliance_guard::is_authorized_recipient(
            compliance_addr,
            user,
            1, // Real Estate
        );
        
        (is_admin, has_kyc, can_trade_real_estate)
    }

    #[view]
    /// Get all registered tokens from registry
    public fun get_all_marketplace_tokens(): vector<token_registry::TokenIndexEntry> {
        token_registry::get_all_tokens()
    }

    #[view]
    /// Get paginated tokens for marketplace
    public fun get_marketplace_tokens_paginated(
        offset: u64,
        limit: u64,
    ): vector<token_registry::TokenIndexEntry> {
        token_registry::get_all_tokens_paginated(offset, limit)
    }

    #[view]
    /// Get tokens by asset type for filtered marketplace views
    public fun get_tokens_by_asset_type(asset_type: u8): vector<token_registry::TokenIndexEntry> {
        token_registry::get_tokens_by_type(asset_type)
    }

    #[view]
    /// Get total token count for marketplace pagination
    public fun get_total_token_count(): u64 {
        token_registry::get_token_count()
    }

    #[view]
    /// Get token details by address
    public fun get_token_details(token_address: address): token_registry::TokenIndexEntry {
        token_registry::get_token(token_address)
    }

    #[view]
    /// Get token by stream ID (for yield lookup integration)
    public fun get_token_by_stream(stream_id: u64): token_registry::TokenIndexEntry {
        token_registry::get_token_by_stream_id(stream_id)
    }

    // ===================================================================
    // Rental View Functions
    // ===================================================================

    #[view]
    /// Check if an asset is currently rented
    /// Returns: (IsRented, ActiveStreamId)
    public fun get_active_rental(token_obj_addr: address): (bool, u64) acquires RentalRegistry {
        if (!exists<RentalRegistry>(@continuum)) {
            return (false, 0)
        };
        let registry = borrow_global<RentalRegistry>(@continuum);
        
        if (table::contains(&registry.active_rentals, token_obj_addr)) {
            let stream_id = *table::borrow(&registry.active_rentals, token_obj_addr);
            (true, stream_id)
        } else {
            (false, 0)
        }
    }

    #[view]
    /// Get detailed Dashboard Data for a Rental
    /// Returns: (Tenant, Landlord, TimeRemaining, TotalPaidSoFar, IsActive)
    public fun get_rental_details<CoinType>(
        stream_registry_addr: address,
        stream_id: u64
    ): (address, address, u64, u64, bool) {
        // 1. Get raw info
        let (sender, recipient, total, _, start, stop, withdrawn, status) = 
            streaming_protocol::get_stream_info<CoinType>(stream_registry_addr, stream_id);
        
        // 2. Calculate time remaining
        let current_time = timestamp::now_seconds();
        let time_remaining = if (current_time >= stop) { 0 } else { stop - current_time };
        
        // 3. Status check (0 = Active)
        let is_active = status == 0;

        (sender, recipient, time_remaining, withdrawn, is_active)
    }

    /// EMERGENCY FIX: Initialize ONLY the Rental Registry
    /// Run this if you are upgrading an existing contract!
    public entry fun initialize_rental_registry_only(deployer: &signer) {
        let deployer_addr = signer::address_of(deployer);
        if (!exists<RentalRegistry>(deployer_addr)) {
            move_to(deployer, RentalRegistry {
                active_rentals: table::new(),
            });
        };
    }
}