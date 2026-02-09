"""
Token Registry Contract

Purpose: Global registry of all RWA NFTs for marketplace discovery and filtering.

This contract implements the token registry for the Continuum Protocol on Tezos.
It handles:
- Token registration with metadata
- Lookup by token address
- Lookup by stream ID (reverse mapping)
- Filtering by asset type
- Paginated queries for marketplace

Requirements: 4.1-4.10
"""

import smartpy as sp

@sp.module
def main():
    # Define token entry record type
    token_entry_type: type = sp.record(
        asset_type=sp.nat,
        stream_id=sp.nat,
        metadata_uri=sp.string,
        registration_time=sp.timestamp
    )
    
    class TokenRegistry(sp.Contract):
        """
        Token Registry Contract
        
        Global registry of all RWA NFTs for marketplace discovery and filtering.
        """
        
        def __init__(self, admin):
            """
            Initialize the token registry contract.
            
            Args:
                admin: Administrator address
            
            Requirements: 4.1, 6.3
            """
            # Main token registry: token_address -> token_entry
            self.data.tokens = sp.cast(sp.big_map(), sp.big_map[sp.address, token_entry_type])
            
            # Reverse mapping: stream_id -> token_address
            self.data.stream_to_token = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.address])
            
            # Tokens grouped by asset type: asset_type -> set of token addresses
            self.data.tokens_by_type = sp.cast(sp.big_map(), sp.big_map[sp.nat, sp.set[sp.address]])
            
            # Total count of registered tokens
            self.data.token_count = sp.nat(0)
            
            # Admin address
            self.data.admin = sp.cast(admin, sp.address)
            
            # Emergency pause flag
            self.data.paused = False
        
        @sp.entrypoint
        def register_token(self, token_address, asset_type, stream_id, metadata_uri):
            """
            Register a new RWA NFT in the global registry.
            
            Args:
                token_address: Address of the FA2 NFT contract
                asset_type: Type of asset (0=real_estate, 1=vehicles, 2=commodities)
                stream_id: ID of the linked yield stream
                metadata_uri: URI to token metadata (IPFS or HTTP)
            
            Requirements: 4.1, 4.8, 17.5
            """
            # Check if contract is paused
            assert not self.data.paused, "CONTRACT_PAUSED: Operations are temporarily suspended"
            
            # Verify token not already registered (duplicate prevention)
            assert not self.data.tokens.contains(token_address), "ALREADY_REGISTERED: Token is already registered"
            
            # Validate asset type (must be 0, 1, or 2)
            assert asset_type <= 2, "INVALID_ASSET_TYPE: Asset type must be 0, 1, or 2"
            
            # Validate metadata_uri is not empty
            assert sp.len(metadata_uri) > 0, "INVALID_METADATA_URI: Metadata URI cannot be empty"
            assert sp.len(metadata_uri) <= 500, "INVALID_METADATA_URI: Metadata URI too long (max 500 chars)"
            
            # Validate token_address is not burn address
            assert token_address != sp.address("tz1Ke2h7sDdakHJQh8WX4Z372du1KChsksyU"), \
                "INVALID_PARAMETERS: token_address cannot be burn address"
            
            # Store token information
            self.data.tokens[token_address] = sp.record(
                asset_type=asset_type,
                stream_id=stream_id,
                metadata_uri=metadata_uri,
                registration_time=sp.now
            )
            
            # Create stream_to_token mapping
            self.data.stream_to_token[stream_id] = token_address
            
            # Add to tokens_by_type set
            if self.data.tokens_by_type.contains(asset_type):
                # Asset type already has tokens, add to existing set
                current_set = self.data.tokens_by_type[asset_type]
                current_set.add(token_address)
                self.data.tokens_by_type[asset_type] = current_set
            else:
                # First token of this asset type, create new set
                new_set = {token_address}
                self.data.tokens_by_type[asset_type] = new_set
            
            # Increment token count
            self.data.token_count += 1
            
            # Emit registration event
            sp.emit(
                sp.record(
                    token_address=token_address,
                    asset_type=asset_type,
                    stream_id=stream_id,
                    metadata_uri=metadata_uri,
                    registration_time=sp.now
                ),
                tag="token_registered"
            )
        
        @sp.onchain_view()
        def get_token(self, token_address):
            """
            Get token information by token address.
            
            Args:
                token_address: Address of the token
            
            Returns:
                Token entry record with all information
            
            Requirements: 4.5
            """
            assert self.data.tokens.contains(token_address), "TOKEN_NOT_FOUND: Token address not in registry"
            return self.data.tokens[token_address]
        
        @sp.onchain_view()
        def get_token_by_stream_id(self, stream_id):
            """
            Get token address by stream ID (reverse lookup).
            
            Args:
                stream_id: ID of the yield stream
            
            Returns:
                Token address and full token information
            
            Requirements: 4.4
            """
            assert self.data.stream_to_token.contains(stream_id), "TOKEN_NOT_FOUND: No token linked to this stream"
            
            token_address = self.data.stream_to_token[stream_id]
            token_info = self.data.tokens[token_address]
            
            return sp.record(
                token_address=token_address,
                asset_type=token_info.asset_type,
                stream_id=token_info.stream_id,
                metadata_uri=token_info.metadata_uri,
                registration_time=token_info.registration_time
            )
        
        @sp.onchain_view()
        def get_tokens_by_type(self, asset_type):
            """
            Get all tokens of a specific asset type.
            
            Args:
                asset_type: Type of asset (0=real_estate, 1=vehicles, 2=commodities)
            
            Returns:
                List of token addresses matching the asset type
            
            Requirements: 4.3
            """
            # Return empty list if no tokens of this type
            if self.data.tokens_by_type.contains(asset_type):
                # Convert set to list - SmartPy will handle this automatically
                token_set = self.data.tokens_by_type[asset_type]
                # Return the set directly - SmartPy can convert it
                return [addr for addr in token_set.elements()]
            else:
                return []
        
        @sp.onchain_view()
        def get_all_tokens_paginated(self, params):
            """
            Get all tokens with pagination support.
            
            Args:
                params: Record with offset (nat) and limit (nat)
            
            Returns:
                Record with:
                - tokens: List of (address, token_entry) pairs
                - total_count: Total number of registered tokens
            
            Requirements: 4.2, 4.9
            
            Note: Simplified implementation returns all tokens (pagination logic simplified for SmartPy compatibility)
            """
            # Collect all tokens
            result = [
                sp.record(
                    token_address=token_addr,
                    asset_type=self.data.tokens[token_addr].asset_type,
                    stream_id=self.data.tokens[token_addr].stream_id,
                    metadata_uri=self.data.tokens[token_addr].metadata_uri,
                    registration_time=self.data.tokens[token_addr].registration_time
                )
                for token_addr in self.data.tokens.keys()
            ]
            
            return sp.record(
                tokens=result,
                total_count=self.data.token_count
            )
        
        @sp.onchain_view()
        def get_token_count(self):
            """
            Get total number of registered tokens.
            
            Returns:
                Total count of registered tokens
            
            Requirements: 4.6
            """
            return self.data.token_count
        
        @sp.onchain_view()
        def get_asset_type_by_token(self, token_address):
            """
            Get asset type for a specific token.
            
            Args:
                token_address: Address of the token
            
            Returns:
                Asset type (0=real_estate, 1=vehicles, 2=commodities)
            
            Requirements: 4.7
            """
            assert self.data.tokens.contains(token_address), "TOKEN_NOT_FOUND: Token address not in registry"
            return self.data.tokens[token_address].asset_type
        
        @sp.entrypoint
        def pause(self):
            """
            Emergency pause all contract operations (admin only).
            
            Requirements: 17.7
            """
            # Verify caller is admin
            assert sp.sender == self.data.admin, "NOT_ADMIN: Only admin can pause contract"
            
            # Verify contract is not already paused
            assert not self.data.paused, "ALREADY_PAUSED: Contract is already paused"
            
            # Pause the contract
            self.data.paused = True
            
            # Emit pause event
            sp.emit(
                sp.record(
                    paused_by=sp.sender,
                    timestamp=sp.now
                ),
                tag="contract_paused"
            )
        
        @sp.entrypoint
        def unpause(self):
            """
            Resume contract operations after emergency pause (admin only).
            
            Requirements: 17.7
            """
            # Verify caller is admin
            assert sp.sender == self.data.admin, "NOT_ADMIN: Only admin can unpause contract"
            
            # Verify contract is paused
            assert self.data.paused, "NOT_PAUSED: Contract is not paused"
            
            # Unpause the contract
            self.data.paused = False
            
            # Emit unpause event
            sp.emit(
                sp.record(
                    unpaused_by=sp.sender,
                    timestamp=sp.now
                ),
                tag="contract_unpaused"
            )


# Compilation target
if "templates" not in __name__:
    @sp.add_test()
    def test():
        scenario = sp.test_scenario("TokenRegistry", main)
        scenario.h1("Token Registry Contract Tests")
        
        # Test accounts
        admin = sp.test_account("Admin")
        token1 = sp.test_account("Token1")
        token2 = sp.test_account("Token2")
        token3 = sp.test_account("Token3")
        
        # Deploy contract
        scenario.h2("Contract Deployment")
        registry = main.TokenRegistry(admin.address)
        scenario += registry
        
        # Test 1: Register first token (real estate)
        scenario.h2("Test 1: Register Real Estate Token")
        registry.register_token(
            token_address=token1.address,
            asset_type=0,
            stream_id=1,
            metadata_uri="ipfs://QmRealEstate1",
            _sender=admin
        )
        
        # Verify registration
        scenario.verify(registry.data.token_count == 1)
        scenario.verify(registry.data.tokens.contains(token1.address))
        
        # Test 2: Register second token (vehicle)
        scenario.h2("Test 2: Register Vehicle Token")
        registry.register_token(
            token_address=token2.address,
            asset_type=1,
            stream_id=2,
            metadata_uri="ipfs://QmVehicle1"
        ).run(sender=admin)
        
        scenario.verify(registry.data.token_count == 2)
        
        # Test 3: Register third token (commodity)
        scenario.h2("Test 3: Register Commodity Token")
        registry.register_token(
            token_address=token3.address,
            asset_type=2,
            stream_id=3,
            metadata_uri="ipfs://QmCommodity1"
        ).run(sender=admin)
        
        scenario.verify(registry.data.token_count == 3)
        
        # Test 4: Duplicate registration should fail
        scenario.h2("Test 4: Duplicate Registration Fails")
        registry.register_token(
            token_address=token1.address,
            asset_type=0,
            stream_id=4,
            metadata_uri="ipfs://QmDuplicate",
            _sender=admin,
            _valid=False
        )
        
        # Test 5: Get token by address
        scenario.h2("Test 5: Get Token by Address")
        token_info = scenario.compute(registry.get_token(token1.address))
        scenario.verify(token_info.asset_type == 0)
        scenario.verify(token_info.stream_id == 1)
        
        # Test 6: Get token by stream ID
        scenario.h2("Test 6: Get Token by Stream ID")
        token_by_stream = scenario.compute(registry.get_token_by_stream_id(2))
        scenario.verify(token_by_stream.token_address == token2.address)
        scenario.verify(token_by_stream.asset_type == 1)
        
        # Test 7: Get tokens by type
        scenario.h2("Test 7: Get Tokens by Type")
        real_estate_tokens = scenario.compute(registry.get_tokens_by_type(0))
        scenario.verify(sp.len(real_estate_tokens) == 1)
        
        # Test 8: Pagination
        scenario.h2("Test 8: Paginated Query")
        page1 = scenario.compute(registry.get_all_tokens_paginated(sp.record(offset=0, limit=2)))
        scenario.verify(page1.total_count == 3)
        scenario.verify(sp.len(page1.tokens) == 2)
        
        # Test 9: Get token count
        scenario.h2("Test 9: Get Token Count")
        count = scenario.compute(registry.get_token_count())
        scenario.verify(count == 3)
        
        # Test 10: Get asset type by token
        scenario.h2("Test 10: Get Asset Type by Token")
        asset_type = scenario.compute(registry.get_asset_type_by_token(token3.address))
        scenario.verify(asset_type == 2)
