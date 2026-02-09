"""
Compliance Guard Test - Legacy SmartPy Syntax
"""
import smartpy as sp

# Define identity record type
identity_record_type = sp.TRecord(
    is_verified=sp.TBool,
    jurisdiction=sp.TString,
    verification_level=sp.TNat,
    expiry_time=sp.TTimestamp,
    whitelisted_asset_types=sp.TSet(sp.TNat)
)

class ComplianceGuard(sp.Contract):
    """Compliance Guard Contract"""
    
    def __init__(self, initial_admin):
        self.init(
            identities=sp.big_map(tkey=sp.TAddress, tvalue=identity_record_type),
            frozen_streams=sp.big_map(tkey=sp.TNat, tvalue=sp.TBool),
            admins=sp.set([initial_admin]),
            asset_types=sp.map({
                0: "real_estate",
                1: "vehicles", 
                2: "commodities"
            })
        )

    @sp.entry_point
    def register_identity(self, params):
        sp.set_type(params, sp.TRecord(
            user=sp.TAddress,
            jurisdiction=sp.TString,
            verification_level=sp.TNat,
            expiry_time=sp.TTimestamp
        ))
        
        sp.verify(self.data.admins.contains(sp.sender), "NOT_ADMIN")
        sp.verify(params.verification_level <= 2, "INVALID_VERIFICATION_LEVEL")
        
        self.data.identities[params.user] = sp.record(
            is_verified=True,
            jurisdiction=params.jurisdiction,
            verification_level=params.verification_level,
            expiry_time=params.expiry_time,
            whitelisted_asset_types=sp.set([])
        )

    @sp.entry_point
    def whitelist_address(self, params):
        sp.set_type(params, sp.TRecord(
            user=sp.TAddress,
            asset_types=sp.TSet(sp.TNat)
        ))
        
        sp.verify(self.data.admins.contains(sp.sender), "NOT_ADMIN")
        sp.verify(self.data.identities.contains(params.user), "IDENTITY_NOT_FOUND")
        
        identity = self.data.identities[params.user]
        sp.verify(identity.is_verified, "KYC_NOT_VERIFIED")
        sp.verify(sp.now < identity.expiry_time, "KYC_EXPIRED")
        
        # Update whitelisted asset types
        sp.for asset_type in params.asset_types.elements():
            sp.verify(asset_type <= 2, "INVALID_ASSET_TYPE")
            self.data.identities[params.user].whitelisted_asset_types.add(asset_type)

    @sp.entry_point
    def freeze_stream(self, params):
        sp.set_type(params, sp.TRecord(
            stream_id=sp.TNat,
            reason=sp.TString
        ))
        
        sp.verify(self.data.admins.contains(sp.sender), "NOT_ADMIN")
        self.data.frozen_streams[params.stream_id] = True

    @sp.entry_point
    def unfreeze_stream(self, stream_id):
        sp.set_type(stream_id, sp.TNat)
        
        sp.verify(self.data.admins.contains(sp.sender), "NOT_ADMIN")
        sp.verify(self.data.frozen_streams.contains(stream_id), "STREAM_NOT_FROZEN")
        
        del self.data.frozen_streams[stream_id]

    @sp.entry_point
    def add_admin(self, new_admin):
        sp.set_type(new_admin, sp.TAddress)
        
        sp.verify(self.data.admins.contains(sp.sender), "NOT_ADMIN")
        self.data.admins.add(new_admin)

@sp.add_test(name="Compliance Guard Basic Tests")
def test_compliance_guard():
    scenario = sp.test_scenario()
    scenario.h1("Compliance Guard Contract Tests")
    
    admin = sp.test_account("Admin")
    user1 = sp.test_account("User1")
    user2 = sp.test_account("User2")
    
    contract = ComplianceGuard(admin.address)
    scenario += contract
    
    scenario.h2("Test 1: Initial admin is set")
    scenario.verify(contract.data.admins.contains(admin.address))
    
    scenario.h2("Test 2: Register identity")
    expiry = sp.timestamp(1735689600)
    contract.register_identity(
        user=user1.address,
        jurisdiction="US",
        verification_level=1,
        expiry_time=expiry
    ).run(sender=admin)
    
    scenario.verify(contract.data.identities.contains(user1.address))
    
    scenario.h2("Test 3: Whitelist address")
    contract.whitelist_address(
        user=user1.address,
        asset_types=sp.set([0, 1])
    ).run(sender=admin)
    
    scenario.h2("Test 4: Freeze stream")
    contract.freeze_stream(
        stream_id=1,
        reason="Test"
    ).run(sender=admin)
    
    scenario.verify(contract.data.frozen_streams.contains(1))
    
    scenario.h2("Test 5: Unfreeze stream")
    contract.unfreeze_stream(1).run(sender=admin)
    
    scenario.verify(~contract.data.frozen_streams.contains(1))
    
    scenario.h2("Test 6: Add admin")
    contract.add_admin(user2.address).run(sender=admin)
    scenario.verify(contract.data.admins.contains(user2.address))
    
    scenario.h2("Test 7: Non-admin cannot register")
    contract.register_identity(
        user=user2.address,
        jurisdiction="UK",
        verification_level=0,
        expiry_time=expiry
    ).run(sender=user1, valid=False)
