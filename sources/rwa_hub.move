// ===================================================================
// sources/rwa_hub.move
// Integration Hub: Complete RWA Ecosystem
// ===================================================================
module aptos_rwa::rwa_hub {
    use std::signer;
    use std::error;
    use aptos_rwa::streaming_protocol;
    use aptos_rwa::asset_yield_protocol;
    use aptos_rwa::compliance_guard;

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 100;
    const E_COMPLIANCE_CHECK_FAILED: u64 = 101;

    /// Initialize the complete RWA ecosystem for a specific coin type
    public entry fun initialize_rwa_ecosystem<CoinType>(deployer: &signer) {
        streaming_protocol::initialize<CoinType>(deployer);
        asset_yield_protocol::initialize<CoinType>(deployer);
        compliance_guard::initialize(deployer);
    }

    /// Create a compliant RWA yield stream with full verification
    /// This is the main entry point for creating asset-backed yield streams
    public entry fun create_compliant_rwa_stream<CoinType>(
        issuer: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        compliance_addr: address,
        token_obj_addr: address,
        total_yield: u64,
        duration: u64,
        asset_type: u8, // 1=Real Estate, 2=Securities, 3=Commodities, 4=Art
    ) {
        let issuer_addr = signer::address_of(issuer);
        
        // Verify issuer is authorized for this asset type
        let is_authorized = compliance_guard::is_authorized_recipient(
            compliance_addr,
            issuer_addr,
            asset_type,
        );
        
        assert!(is_authorized, error::permission_denied(E_NOT_AUTHORIZED));

        // Create the asset yield stream with REAL COIN LOCKING
        asset_yield_protocol::create_asset_yield_stream<CoinType>(
            issuer,
            stream_registry_addr,
            yield_registry_addr,
            token_obj_addr,
            total_yield,
            duration,
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
        );
    }

    /// Claim yield with compliance check
    public entry fun compliant_claim_yield<CoinType>(
        claimer: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        compliance_addr: address,
        token_obj_addr: address,
        asset_type: u8,
    ) {
        let claimer_addr = signer::address_of(claimer);
        
        // Verify claimer is still authorized
        let is_authorized = compliance_guard::is_authorized_recipient(
            compliance_addr,
            claimer_addr,
            asset_type,
        );
        
        assert!(is_authorized, error::permission_denied(E_COMPLIANCE_CHECK_FAILED));

        // Proceed with claim
        asset_yield_protocol::claim_yield_for_asset<CoinType>(
            claimer,
            stream_registry_addr,
            yield_registry_addr,
            token_obj_addr,
        );
    }

    /// Flash advance with compliance check
    public entry fun compliant_flash_advance<CoinType>(
        owner: &signer,
        stream_registry_addr: address,
        yield_registry_addr: address,
        compliance_addr: address,
        token_obj_addr: address,
        amount_requested: u64,
        asset_type: u8,
    ) {
        let owner_addr = signer::address_of(owner);
        
        // Verify owner is still authorized
        let is_authorized = compliance_guard::is_authorized_recipient(
            compliance_addr,
            owner_addr,
            asset_type,
        );
        
        assert!(is_authorized, error::permission_denied(E_COMPLIANCE_CHECK_FAILED));

        // Proceed with flash advance
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
    // View Functions for Frontend Integration
    // ===================================================================

    /// Check if user can participate in RWA ecosystem
    #[view]
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

    /// Get complete stream status
    #[view]
    public fun get_stream_status<CoinType>(
        stream_registry_addr: address,
        compliance_addr: address,
        stream_id: u64,
    ): (u64, u64, u64, bool) {
        let registry = streaming_protocol::borrow_registry<CoinType>(stream_registry_addr);
        let claimable = streaming_protocol::claimable_balance_of<CoinType>(registry, stream_id);
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

    /// Check user's complete compliance status
    #[view]
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
}