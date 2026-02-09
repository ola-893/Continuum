"""
Test to verify compliance guard contract compiles correctly
"""
import smartpy as sp

# Import the contract module
from contracts.compliance_guard import main

# Create a test scenario
@sp.add_test()
def test_compliance_guard_compilation():
    """Test that the compliance guard contract can be instantiated"""
    scenario = sp.test_scenario("Compliance Guard Compilation Test", main)
    scenario.h1("Compliance Guard Contract")
    
    # Create test admin address
    admin = sp.test_account("Admin")
    
    # Instantiate the contract
    contract = main.ComplianceGuard(admin.address)
    scenario += contract
    
    scenario.verify(contract.data.admins.contains(admin.address))
    
    print("✓ Compliance Guard contract compiled successfully")
