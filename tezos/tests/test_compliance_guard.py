"""
Compliance Guard Contract Tests

Tests for the compliance guard contract including:
- Identity registration
- Address whitelisting
- Stream freezing/unfreezing
- Admin management
- Authorization checks

Requirements: 3.1-3.10
"""

import smartpy as sp
import sys
sys.path.insert(0, 'contracts')

from compliance_guard import main

@sp.add_test()
def test_compliance_guard_basic():
    """Test basic compliance guard functionality"""
    scenario = sp.test_scenario("Compliance Guard Basic Tests", main)
    scenario.h1("Compliance Guard Contract Tests")
    
    # Create test accounts
    admin = sp.test_account("Admin")
    user1 = sp.test_account("User1")
    user2 = sp.test_account("User2")
    
    # Instantiate the contract
    contract = main.ComplianceGuard(admin.address)
    scenario += contract
    
    scenario.h2("Test 1: Initial admin is set")
    scenario.verify(contract.data.admins.contains(admin.address))
    
    scenario.h2("Test 2: Register identity")
    expiry = sp.timestamp(1735689600)  # Future timestamp
    contract.register_identity(
        user=user1.address,
        jurisdiction="US",
        verification_level=1,
        expiry_time=expiry
    ).run(sender=admin)
    
    # Verify identity was registered
    scenario.verify(contract.data.identities.contains(user1.address))
    identity = scenario.compute(contract.data.identities[user1.address])
    scenario.verify(identity.is_verified == True)
    scenario.verify(identity.jurisdiction == "US")
    scenario.verify(identity.verification_level == 1)
    
    scenario.h2("Test 3: Whitelist address for asset types")
    asset_types = {0, 1}  # Real estate and vehicles
    contract.whitelist_address(
        user=user1.address,
        asset_types=asset_types
    ).run(sender=admin)
    
    # Verify whitelisting
    identity_after = scenario.compute(contract.data.identities[user1.address])
    scenario.verify(identity_after.whitelisted_asset_types.contains(0))
    scenario.verify(identity_after.whitelisted_asset_types.contains(1))
    
    scenario.h2("Test 4: Check authorization")
    # User1 should be authorized for asset type 0
    is_auth = scenario.compute(contract.is_authorized_recipient(
        sp.record(user=user1.address, asset_type=0)
    ))
    scenario.verify(is_auth == True)
    
    # User2 should not be authorized (not registered)
    is_auth2 = scenario.compute(contract.is_authorized_recipient(
        sp.record(user=user2.address, asset_type=0)
    ))
    scenario.verify(is_auth2 == False)
    
    scenario.h2("Test 5: Freeze stream")
    stream_id = 1
    contract.freeze_stream(
        stream_id=stream_id,
        reason="Suspicious activity"
    ).run(sender=admin)
    
    # Verify stream is frozen
    is_frozen = scenario.compute(contract.is_stream_frozen(stream_id))
    scenario.verify(is_frozen == True)
    
    scenario.h2("Test 6: Unfreeze stream")
    contract.unfreeze_stream(stream_id=stream_id).run(sender=admin)
    
    # Verify stream is unfrozen
    is_frozen_after = scenario.compute(contract.is_stream_frozen(stream_id))
    scenario.verify(is_frozen_after == False)
    
    scenario.h2("Test 7: Add new admin")
    contract.add_admin(new_admin=user2.address).run(sender=admin)
    
    # Verify new admin was added
    scenario.verify(contract.data.admins.contains(user2.address))
    
    scenario.h2("Test 8: Non-admin cannot register identity")
    contract.register_identity(
        user=user2.address,
        jurisdiction="UK",
        verification_level=0,
        expiry_time=expiry
    ).run(sender=user1, valid=False, exception="NOT_ADMIN")
    
    scenario.h2("Test 9: Check valid KYC")
    has_kyc = scenario.compute(contract.has_valid_kyc(user1.address))
    scenario.verify(has_kyc == True)
    
    scenario.h2("Test 10: Check is_admin view")
    is_admin_check = scenario.compute(contract.is_admin(admin.address))
    scenario.verify(is_admin_check == True)
    
    is_admin_check2 = scenario.compute(contract.is_admin(user1.address))
    scenario.verify(is_admin_check2 == False)

@sp.add_test()
def test_compliance_guard_edge_cases():
    """Test edge cases and error conditions"""
    scenario = sp.test_scenario("Compliance Guard Edge Cases", main)
    scenario.h1("Compliance Guard Edge Cases")
    
    # Create test accounts
    admin = sp.test_account("Admin")
    user1 = sp.test_account("User1")
    
    # Instantiate the contract
    contract = main.ComplianceGuard(admin.address)
    scenario += contract
    
    scenario.h2("Test 1: Cannot whitelist without KYC")
    asset_types = {0}
    contract.whitelist_address(
        user=user1.address,
        asset_types=asset_types
    ).run(sender=admin, valid=False, exception="IDENTITY_NOT_FOUND")
    
    scenario.h2("Test 2: Cannot unfreeze non-frozen stream")
    contract.unfreeze_stream(stream_id=999).run(
        sender=admin, 
        valid=False, 
        exception="STREAM_NOT_FROZEN"
    )
    
    scenario.h2("Test 3: Invalid verification level")
    expiry = sp.timestamp(1735689600)
    contract.register_identity(
        user=user1.address,
        jurisdiction="US",
        verification_level=5,  # Invalid level
        expiry_time=expiry
    ).run(sender=admin, valid=False, exception="INVALID_VERIFICATION_LEVEL")
    
    scenario.h2("Test 4: Non-admin cannot freeze stream")
    contract.freeze_stream(
        stream_id=1,
        reason="Test"
    ).run(sender=user1, valid=False, exception="NOT_ADMIN")
    
    scenario.h2("Test 5: Non-admin cannot add admin")
    contract.add_admin(new_admin=user1.address).run(
        sender=user1, 
        valid=False, 
        exception="NOT_ADMIN"
    )
