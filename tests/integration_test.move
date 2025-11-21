// ===================================================================
// tests/integration_tests.move
// Comprehensive Integration Tests
// ===================================================================
#[test_only]
module aptos_rwa::integration_tests {
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::{Self, AptosCoin};
    use aptos_framework::timestamp;
    use aptos_rwa::streaming_protocol;
    use aptos_rwa::asset_yield_protocol;
    use aptos_rwa::compliance_guard;
    use aptos_rwa::rwa_hub;

    // Test helper to setup test environment
    fun setup_test(aptos_framework: &signer): (signer, signer, signer) {
        // Initialize timestamp
        timestamp::set_time_has_started_for_testing(aptos_framework);
        
        // Initialize AptosCoin
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(aptos_framework);
        
        // Create test accounts
        let admin = account::create_account_for_test(@0xADMIN);
        let issuer = account::create_account_for_test(@0xISSUER);
        let investor = account::create_account_for_test(@0xINVESTOR);
        
        // Register and mint coins
        coin::register<AptosCoin>(&admin);
        coin::register<AptosCoin>(&issuer);
        coin::register<AptosCoin>(&investor);
        
        let coins_admin = coin::mint<AptosCoin>(100_000_000_000, &mint_cap);
        let coins_issuer = coin::mint<AptosCoin>(100_000_000_000, &mint_cap);
        let coins_investor = coin::mint<AptosCoin>(100_000_000_000, &mint_cap);
        
        coin::deposit(@0xADMIN, coins_admin);
        coin::deposit(@0xISSUER, coins_issuer);
        coin::deposit(@0xINVESTOR, coins_investor);
        
        // Cleanup capabilities
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
        
        (admin, issuer, investor)
    }

    #[test(aptos_framework = @0x1)]
    fun test_ecosystem_initialization(aptos_framework: &signer) {
        let (admin, _, _) = setup_test(aptos_framework);
        
        // Initialize ecosystem
        rwa_hub::initialize_rwa_ecosystem<AptosCoin>(&admin);
        
        // Verify registries exist
        assert!(exists<streaming_protocol::StreamRegistry<AptosCoin>>(@0xADMIN), 1);
        assert!(exists<asset_yield_protocol::AssetYieldRegistry<AptosCoin>>(@0xADMIN), 2);
        assert!(exists<compliance_guard::ComplianceRegistry>(@0xADMIN), 3);
    }

    #[test(aptos_framework = @0x1)]
    fun test_kyc_and_whitelist(aptos_framework: &signer) {
        let (admin, _, investor) = setup_test(aptos_framework);
        let investor_addr = signer::address_of(&investor);
        
        // Initialize
        compliance_guard::initialize(&admin);
        
        // Register KYC
        compliance_guard::register_identity(
            &admin,
            @0xADMIN,
            investor_addr,
            true,
            b"US",
            2,
            timestamp::now_seconds() + 31536000, // 1 year
        );
        
        // Whitelist for real estate
        compliance_guard::whitelist_address(
            &admin,
            @0xADMIN,
            investor_addr,
            vector[1], // Real Estate
        );
        
        // Verify authorization
        assert!(
            compliance_guard::is_authorized_recipient(@0xADMIN, investor_addr, 1),
            4
        );
        
        // Should not be authorized for securities
        assert!(
            !compliance_guard::is_authorized_recipient(@0xADMIN, investor_addr, 2),
            5
        );
    }

    #[test(aptos_framework = @0x1)]
    fun test_create_stream_with_real_money(aptos_framework: &signer) {
        let (admin, issuer, _) = setup_test(aptos_framework);
        let issuer_addr = signer::address_of(&issuer);
        
        // Initialize
        streaming_protocol::initialize<AptosCoin>(&admin);
        
        let initial_balance = coin::balance<AptosCoin>(issuer_addr);
        let stream_amount = 12_000_000_000; // 12,000 APT
        
        // Create stream
        let registry = streaming_protocol::borrow_registry_mut<AptosCoin>(@0xADMIN);
        let stream_id = streaming_protocol::create_stream<AptosCoin>(
            registry,
            &issuer,
            @0xINVESTOR,
            380, // flow rate
            timestamp::now_seconds(),
            31536000, // 1 year
            stream_amount,
        );
        
        // Verify money was withdrawn
        let new_balance = coin::balance<AptosCoin>(issuer_addr);
        assert!(new_balance == initial_balance - stream_amount, 6);
        
        // Verify escrow balance
        let escrow_balance = streaming_protocol::get_escrow_balance<AptosCoin>(
            @0xADMIN,
            stream_id,
        );
        assert!(escrow_balance == stream_amount, 7);
    }

    #[test(aptos_framework = @0x1)]
    fun test_lazy_evaluation_streaming(aptos_framework: &signer) {
        let (admin, issuer, investor) = setup_test(aptos_framework);
        
        // Initialize
        streaming_protocol::initialize<AptosCoin>(&admin);
        
        let stream_amount = 1_000_000_000; // 1,000 APT
        let duration = 1000; // 1000 seconds
        let flow_rate = stream_amount / duration; // 1 APT per second
        
        // Create stream
        let registry = streaming_protocol::borrow_registry_mut<AptosCoin>(@0xADMIN);
        let stream_id = streaming_protocol::create_stream<AptosCoin>(
            registry,
            &issuer,
            signer::address_of(&investor),
            flow_rate,
            timestamp::now_seconds(),
            duration,
            stream_amount,
        );
        
        // Initially, nothing is claimable
        let registry_ref = streaming_protocol::borrow_registry<AptosCoin>(@0xADMIN);
        let claimable = streaming_protocol::claimable_balance_of<AptosCoin>(
            registry_ref,
            stream_id,
        );
        assert!(claimable == 0, 8);
        
        // Fast forward 100 seconds
        timestamp::fast_forward_seconds(100);
        
        // Now 100 APT should be claimable
        let claimable = streaming_protocol::claimable_balance_of<AptosCoin>(
            registry_ref,
            stream_id,
        );
        assert!(claimable == 100 * flow_rate, 9);
        
        // Fast forward to end
        timestamp::fast_forward_seconds(900);
        
        // All should be claimable
        let claimable = streaming_protocol::claimable_balance_of<AptosCoin>(
            registry_ref,
            stream_id,
        );
        assert!(claimable == stream_amount, 10);
    }

    #[test(aptos_framework = @0x1)]
    fun test_withdrawal_transfers_real_money(aptos_framework: &signer) {
        let (admin, issuer, investor) = setup_test(aptos_framework);
        let investor_addr = signer::address_of(&investor);
        
        // Initialize
        streaming_protocol::initialize<AptosCoin>(&admin);
        
        let stream_amount = 1_000_000_000;
        let duration = 1000;
        let flow_rate = stream_amount / duration;
        
        // Create stream
        let registry = streaming_protocol::borrow_registry_mut<AptosCoin>(@0xADMIN);
        let stream_id = streaming_protocol::create_stream<AptosCoin>(
            registry,
            &issuer,
            investor_addr,
            flow_rate,
            timestamp::now_seconds(),
            duration,
            stream_amount,
        );
        
        let initial_balance = coin::balance<AptosCoin>(investor_addr);
        
        // Fast forward and withdraw
        timestamp::fast_forward_seconds(100);
        
        let withdrawn = streaming_protocol::withdraw<AptosCoin>(
            registry,
            stream_id,
            &investor,
        );
        
        // Verify real money was transferred
        let new_balance = coin::balance<AptosCoin>(investor_addr);
        assert!(new_balance == initial_balance + withdrawn, 11);
        assert!(withdrawn == 100 * flow_rate, 12);
    }

    #[test(aptos_framework = @0x1)]
    fun test_flash_advance_innovation(aptos_framework: &signer) {
        let (admin, issuer, investor) = setup_test(aptos_framework);
        let investor_addr = signer::address_of(&investor);
        
        // Initialize
        streaming_protocol::initialize<AptosCoin>(&admin);
        
        let stream_amount = 12_000_000_000; // 12,000 APT (1 year rent)
        let duration = 31536000; // 1 year
        let flow_rate = stream_amount / duration;
        
        // Create stream
        let registry = streaming_protocol::borrow_registry_mut<AptosCoin>(@0xADMIN);
        let stream_id = streaming_protocol::create_stream<AptosCoin>(
            registry,
            &issuer,
            investor_addr,
            flow_rate,
            timestamp::now_seconds(),
            duration,
            stream_amount,
        );
        
        let initial_balance = coin::balance<AptosCoin>(investor_addr);
        
        // Flash advance 3 months (3,000 APT)
        let advance_amount = 3_000_000_000;
        streaming_protocol::flash_advance<AptosCoin>(
            registry,
            stream_id,
            &investor,
            advance_amount,
        );
        
        // Verify instant transfer
        let new_balance = coin::balance<AptosCoin>(investor_addr);
        assert!(new_balance == initial_balance + advance_amount, 13);
        
        // Verify amount_withdrawn was updated
        let (_, _, _, _, _, _, amount_withdrawn, _) = streaming_protocol::get_stream_info<AptosCoin>(
            @0xADMIN,
            stream_id,
        );
        assert!(amount_withdrawn == advance_amount, 14);
        
        // Fast forward 1 month
        timestamp::fast_forward_seconds(2592000); // ~30 days
        
        // Should have minimal claimable (advance is being repaid)
        let registry_ref = streaming_protocol::borrow_registry<AptosCoin>(@0xADMIN);
        let claimable = streaming_protocol::claimable_balance_of<AptosCoin>(
            registry_ref,
            stream_id,
        );
        
        // Expected: (1 month streamed) - (3 months already taken) = negative or zero
        // The stream is "repaying" the advance
        assert!(claimable == 0, 15);
    }

    #[test(aptos_framework = @0x1)]
    fun test_complete_rwa_workflow(aptos_framework: &signer) {
        let (admin, issuer, investor) = setup_test(aptos_framework);
        let issuer_addr = signer::address_of(&issuer);
        let investor_addr = signer::address_of(&investor);
        
        // Initialize complete ecosystem
        rwa_hub::quick_setup_with_admin<AptosCoin>(
            &admin,
            b"US",
            2,
            timestamp::now_seconds() + 31536000,
        );
        
        // Setup issuer compliance
        compliance_guard::register_identity(
            &admin,
            @0xADMIN,
            issuer_addr,
            true,
            b"US",
            2,
            timestamp::now_seconds() + 31536000,
        );
        
        compliance_guard::whitelist_address(
            &admin,
            @0xADMIN,
            issuer_addr,
            vector[1], // Real Estate
        );
        
        // Create RWA stream (Note: In real scenario, token_obj_addr would be a real NFT)
        let mock_token_addr = @0xTOKEN;
        
        rwa_hub::create_real_estate_stream<AptosCoin>(
            &issuer,
            @0xADMIN,
            @0xADMIN,
            @0xADMIN,
            mock_token_addr,
            12_000_000_000,
            31536000,
        );
        
        // Verify stream was created
        let stream_id = asset_yield_protocol::get_asset_stream_id<AptosCoin>(
            @0xADMIN,
            mock_token_addr,
        );
        assert!(stream_id == 1, 16);
    }

    #[test(aptos_framework = @0x1)]
    fun test_compliance_freeze(aptos_framework: &signer) {
        let (admin, issuer, investor) = setup_test(aptos_framework);
        let investor_addr = signer::address_of(&investor);
        
        // Initialize
        streaming_protocol::initialize<AptosCoin>(&admin);
        compliance_guard::initialize(&admin);
        
        // Create stream
        let registry = streaming_protocol::borrow_registry_mut<AptosCoin>(@0xADMIN);
        let stream_id = streaming_protocol::create_stream<AptosCoin>(
            registry,
            &issuer,
            investor_addr,
            1000,
            timestamp::now_seconds(),
            1000,
            1_000_000,
        );
        
        // Freeze the stream
        rwa_hub::emergency_freeze<AptosCoin>(
            &admin,
            @0xADMIN,
            @0xADMIN,
            stream_id,
            b"Suspicious activity",
        );
        
        // Verify frozen
        assert!(compliance_guard::is_stream_frozen(@0xADMIN, stream_id), 17);
        
        // Unfreeze
        rwa_hub::emergency_unfreeze<AptosCoin>(
            &admin,
            @0xADMIN,
            @0xADMIN,
            stream_id,
        );
        
        // Verify unfrozen
        assert!(!compliance_guard::is_stream_frozen(@0xADMIN, stream_id), 18);
    }

    #[test(aptos_framework = @0x1)]
    #[expected_failure(abort_code = 0x10003, location = aptos_rwa::streaming_protocol)]
    fun test_unauthorized_withdrawal_fails(aptos_framework: &signer) {
        let (admin, issuer, investor) = setup_test(aptos_framework);
        let investor_addr = signer::address_of(&investor);
        
        // Initialize
        streaming_protocol::initialize<AptosCoin>(&admin);
        
        // Create stream
        let registry = streaming_protocol::borrow_registry_mut<AptosCoin>(@0xADMIN);
        let stream_id = streaming_protocol::create_stream<AptosCoin>(
            registry,
            &issuer,
            investor_addr,
            1000,
            timestamp::now_seconds(),
            1000,
            1_000_000,
        );
        
        timestamp::fast_forward_seconds(100);
        
        // Try to withdraw as issuer (should fail - only recipient can withdraw)
        streaming_protocol::withdraw<AptosCoin>(
            registry,
            stream_id,
            &issuer, // Wrong person!
        );
    }

    #[test(aptos_framework = @0x1)]
    #[expected_failure(abort_code = 0x10006, location = aptos_rwa::streaming_protocol)]
    fun test_flash_advance_over_limit_fails(aptos_framework: &signer) {
        let (admin, issuer, investor) = setup_test(aptos_framework);
        let investor_addr = signer::address_of(&investor);
        
        // Initialize
        streaming_protocol::initialize<AptosCoin>(&admin);
        
        // Create stream with 1000 APT
        let registry = streaming_protocol::borrow_registry_mut<AptosCoin>(@0xADMIN);
        let stream_id = streaming_protocol::create_stream<AptosCoin>(
            registry,
            &issuer,
            investor_addr,
            1000,
            timestamp::now_seconds(),
            1000,
            1_000_000,
        );
        
        // Try to advance 2000 APT (more than available)
        streaming_protocol::flash_advance<AptosCoin>(
            registry,
            stream_id,
            &investor,
            2_000_000, // Too much!
        );
    }

    #[test(aptos_framework = @0x1)]
    fun test_batch_whitelist(aptos_framework: &signer) {
        let (admin, _, _) = setup_test(aptos_framework);
        
        // Initialize
        compliance_guard::initialize(&admin);
        
        // Batch whitelist
        let users = vector[@0xUSER1, @0xUSER2, @0xUSER3];
        rwa_hub::batch_whitelist<AptosCoin>(
            &admin,
            @0xADMIN,
            users,
            vector[1, 2], // Real Estate and Securities
        );
        
        // Verify all are whitelisted
        assert!(compliance_guard::is_authorized_recipient(@0xADMIN, @0xUSER1, 1), 19);
        assert!(compliance_guard::is_authorized_recipient(@0xADMIN, @0xUSER2, 1), 20);
        assert!(compliance_guard::is_authorized_recipient(@0xADMIN, @0xUSER3, 1), 21);
    }
}