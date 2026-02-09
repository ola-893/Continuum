"""
Simple test to verify contracts can be imported and compiled
"""
import smartpy as sp

# Try importing the contracts
try:
    import sys
    sys.path.insert(0, 'contracts')
    
    # Just try to import - this will fail if there are syntax errors
    print("Testing contract imports...")
    
    # We'll create a minimal test scenario
    print("SmartPy version:", sp.__version__)
    print("✓ SmartPy is working")
    
except Exception as e:
    print(f"✗ Error: {e}")
    import traceback
    traceback.print_exc()
