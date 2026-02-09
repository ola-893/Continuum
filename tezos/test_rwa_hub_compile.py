"""
Test script to verify RWA Hub contract compiles correctly.
"""

import smartpy as sp
from contracts.rwa_hub import main

@sp.add_test()
def test():
    scenario = sp.test_scenario("RWAHub Compilation Test", main)
    scenario.h1("RWA Hub Contract Compilation Test")
    
    # Test accounts
    admin = sp.test_account("Admin")
    streaming_protocol = sp.test_account("StreamingProtocol")
    asset_yield_protocol = sp.test_account("AssetYieldProtocol")
    compliance_guard = sp.test_account("ComplianceGuard")
    token_registry = sp.test_account("TokenRegistry")
    
    # Deploy contract
    scenario.h2("Contract Deployment")
    hub = main.RWAHub(
        streaming_protocol=streaming_protocol.address,
        asset_yield_protocol=asset_yield_protocol.address,
        compliance_guard=compliance_guard.address,
        token_registry=token_registry.address,
        admin=admin.address
    )
    scenario += hub
    
    # Verify storage initialization
    scenario.verify(hub.data.admin == admin.address)
    scenario.verify(hub.data.streaming_protocol == streaming_protocol.address)
    scenario.verify(hub.data.asset_yield_protocol == asset_yield_protocol.address)
    scenario.verify(hub.data.compliance_guard == compliance_guard.address)
    scenario.verify(hub.data.token_registry == token_registry.address)
    
    scenario.h2("Compilation Successful")
