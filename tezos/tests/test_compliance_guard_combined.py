"""
Compliance Guard Contract Tests

Combined contract and test file for SmartPy CLI execution.
"""

import smartpy as sp

@sp.module
def main():
    # Define identity record type
    identity_record_type: type = sp.record(
        is_verified=sp.bool,
        jurisdiction=sp.string,
        verification_level=sp.nat,
        expiry_time=sp.timestamp,
        whitelisted_asset_types=sp.set[sp.nat]
    )
    
    class ComplianceGuard(sp.Contract):
        """Compliance Guard Contract"""
        
        def __init__(self, initial_admin):
            self.data.identities = sp.cast(
                sp.big_map(), 
                sp.big_map[sp.address, identity_record_type]
            )
            
            self.data.frozen_streams = sp.cast(
                sp.big_map(), 
                sp.big_map[sp.nat, sp.bool]
            )
            
            self.data.admins = {initial_admin}
            
            self.data.asset_types = {
                0: "real_estate",
                1: "vehicles", 
                2: "commodities"
            }

        @sp.entrypoint
        def register_identity(self, user, jurisdiction, verification_level, expiry_time):
            assert self.data.admins.contains(sp.sender), "NOT_ADMIN"
            assert verification_level <= 2, "INVALID_VERIFICATION_LEVEL"
            
            self.data.identities[user] = sp.record(
                is_verified=True,
                jurisdiction=jurisdiction,
                verification_level=verification_level,
                expiry_time=expiry_time,
                whitelisted_asset_types=set()
            )
            
            sp.emit(
                sp.record(
                    user=user,
                    jurisdiction=jurisdiction,
                    verification_level=verification_level,
                    expiry_time=expiry_time,
                    registered_by=sp.sender,
                    timestamp=sp.now
                ),
                tag="identity_registered"
            )

        @sp.entrypoint
        def whitelist_address(self, user, asset_types):
            assert self.data.admins.contains(sp.sender), "NOT_ADMIN"
            assert self.data.identities.contains(user), "IDENTITY_NOT_FOUND"
            
            identity = self.data.identities[user]
            assert identity.is_verified, "KYC_NOT_VERIFIED"
            assert sp.now < identity.expiry_time, "KYC_EXPIRED"
            
            updated_types = identity.whitelisted_asset_types
            for asset_type in asset_types.elements():
                assert asset_type <= 2, "INVALID_ASSET_TYPE"
                updated_types.add(asset_type)
            
            self.data.identities[user].whitelisted_asset_types = updated_types
            
            sp.emit(
                sp.record(
                    user=user,
                    asset_types=asset_types,
                    whitelisted_by=sp.sender,
                    timestamp=sp.now
                ),
                tag="address_whitelisted"
            )

        @sp.entrypoint
        def freeze_stream(self, stream_id, reason):
            assert self.data.admins.contains(sp.sender), "NOT_ADMIN"
            self.data.frozen_streams[stream_id] = True
            
            sp.emit(
                sp.record(
                    stream_id=stream_id,
                    reason=reason,
                    frozen_by=sp.sender,
                    timestamp=sp.now
                ),
                tag="stream_frozen"
            )

        @sp.entrypoint
        def unfreeze_stream(self, stream_id):
            assert self.data.admins.contains(sp.sender), "NOT_ADMIN"
            assert self.data.frozen_streams.contains(stream_id), "STREAM_NOT_FROZEN"
            
            del self.data.frozen_streams[stream_id]
            
            sp.emit(
                sp.record(
                    stream_id=stream_id,
                    unfrozen_by=sp.sender,
                    timestamp=sp.now
                ),
                tag="stream_unfrozen"
            )

        @sp.entrypoint
        def add_admin(self, new_admin):
            assert self.data.admins.contains(sp.sender), "NOT_ADMIN"
            self.data.admins.add(new_admin)
            
            sp.emit(
                sp.record(
                    new_admin=new_admin,
                    added_by=sp.sender,
                    timestamp=sp.now
                ),
                tag="admin_added"
            )

        @sp.onchain_view()
        def is_authorized_recipient(self, params):
            sp.cast(params, sp.record(user=sp.address, asset_type=sp.nat))
            
            user = params.user
            asset_type = params.asset_type
            
            authorized = False
            if self.data.identities.contains(user):
                identity = self.data.identities[user]
                is_verified = identity.is_verified
                not_expired = sp.now < identity.expiry_time
                is_whitelisted = identity.whitelisted_asset_types.contains(asset_type)
                authorized = is_verified and not_expired and is_whitelisted
            
            return authorized
        
        @sp.onchain_view()
        def is_stream_frozen(self, stream_id):
            frozen = False
            if self.data.frozen_streams.contains(stream_id):
                frozen = self.data.frozen_streams[stream_id]
            return frozen
        
        @sp.onchain_view()
        def has_valid_kyc(self, user):
            valid = False
            if self.data.identities.contains(user):
                identity = self.data.identities[user]
                valid = identity.is_verified and (sp.now < identity.expiry_time)
            return valid
        
        @sp.onchain_view()
        def is_admin(self, user):
            return self.data.admins.contains(user)

@sp.add_test()
def test_compliance_guard_basic():
    """Test basic compliance guard functionality"""
    scenario = sp.test_scenario("Compliance Guard Basic Tests", main)
    scenario.h1("Compliance Guard Contract Tests")
    
    admin = sp.test_account("Admin")
    user1 = sp.test_account("User1")
    user2 = sp.test_account("User2")
    
    contract = main.ComplianceGuard(admin.address)
    scenario += contract
    
    scenario.h2("Test 1: Initial admin is set")
    scenario.verify(contract.data.admins.contains(admin.address))
    
    scenario.h2("Test 2: Register identity")
    expiry = sp.timestamp(1735689600)
    contract.register_identity(
        user=user1.address,
        jurisdiction="US",
        verification_level=1,
        expiry_time=expiry,
        _sender=admin
    )
    
    scenario.verify(contract.data.identities.contains(user1.address))
    identity = scenario.compute(contract.data.identities[user1.address])
    scenario.verify(identity.is_verified == True)
    scenario.verify(identity.jurisdiction == "US")
    scenario.verify(identity.verification_level == 1)
    
    scenario.h2("Test 3: Whitelist address for asset types")
    asset_types = {0, 1}
    contract.whitelist_address(
        user=user1.address,
        asset_types=asset_types,
        _sender=admin
    )
    
    identity_after = scenario.compute(contract.data.identities[user1.address])
    scenario.verify(identity_after.whitelisted_asset_types.contains(0))
    scenario.verify(identity_after.whitelisted_asset_types.contains(1))
    
    scenario.h2("Test 4: Check authorization")
    is_auth = scenario.compute(contract.is_authorized_recipient(
        sp.record(user=user1.address, asset_type=0)
    ))
    scenario.verify(is_auth == True)
    
    is_auth2 = scenario.compute(contract.is_authorized_recipient(
        sp.record(user=user2.address, asset_type=0)
    ))
    scenario.verify(is_auth2 == False)
    
    scenario.h2("Test 5: Freeze stream")
    stream_id = 1
    contract.freeze_stream(
        stream_id=stream_id,
        reason="Suspicious activity",
        _sender=admin
    )
    
    is_frozen = scenario.compute(contract.is_stream_frozen(stream_id))
    scenario.verify(is_frozen == True)
    
    scenario.h2("Test 6: Unfreeze stream")
    contract.unfreeze_stream(stream_id=stream_id, _sender=admin)
    
    is_frozen_after = scenario.compute(contract.is_stream_frozen(stream_id))
    scenario.verify(is_frozen_after == False)
    
    scenario.h2("Test 7: Add new admin")
    contract.add_admin(new_admin=user2.address, _sender=admin)
    scenario.verify(contract.data.admins.contains(user2.address))
    
    scenario.h2("Test 8: Non-admin cannot register identity")
    contract.register_identity(
        user=user2.address,
        jurisdiction="UK",
        verification_level=0,
        expiry_time=expiry,
        _sender=user1,
        _valid=False
    )
    
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
    
    admin = sp.test_account("Admin")
    user1 = sp.test_account("User1")
    
    contract = main.ComplianceGuard(admin.address)
    scenario += contract
    
    scenario.h2("Test 1: Cannot whitelist without KYC")
    asset_types = {0}
    contract.whitelist_address(
        user=user1.address,
        asset_types=asset_types,
        _sender=admin,
        _valid=False
    )
    
    scenario.h2("Test 2: Cannot unfreeze non-frozen stream")
    contract.unfreeze_stream(stream_id=999, _sender=admin, _valid=False)
    
    scenario.h2("Test 3: Invalid verification level")
    expiry = sp.timestamp(1735689600)
    contract.register_identity(
        user=user1.address,
        jurisdiction="US",
        verification_level=5,
        expiry_time=expiry,
        _sender=admin,
        _valid=False
    )
    
    scenario.h2("Test 4: Non-admin cannot freeze stream")
    contract.freeze_stream(
        stream_id=1,
        reason="Test",
        _sender=user1,
        _valid=False
    )
    
    scenario.h2("Test 5: Non-admin cannot add admin")
    contract.add_admin(new_admin=user1.address, _sender=user1, _valid=False)
