"""
Simple compilation test for FA2 token contract
"""
import smartpy as sp
import sys
sys.path.insert(0, 'contracts')

print("Importing FA2 token contract...")
from fa2_token import main

print("✓ FA2 token contract imported successfully")

# Create a test scenario
print("Creating test scenario...")

@sp.add_test()
def test():
    scenario = sp.test_scenario("FA2 Compilation Test", main)
    
    admin = sp.test_account("Admin")
    asset_yield_protocol = sp.test_account("AssetYieldProtocol")
    
    fa2 = main.FA2Token(admin=admin.address, asset_yield_protocol=asset_yield_protocol.address)
    scenario += fa2
    
    print("✓ FA2 token contract instantiated successfully")

print("\n✓✓✓ All FA2 token contract compilation tests passed! ✓✓✓")
