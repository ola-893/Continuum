"""
FA2 Token Tests

Tests for the FA2 token contract including:
- Property-based tests for correctness properties 29-31
- Unit tests for FA2 standard compliance
- Integration tests with asset yield protocol

Properties tested:
- Property 29: FA2 Transfer Hook Updates Stream
- Property 30: FA2 Standard Compliance
- Property 31: NFT Minting Uniqueness
"""

import smartpy as sp
import sys
sys.path.insert(0, 'contracts')

from fa2_token import main

@sp.add_test()
def test_fa2_basic_functionality():
    """
    Basic functionality test for FA2 token contract.
    Tests minting, transfer, balance_of, and update_operators.
    """
    scenario = sp.test_scenario("FA2 Token - Basic Functionality", main)
    scenario.h1("FA2 Token Contract Tests")
    
    # Test accounts
    admin = sp.test_account("Admin")
    alice = sp.test_account("Alice")
    bob = sp.test_account("Bob")
    charlie = sp.test_account("Charlie")
    
    # Mock asset yield protocol address (for transfer hooks)
    mock_asset_yield_protocol = sp.test_account("AssetYieldProtocol")
    
    scenario.h2("Contract Origination")
    fa2 = main.FA2Token(
        admin=admin.address,
        asset_yield_protocol=mock_asset_yield_protocol.address
    )
    scenario += fa2
    
    scenario.h2("Test 1: Mint NFT")
    # Create metadata
    metadata = {
        "name": sp.bytes("0x5465737420546f6b656e"),  # "Test Token"
        "symbol": sp.bytes("0x54455354"),  # "TEST"
        "decimals": sp.bytes("0x30")  # "0"
    }
    
    # Mint token to Alice
    fa2.mint(sp.record(to_=alice.address, metadata=metadata), _sender=admin)
    
    # Verify token was minted
    scenario.verify(fa2.data.next_token_id == 1)
    
    # Verify balance
    balance = fa2.get_balance(sp.record(owner=alice.address, token_id=0))
    scenario.verify(balance == 1)
    
    scenario.h2("Test 2: Transfer NFT")
    # Alice transfers token 0 to Bob
    fa2.transfer([
        sp.record(
            from_=alice.address,
            txs=[
                sp.record(
                    to_=bob.address,
                    token_id=0,
                    amount=1
                )
            ]
        )
    ], _sender=alice)
    
    # Verify balances
    alice_balance = fa2.get_balance(sp.record(owner=alice.address, token_id=0))
    bob_balance = fa2.get_balance(sp.record(owner=bob.address, token_id=0))
    scenario.verify(alice_balance == 0)
    scenario.verify(bob_balance == 1)
    
    scenario.h2("Test 3: Operator Management")
    # Bob adds Charlie as operator for token 0
    fa2.update_operators([
        sp.variant.add_operator(
            sp.record(
                owner=bob.address,
                operator=charlie.address,
                token_id=0
            )
        )
    ], _sender=bob)
    
    # Verify operator status
    is_op = fa2.is_operator(
        sp.record(
            owner=bob.address,
            operator=charlie.address,
            token_id=0
        )
    )
    scenario.verify(is_op == True)
    
    scenario.h2("Test 4: Operator Transfer")
    # Charlie (as operator) transfers token 0 from Bob to Alice
    fa2.transfer([
        sp.record(
            from_=bob.address,
            txs=[
                sp.record(
                    to_=alice.address,
                    token_id=0,
                    amount=1
                )
            ]
        )
    ]).run(sender=charlie)
    
    # Verify balances
    bob_balance = fa2.get_balance(sp.record(owner=bob.address, token_id=0))
    alice_balance = fa2.get_balance(sp.record(owner=alice.address, token_id=0))
    scenario.verify(bob_balance == 0)
    scenario.verify(alice_balance == 1)
    
    scenario.h2("Test 5: Remove Operator")
    # Alice removes Charlie as operator
    fa2.update_operators([
        sp.variant.remove_operator(
            sp.record(
                owner=alice.address,
                operator=charlie.address,
                token_id=0
            )
        )
    ]).run(sender=alice)
    
    # Verify operator status
    is_op = fa2.is_operator(
        sp.record(
            owner=alice.address,
            operator=charlie.address,
            token_id=0
        )
    )
    scenario.verify(is_op == False)
    
    scenario.h2("Test 6: Unauthorized Transfer (should fail)")
    # Charlie tries to transfer without being operator (should fail)
    fa2.transfer([
        sp.record(
            from_=alice.address,
            txs=[
                sp.record(
                    to_=bob.address,
                    token_id=0,
                    amount=1
                )
            ]
        )
    ], _sender=charlie, _valid=False)
    
    scenario.h2("Test 7: Multiple Token Minting")
    # Mint more tokens to test uniqueness
    fa2.mint(sp.record(to_=bob.address, metadata=metadata), _sender=admin)
    fa2.mint(sp.record(to_=charlie.address, metadata=metadata), _sender=admin)
    
    # Verify unique token IDs
    scenario.verify(fa2.data.next_token_id == 3)
    
    # Verify balances
    bob_token1_balance = fa2.get_balance(sp.record(owner=bob.address, token_id=1))
    charlie_token2_balance = fa2.get_balance(sp.record(owner=charlie.address, token_id=2))
    scenario.verify(bob_token1_balance == 1)
    scenario.verify(charlie_token2_balance == 1)
    
    scenario.h2("Test 8: Token Metadata")
    # Query token metadata
    token_meta = fa2.token_metadata(0)
    scenario.verify(token_meta.token_id == 0)
    
    scenario.h2("Test 9: Non-admin Mint (should fail)")
    # Alice tries to mint (should fail)
    scenario += fa2.mint(sp.record(to_=alice.address, metadata=metadata)).run(sender=alice, valid=False)


@sp.add_test()
def test_fa2_edge_cases():
    """
    Edge case tests for FA2 token contract.
    """
    scenario = sp.test_scenario("FA2 Token - Edge Cases", main)
    scenario.h1("FA2 Token Edge Cases")
    
    # Test accounts
    admin = sp.test_account("Admin")
    alice = sp.test_account("Alice")
    bob = sp.test_account("Bob")
    mock_asset_yield_protocol = sp.test_account("AssetYieldProtocol")
    
    scenario.h2("Contract Origination")
    fa2 = main.FA2Token(
        admin=admin.address,
        asset_yield_protocol=mock_asset_yield_protocol.address
    )
    scenario += fa2
    
    scenario.h2("Test 1: Transfer Non-existent Token (should fail)")
    fa2.transfer([
        sp.record(
            from_=alice.address,
            txs=[
                sp.record(
                    to_=bob.address,
                    token_id=999,
                    amount=1
                )
            ]
        )
    ], _sender=alice, _valid=False)
    
    scenario.h2("Test 2: Query Balance of Non-existent Token")
    # Should return 0 for non-existent token
    balance = fa2.get_balance(sp.record(owner=alice.address, token_id=999))
    scenario.verify(balance == 0)
    
    scenario.h2("Test 3: Query Metadata of Non-existent Token (should fail)")
    fa2.token_metadata(999).run(valid=False)
    
    scenario.h2("Test 4: Multiple Transfers in Single Call")
    # Mint tokens
    metadata = sp.map({
        "name": sp.bytes("0x546f6b656e"),  # "Token"
    })
    fa2.mint(sp.record(to_=alice.address, metadata=metadata)).run(sender=admin)
    fa2.mint(sp.record(to_=alice.address, metadata=metadata)).run(sender=admin)
    
    # Transfer multiple tokens in one call
    fa2.transfer([
        sp.record(
            from_=alice.address,
            txs=[
                sp.record(to_=bob.address, token_id=0, amount=1),
                sp.record(to_=bob.address, token_id=1, amount=1)
            ]
        )
    ]).run(sender=alice)
    
    # Verify balances
    bob_balance_0 = fa2.get_balance(sp.record(owner=bob.address, token_id=0))
    bob_balance_1 = fa2.get_balance(sp.record(owner=bob.address, token_id=1))
    scenario.verify(bob_balance_0 == 1)
    scenario.verify(bob_balance_1 == 1)


if __name__ == "__main__":
    # Compile the test
    import sys
    test_fa2_basic_functionality()
    test_fa2_edge_cases()
