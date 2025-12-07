#!/usr/bin/env python3
"""
Test script to verify all required dependencies are installed correctly.
This script tests imports of key modules from AIP Agent SDK and dependencies.
"""

import sys
import os

# Set dummy environment variables to allow imports
os.environ['MEMBASE_ACCOUNT'] = '0x0000000000000000000000000000000000000000'
os.environ['MEMBASE_SECRET_KEY'] = 'dummy_key_for_testing'
os.environ['MEMBASE_ID'] = 'test_agent'

def test_imports():
    """Test importing all required modules."""
    errors = []
    
    # Test AIP Agent SDK imports
    print("Testing AIP Agent SDK imports...")
    try:
        from aip_agent.agents.full_agent import FullAgentWrapper
        print("✓ Successfully imported FullAgentWrapper from aip_agent.agents.full_agent")
    except ImportError as e:
        errors.append(f"✗ Failed to import FullAgentWrapper: {e}")
    
    try:
        from aip_agent.agents.agent import Agent
        print("✓ Successfully imported Agent from aip_agent.agents.agent")
    except ImportError as e:
        errors.append(f"✗ Failed to import Agent: {e}")
    
    # Test Membase imports
    print("\nTesting Membase imports...")
    try:
        from membase.chain.chain import Client
        print("✓ Successfully imported Client from membase.chain.chain")
    except ImportError as e:
        errors.append(f"✗ Failed to import Client from membase.chain.chain: {e}")
    
    try:
        from membase.chain.chain import membase_id, membase_account, membase_secret
        print("✓ Successfully imported membase_id, membase_account, membase_secret")
    except ImportError as e:
        errors.append(f"✗ Failed to import membase configuration: {e}")
    
    # Test Flask imports
    print("\nTesting Flask imports...")
    try:
        from flask import Flask
        print("✓ Successfully imported Flask")
    except ImportError as e:
        errors.append(f"✗ Failed to import Flask: {e}")
    
    try:
        from flask_cors import CORS
        print("✓ Successfully imported CORS from flask_cors")
    except ImportError as e:
        errors.append(f"✗ Failed to import CORS: {e}")
    
    # Test other dependencies
    print("\nTesting other dependencies...")
    try:
        from dotenv import load_dotenv
        print("✓ Successfully imported load_dotenv from python-dotenv")
    except ImportError as e:
        errors.append(f"✗ Failed to import load_dotenv: {e}")
    
    try:
        from web3 import Web3
        print("✓ Successfully imported Web3")
    except ImportError as e:
        errors.append(f"✗ Failed to import Web3: {e}")
    
    try:
        from pydantic import BaseModel
        print("✓ Successfully imported BaseModel from pydantic")
    except ImportError as e:
        errors.append(f"✗ Failed to import BaseModel: {e}")
    
    try:
        import aiohttp
        print("✓ Successfully imported aiohttp")
    except ImportError as e:
        errors.append(f"✗ Failed to import aiohttp: {e}")
    
    # Test testing frameworks
    print("\nTesting testing frameworks...")
    try:
        import pytest
        print("✓ Successfully imported pytest")
    except ImportError as e:
        errors.append(f"✗ Failed to import pytest: {e}")
    
    try:
        from hypothesis import given
        print("✓ Successfully imported hypothesis")
    except ImportError as e:
        errors.append(f"✗ Failed to import hypothesis: {e}")
    
    # Print summary
    print("\n" + "="*60)
    if errors:
        print(f"FAILED: {len(errors)} import error(s) found:")
        for error in errors:
            print(f"  {error}")
        return False
    else:
        print("SUCCESS: All required modules imported successfully!")
        return True

if __name__ == "__main__":
    success = test_imports()
    sys.exit(0 if success else 1)
