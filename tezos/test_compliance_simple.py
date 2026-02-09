"""
Simple test to verify compliance guard contract works
"""
import smartpy as sp
import sys
import os

# Add contracts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'contracts'))

from compliance_guard import main

@sp.add_test()
def test_simple():
    """Simple test"""
    scenario = sp.test_scenario("Simple Test", main)
    
    # Create admin
    admin = sp.test_account("Admin")
    
    # Create contract
    contract = main.ComplianceGuard(admin.address)
    scenario += contract
    
    # Verify admin is set
    scenario.verify(contract.data.admins.contains(admin.address))
    
    print("✓ Basic test passed")
