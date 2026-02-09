"""
Comprehensive User Flow Tests for Continuum Protocol
Tests all major user flows end-to-end to validate feature parity
"""

import smartpy as sp

# Import contract modules
from contracts import streaming_protocol
from contracts import asset_yield_protocol
from contracts import compliance_guard
from contracts import token_registry
from contracts import rwa_hub
from contracts import fa2_token


@sp.add_test(name="User Flow 1: Create Stream Flow")
def test_create_stream_flow():
    """
    Test the complete stream creation flow:
    1. User connects wallet
    2. User creates a stream
    3. Stream is locked in escrow
    4. Stream record is created
    """
    scenario = sp.test_scenario()
    scenario.h1("User Flow 1: Create Stream Flow")
    
    # Setup accounts
    admin = sp.test_account("Admin")
    sender = sp.test_account("Sender")
    recipient = sp.test_account("Recipient")
    
    # Deploy streaming protocol
    stream_contract = streaming_protocol.StreamingProtocol(admin.address)
    scenario += stream_contract
    
    # Deploy FA2 token for yield
    fa2 = fa2_token.FA2Token(
        admin=admin.address,
        asset_yield_protocol=admin.address  # Placeholder
    )
    scenario += fa2
    
    # Mint tokens to sender
    scenario += fa2.mint(
        to_=sender.address,
        metadata={"": sp.utils.bytes_of_string("ipfs://token0")}
    ).run(sender=admin)
    
    # Sender approves streaming protocol to transfer tokens
    scenario += fa2.update_operators([
        sp.variant("add_operator", sp.record(
            owner=sender.address,
            operator=stream_contract.address,
            token_id=0
        ))
    ]).run(sender=sender)
    
    # Create stream
    total_amount = 1000000  # 1M tokens
    duration = 86400  # 1 day in seconds
    flow_rate = total_amount // duration
    
    scenario += stream_contract.create_stream(
        recipient=recipient.address,
        token_address=fa2.address,
        token_id=0,
        flow_rate=flow_rate,
        duration=duration,
        total_amount=total_amount
    ).run(sender=sender)
    
    # Verify stream was created
    scenario.verify(stream_contract.data.next_stream_id == 1)
    scenario.verify(stream_contract.data.streams.contains(0))
    
    # Verify stream parameters
    stream = stream_contract.data.streams[0]
    scenario.verify(stream.sender == sender.address)
    scenario.verify(stream.recipient == recipient.address)
    scenario.verify(stream.total_amount == total_amount)
    scenario.verify(stream.flow_rate == flow_rate)
    scenario.verify(stream.status == 0)  # ACTIVE
    
    scenario.h2("✅ Create Stream Flow: PASSED")


@sp.add_test(name="User Flow 2: Claim Yield Flow")
def test_claim_yield_flow():
    """
    Test the complete yield claiming flow:
    1. Stream exists with claimable balance
    2. Recipient claims yield
    3. Tokens are transferred
    4. amount_withdrawn is updated
    """
    scenario = sp.test_scenario()
    scenario.h1("User Flow 2: Claim Yield Flow")
    
    # Setup accounts
    admin = sp.test_account("Admin")
    sender = sp.test_account("Sender")
    recipient = sp.test_account("Recipient")
    
    # Deploy contracts
    stream_contract = streaming_protocol.StreamingProtocol(admin.address)
    scenario += stream_contract
    
    fa2 = fa2_token.FA2Token(
        admin=admin.address,
        asset_yield_protocol=admin.address
    )
    scenario += fa2
    
    # Mint and approve
    scenario += fa2.mint(
        to_=sender.address,
        metadata={"": sp.utils.bytes_of_string("ipfs://token0")}
    ).run(sender=admin)
    
    scenario += fa2.update_operators([
        sp.variant("add_operator", sp.record(
            owner=sender.address,
            operator=stream_contract.address,
            token_id=0
        ))
    ]).run(sender=sender)
    
    # Create stream
    total_amount = 1000000
    duration = 86400
    flow_rate = total_amount // duration
    
    scenario += stream_contract.create_stream(
        recipient=recipient.address,
        token_address=fa2.address,
        token_id=0,
        flow_rate=flow_rate,
        duration=duration,
        total_amount=total_amount
    ).run(sender=sender)
    
    # Advance time by 12 hours (half the duration)
    scenario += sp.set_now(sp.timestamp(43200))
    
    # Recipient claims yield
    scenario += stream_contract.withdraw(stream_id=0).run(sender=recipient)
    
    # Verify amount_withdrawn is updated
    stream = stream_contract.data.streams[0]
    expected_withdrawn = flow_rate * 43200
    scenario.verify(stream.amount_withdrawn == expected_withdrawn)
    
    # Verify recipient received tokens
    scenario.verify(fa2.data.ledger[(recipient.address, 0)] == expected_withdrawn)
    
    scenario.h2("✅ Claim Yield Flow: PASSED")


@sp.add_test(name="User Flow 3: Flash Advance Flow")
def test_flash_advance_flow():
    """
    Test the complete flash advance flow:
    1. Stream exists
    2. Recipient requests flash advance
    3. Tokens are transferred immediately
    4. amount_withdrawn is incremented
    5. Future claims are reduced
    """
    scenario = sp.test_scenario()
    scenario.h1("User Flow 3: Flash Advance Flow")
    
    # Setup accounts
    admin = sp.test_account("Admin")
    sender = sp.test_account("Sender")
    recipient = sp.test_account("Recipient")
    
    # Deploy contracts
    stream_contract = streaming_protocol.StreamingProtocol(admin.address)
    scenario += stream_contract
    
    fa2 = fa2_token.FA2Token(
        admin=admin.address,
        asset_yield_protocol=admin.address
    )
    scenario += fa2
    
    # Mint and approve
    scenario += fa2.mint(
        to_=sender.address,
        metadata={"": sp.utils.bytes_of_string("ipfs://token0")}
    ).run(sender=admin)
    
    scenario += fa2.update_operators([
        sp.variant("add_operator", sp.record(
            owner=sender.address,
            operator=stream_contract.address,
            token_id=0
        ))
    ]).run(sender=sender)
    
    # Create stream
    total_amount = 1000000
    duration = 86400
    flow_rate = total_amount // duration
    
    scenario += stream_contract.create_stream(
        recipient=recipient.address,
        token_address=fa2.address,
        token_id=0,
        flow_rate=flow_rate,
        duration=duration,
        total_amount=total_amount
    ).run(sender=sender)
    
    # Advance time by 6 hours
    scenario += sp.set_now(sp.timestamp(21600))
    
    # Recipient requests flash advance for 50% of total
    flash_amount = 500000
    scenario += stream_contract.flash_advance(
        stream_id=0,
        amount_requested=flash_amount
    ).run(sender=recipient)
    
    # Verify amount_withdrawn is updated
    stream = stream_contract.data.streams[0]
    scenario.verify(stream.amount_withdrawn == flash_amount)
    
    # Verify recipient received tokens immediately
    scenario.verify(fa2.data.ledger[(recipient.address, 0)] == flash_amount)
    
    # Advance time by another 6 hours (12 hours total)
    scenario += sp.set_now(sp.timestamp(43200))
    
    # Calculate claimable balance (should be reduced by flash advance)
    # At 12 hours: flow_rate * 43200 - 500000 (already withdrawn)
    expected_claimable = (flow_rate * 43200) - flash_amount
    
    # Withdraw remaining claimable
    scenario += stream_contract.withdraw(stream_id=0).run(sender=recipient)
    
    # Verify total withdrawn
    stream = stream_contract.data.streams[0]
    scenario.verify(stream.amount_withdrawn == flow_rate * 43200)
    
    scenario.h2("✅ Flash Advance Flow: PASSED")


@sp.add_test(name="User Flow 4: NFT Transfer Flow")
def test_nft_transfer_flow():
    """
    Test the complete NFT transfer flow with yield update:
    1. NFT has linked yield stream
    2. NFT is transferred to new owner
    3. Yield stream recipient is automatically updated
    4. New owner can claim yield
    """
    scenario = sp.test_scenario()
    scenario.h1("User Flow 4: NFT Transfer Flow")
    
    # Setup accounts
    admin = sp.test_account("Admin")
    owner_a = sp.test_account("OwnerA")
    owner_b = sp.test_account("OwnerB")
    
    # Deploy all contracts
    stream_contract = streaming_protocol.StreamingProtocol(admin.address)
    scenario += stream_contract
    
    asset_yield = asset_yield_protocol.AssetYieldProtocol(
        streaming_protocol_address=stream_contract.address,
        admin=admin.address
    )
    scenario += asset_yield
    
    fa2_nft = fa2_token.FA2Token(
        admin=admin.address,
        asset_yield_protocol=asset_yield.address
    )
    scenario += fa2_nft
    
    fa2_yield = fa2_token.FA2Token(
        admin=admin.address,
        asset_yield_protocol=admin.address
    )
    scenario += fa2_yield
    
    # Mint NFT to owner_a
    scenario += fa2_nft.mint(
        to_=owner_a.address,
        metadata={"": sp.utils.bytes_of_string("ipfs://nft1")}
    ).run(sender=admin)
    
    # Mint yield tokens to admin for stream
    scenario += fa2_yield.mint(
        to_=admin.address,
        metadata={"": sp.utils.bytes_of_string("ipfs://yield")}
    ).run(sender=admin)
    
    # Admin approves streaming protocol
    scenario += fa2_yield.update_operators([
        sp.variant("add_operator", sp.record(
            owner=admin.address,
            operator=stream_contract.address,
            token_id=0
        ))
    ]).run(sender=admin)
    
    # Create asset yield stream
    total_yield = 1000000
    duration = 86400
    
    scenario += asset_yield.create_asset_yield_stream(
        token_address=fa2_nft.address,
        token_id=0,
        yield_token_address=fa2_yield.address,
        yield_token_id=0,
        total_yield=total_yield,
        duration=duration,
        sender=admin.address
    ).run(sender=owner_a)
    
    # Verify stream recipient is owner_a
    stream_id = asset_yield.data.asset_to_stream[(fa2_nft.address, 0)]
    stream = stream_contract.data.streams[stream_id]
    scenario.verify(stream.recipient == owner_a.address)
    
    # Transfer NFT from owner_a to owner_b
    scenario += fa2_nft.transfer([
        sp.record(
            from_=owner_a.address,
            txs=[sp.record(to_=owner_b.address, token_id=0, amount=1)]
        )
    ]).run(sender=owner_a)
    
    # Verify stream recipient is now owner_b
    stream = stream_contract.data.streams[stream_id]
    scenario.verify(stream.recipient == owner_b.address)
    
    # Advance time
    scenario += sp.set_now(sp.timestamp(43200))
    
    # owner_b can claim yield
    scenario += asset_yield.claim_yield_for_asset(
        token_address=fa2_nft.address,
        token_id=0
    ).run(sender=owner_b)
    
    # Verify owner_b received yield
    scenario.verify(fa2_yield.data.ledger.contains((owner_b.address, 0)))
    
    scenario.h2("✅ NFT Transfer Flow: PASSED")


@sp.add_test(name="User Flow 5: Rental Stream Flow")
def test_rental_stream_flow():
    """
    Test the complete rental stream flow:
    1. Landlord owns asset NFT
    2. Tenant creates rental stream
    3. Rental payments flow to landlord
    4. Access is granted while stream is active
    5. Access is revoked if NFT is transferred
    """
    scenario = sp.test_scenario()
    scenario.h1("User Flow 5: Rental Stream Flow")
    
    # Setup accounts
    admin = sp.test_account("Admin")
    landlord = sp.test_account("Landlord")
    tenant = sp.test_account("Tenant")
    new_owner = sp.test_account("NewOwner")
    
    # Deploy all contracts
    stream_contract = streaming_protocol.StreamingProtocol(admin.address)
    scenario += stream_contract
    
    asset_yield = asset_yield_protocol.AssetYieldProtocol(
        streaming_protocol_address=stream_contract.address,
        admin=admin.address
    )
    scenario += asset_yield
    
    compliance = compliance_guard.ComplianceGuard(admin.address)
    scenario += compliance
    
    registry = token_registry.TokenRegistry()
    scenario += registry
    
    hub = rwa_hub.RWAHub(
        streaming_protocol=stream_contract.address,
        asset_yield_protocol=asset_yield.address,
        compliance_guard=compliance.address,
        token_registry=registry.address,
        admin=admin.address
    )
    scenario += hub
    
    fa2_nft = fa2_token.FA2Token(
        admin=admin.address,
        asset_yield_protocol=asset_yield.address
    )
    scenario += fa2_nft
    
    fa2_payment = fa2_token.FA2Token(
        admin=admin.address,
        asset_yield_protocol=admin.address
    )
    scenario += fa2_payment
    
    # Mint NFT to landlord
    scenario += fa2_nft.mint(
        to_=landlord.address,
        metadata={"": sp.utils.bytes_of_string("ipfs://property1")}
    ).run(sender=admin)
    
    # Mint payment tokens to tenant
    scenario += fa2_payment.mint(
        to_=tenant.address,
        metadata={"": sp.utils.bytes_of_string("ipfs://usdt")}
    ).run(sender=admin)
    
    # Tenant approves streaming protocol
    scenario += fa2_payment.update_operators([
        sp.variant("add_operator", sp.record(
            owner=tenant.address,
            operator=stream_contract.address,
            token_id=0
        ))
    ]).run(sender=tenant)
    
    # Tenant creates rental stream
    rental_amount = 100000  # Monthly rent
    rental_duration = 2592000  # 30 days
    
    scenario += hub.stream_rent_to_asset(
        token_address=fa2_nft.address,
        token_id=0,
        payment_token_address=fa2_payment.address,
        payment_token_id=0,
        payment_amount=rental_amount,
        duration=rental_duration
    ).run(sender=tenant)
    
    # Verify rental stream is created
    rental_stream_id = hub.data.active_rentals[(fa2_nft.address, 0)]
    rental_stream = stream_contract.data.streams[rental_stream_id]
    scenario.verify(rental_stream.sender == tenant.address)
    scenario.verify(rental_stream.recipient == landlord.address)
    
    # Check access status (should be granted)
    access_granted = sp.view(
        "check_access_status",
        hub.address,
        sp.record(
            stream_id=rental_stream_id,
            token_address=fa2_nft.address,
            token_id=0
        ),
        t=sp.TBool
    ).open_some()
    scenario.verify(access_granted == True)
    
    # Landlord transfers NFT to new owner
    scenario += fa2_nft.transfer([
        sp.record(
            from_=landlord.address,
            txs=[sp.record(to_=new_owner.address, token_id=0, amount=1)]
        )
    ]).run(sender=landlord)
    
    # Check access status (should be revoked because recipient != current owner)
    access_granted_after = sp.view(
        "check_access_status",
        hub.address,
        sp.record(
            stream_id=rental_stream_id,
            token_address=fa2_nft.address,
            token_id=0
        ),
        t=sp.TBool
    ).open_some()
    scenario.verify(access_granted_after == False)
    
    scenario.h2("✅ Rental Stream Flow: PASSED")


@sp.add_test(name="User Flow 6: Admin Flows")
def test_admin_flows():
    """
    Test all admin flows:
    1. Register user identity (KYC)
    2. Whitelist user for asset types
    3. Mint RWA NFT with yield stream
    4. Emergency freeze stream
    5. Unfreeze stream
    6. Batch whitelist multiple users
    """
    scenario = sp.test_scenario()
    scenario.h1("User Flow 6: Admin Flows")
    
    # Setup accounts
    admin = sp.test_account("Admin")
    user1 = sp.test_account("User1")
    user2 = sp.test_account("User2")
    user3 = sp.test_account("User3")
    
    # Deploy all contracts
    stream_contract = streaming_protocol.StreamingProtocol(admin.address)
    scenario += stream_contract
    
    asset_yield = asset_yield_protocol.AssetYieldProtocol(
        streaming_protocol_address=stream_contract.address,
        admin=admin.address
    )
    scenario += asset_yield
    
    compliance = compliance_guard.ComplianceGuard(admin.address)
    scenario += compliance
    
    registry = token_registry.TokenRegistry()
    scenario += registry
    
    hub = rwa_hub.RWAHub(
        streaming_protocol=stream_contract.address,
        asset_yield_protocol=asset_yield.address,
        compliance_guard=compliance.address,
        token_registry=registry.address,
        admin=admin.address
    )
    scenario += hub
    
    fa2_nft = fa2_token.FA2Token(
        admin=admin.address,
        asset_yield_protocol=asset_yield.address
    )
    scenario += fa2_nft
    
    fa2_yield = fa2_token.FA2Token(
        admin=admin.address,
        asset_yield_protocol=admin.address
    )
    scenario += fa2_yield
    
    # Admin Flow 1: Register user identity (KYC)
    scenario.h2("Admin Flow 1: Register Identity")
    scenario += compliance.register_identity(
        user=user1.address,
        jurisdiction="US",
        verification_level=1,
        expiry_time=sp.timestamp(31536000)  # 1 year from now
    ).run(sender=admin)
    
    # Verify identity is registered
    scenario.verify(compliance.data.identities.contains(user1.address))
    identity = compliance.data.identities[user1.address]
    scenario.verify(identity.is_verified == True)
    scenario.verify(identity.jurisdiction == "US")
    
    # Admin Flow 2: Whitelist user for asset types
    scenario.h2("Admin Flow 2: Whitelist User")
    scenario += compliance.whitelist_address(
        user=user1.address,
        asset_types=[0, 1]  # Real estate and securities
    ).run(sender=admin)
    
    # Verify user is whitelisted
    identity = compliance.data.identities[user1.address]
    scenario.verify(identity.whitelisted_asset_types.contains(0))
    scenario.verify(identity.whitelisted_asset_types.contains(1))
    
    # Admin Flow 3: Mint RWA NFT with yield stream
    scenario.h2("Admin Flow 3: Mint RWA NFT")
    
    # Mint yield tokens to admin
    scenario += fa2_yield.mint(
        to_=admin.address,
        metadata={"": sp.utils.bytes_of_string("ipfs://yield")}
    ).run(sender=admin)
    
    # Admin approves streaming protocol
    scenario += fa2_yield.update_operators([
        sp.variant("add_operator", sp.record(
            owner=admin.address,
            operator=stream_contract.address,
            token_id=0
        ))
    ]).run(sender=admin)
    
    # Mint NFT to user1
    scenario += fa2_nft.mint(
        to_=user1.address,
        metadata={"": sp.utils.bytes_of_string("ipfs://property1")}
    ).run(sender=admin)
    
    # Create compliant RWA stream through hub
    scenario += hub.create_compliant_rwa_stream(
        token_address=fa2_nft.address,
        token_id=0,
        yield_token_address=fa2_yield.address,
        yield_token_id=0,
        total_yield=1000000,
        duration=86400,
        asset_type=0,  # Real estate
        metadata_uri="ipfs://property1",
        sender=admin.address
    ).run(sender=user1)
    
    # Verify stream is created and token is registered
    scenario.verify(asset_yield.data.asset_to_stream.contains((fa2_nft.address, 0)))
    scenario.verify(registry.data.tokens.contains(fa2_nft.address))
    
    # Admin Flow 4: Emergency freeze stream
    scenario.h2("Admin Flow 4: Emergency Freeze")
    stream_id = asset_yield.data.asset_to_stream[(fa2_nft.address, 0)]
    
    scenario += hub.emergency_freeze(
        stream_id=stream_id,
        reason="Suspicious activity detected"
    ).run(sender=admin)
    
    # Verify stream is frozen
    scenario.verify(compliance.data.frozen_streams.contains(stream_id))
    
    # Admin Flow 5: Unfreeze stream
    scenario.h2("Admin Flow 5: Unfreeze Stream")
    scenario += compliance.unfreeze_stream(stream_id=stream_id).run(sender=admin)
    
    # Verify stream is unfrozen
    scenario.verify(~compliance.data.frozen_streams.contains(stream_id))
    
    # Admin Flow 6: Batch whitelist multiple users
    scenario.h2("Admin Flow 6: Batch Whitelist")
    
    # Register identities for user2 and user3
    scenario += compliance.register_identity(
        user=user2.address,
        jurisdiction="UK",
        verification_level=1,
        expiry_time=sp.timestamp(31536000)
    ).run(sender=admin)
    
    scenario += compliance.register_identity(
        user=user3.address,
        jurisdiction="DE",
        verification_level=1,
        expiry_time=sp.timestamp(31536000)
    ).run(sender=admin)
    
    # Batch whitelist
    scenario += hub.batch_whitelist(
        users=[user2.address, user3.address],
        asset_types=[0, 1, 2]  # All asset types
    ).run(sender=admin)
    
    # Verify all users are whitelisted
    identity2 = compliance.data.identities[user2.address]
    identity3 = compliance.data.identities[user3.address]
    scenario.verify(identity2.whitelisted_asset_types.contains(0))
    scenario.verify(identity2.whitelisted_asset_types.contains(1))
    scenario.verify(identity2.whitelisted_asset_types.contains(2))
    scenario.verify(identity3.whitelisted_asset_types.contains(0))
    scenario.verify(identity3.whitelisted_asset_types.contains(1))
    scenario.verify(identity3.whitelisted_asset_types.contains(2))
    
    scenario.h2("✅ Admin Flows: PASSED")


# Run all tests
if __name__ == "__main__":
    sp.add_compilation_target("user_flows", sp.unit)
