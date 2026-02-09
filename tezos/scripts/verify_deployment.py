"""
Deployment Verification Script

This script verifies that all contracts are deployed correctly and functioning.

Verification checks:
1. All contract addresses are valid and contracts exist
2. Contract storage is initialized correctly
3. Cross-contract references are set up properly
4. Admin addresses are configured
5. Basic operations work (create stream, register token, etc.)

Usage:
  python verify_deployment.py --network ghostnet
  python verify_deployment.py --network mainnet

Requirements: 15.4
"""

import json
import sys
import requests
from pathlib import Path

def load_config(network):
    """Load network configuration"""
    config_path = Path(__file__).parent.parent / 'config' / f'{network}.json'
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Error: Configuration file for {network} not found at {config_path}")
        sys.exit(1)

def verify_contract_exists(address, network, rpc_endpoint):
    """
    Verify that a contract exists at the given address
    
    Args:
        address: Contract address (KT1...)
        network: Network name (ghostnet/mainnet)
        rpc_endpoint: RPC endpoint URL
    
    Returns:
        True if contract exists, False otherwise
    """
    try:
        # Query contract using Tezos RPC
        url = f"{rpc_endpoint}/chains/main/blocks/head/context/contracts/{address}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            return True
        elif response.status_code == 404:
            return False
        else:
            print(f"   ⚠️  Warning: Unexpected response code {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"   ⚠️  Warning: Could not verify contract: {e}")
        return False

def get_contract_storage(address, rpc_endpoint):
    """
    Get contract storage
    
    Args:
        address: Contract address
        rpc_endpoint: RPC endpoint URL
    
    Returns:
        Contract storage as dict, or None if error
    """
    try:
        url = f"{rpc_endpoint}/chains/main/blocks/head/context/contracts/{address}/storage"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            return response.json()
        else:
            return None
    except requests.exceptions.RequestException as e:
        print(f"   ⚠️  Warning: Could not fetch storage: {e}")
        return None

def verify_storage_field(storage, field_path, expected_type=None):
    """
    Verify a field exists in storage
    
    Args:
        storage: Contract storage dict
        field_path: Path to field (e.g., 'admin' or 'data.admin')
        expected_type: Expected type (str, int, dict, list)
    
    Returns:
        True if field exists and matches type, False otherwise
    """
    if storage is None:
        return False
    
    # Navigate nested fields
    current = storage
    for part in field_path.split('.'):
        if isinstance(current, dict) and part in current:
            current = current[part]
        else:
            return False
    
    # Check type if specified
    if expected_type and not isinstance(current, expected_type):
        return False
    
    return True

def verify_streaming_protocol(address, config, rpc_endpoint):
    """Verify Streaming Protocol contract"""
    print("\n1. Streaming Protocol")
    print(f"   Address: {address}")
    
    # Check contract exists
    if not verify_contract_exists(address, config['network'], rpc_endpoint):
        print("   ❌ Contract does not exist")
        return False
    print("   ✓ Contract exists")
    
    # Get storage
    storage = get_contract_storage(address, rpc_endpoint)
    if storage is None:
        print("   ⚠️  Could not fetch storage")
        return False
    
    # Verify storage fields
    checks = [
        ('admin', str),
        ('next_stream_id', int),
        ('streams', dict)
    ]
    
    all_passed = True
    for field, expected_type in checks:
        if verify_storage_field(storage, field, expected_type):
            print(f"   ✓ Storage field '{field}' initialized")
        else:
            print(f"   ❌ Storage field '{field}' missing or wrong type")
            all_passed = False
    
    # Verify admin address
    if storage and 'admin' in storage:
        if storage['admin'] == config['admin_address']:
            print(f"   ✓ Admin address configured correctly")
        else:
            print(f"   ⚠️  Admin address mismatch")
            all_passed = False
    
    return all_passed

def verify_asset_yield_protocol(address, config, rpc_endpoint):
    """Verify Asset Yield Protocol contract"""
    print("\n2. Asset Yield Protocol")
    print(f"   Address: {address}")
    
    if not verify_contract_exists(address, config['network'], rpc_endpoint):
        print("   ❌ Contract does not exist")
        return False
    print("   ✓ Contract exists")
    
    storage = get_contract_storage(address, rpc_endpoint)
    if storage is None:
        print("   ⚠️  Could not fetch storage")
        return False
    
    checks = [
        ('admin', str),
        ('streaming_protocol_address', str),
        ('asset_to_stream', dict),
        ('stream_to_asset', dict)
    ]
    
    all_passed = True
    for field, expected_type in checks:
        if verify_storage_field(storage, field, expected_type):
            print(f"   ✓ Storage field '{field}' initialized")
        else:
            print(f"   ❌ Storage field '{field}' missing or wrong type")
            all_passed = False
    
    # Verify streaming protocol reference
    if storage and 'streaming_protocol_address' in storage:
        expected_addr = config['contracts']['streaming_protocol']
        if storage['streaming_protocol_address'] == expected_addr:
            print(f"   ✓ Streaming protocol reference correct")
        else:
            print(f"   ⚠️  Streaming protocol reference mismatch")
            all_passed = False
    
    return all_passed

def verify_compliance_guard(address, config, rpc_endpoint):
    """Verify Compliance Guard contract"""
    print("\n3. Compliance Guard")
    print(f"   Address: {address}")
    
    if not verify_contract_exists(address, config['network'], rpc_endpoint):
        print("   ❌ Contract does not exist")
        return False
    print("   ✓ Contract exists")
    
    storage = get_contract_storage(address, rpc_endpoint)
    if storage is None:
        print("   ⚠️  Could not fetch storage")
        return False
    
    checks = [
        ('admins', (dict, list)),
        ('identities', dict),
        ('frozen_streams', dict),
        ('asset_types', dict)
    ]
    
    all_passed = True
    for field, expected_type in checks:
        if verify_storage_field(storage, field, expected_type):
            print(f"   ✓ Storage field '{field}' initialized")
        else:
            print(f"   ❌ Storage field '{field}' missing or wrong type")
            all_passed = False
    
    return all_passed

def verify_token_registry(address, config, rpc_endpoint):
    """Verify Token Registry contract"""
    print("\n4. Token Registry")
    print(f"   Address: {address}")
    
    if not verify_contract_exists(address, config['network'], rpc_endpoint):
        print("   ❌ Contract does not exist")
        return False
    print("   ✓ Contract exists")
    
    storage = get_contract_storage(address, rpc_endpoint)
    if storage is None:
        print("   ⚠️  Could not fetch storage")
        return False
    
    checks = [
        ('tokens', dict),
        ('stream_to_token', dict),
        ('tokens_by_type', dict),
        ('token_count', int)
    ]
    
    all_passed = True
    for field, expected_type in checks:
        if verify_storage_field(storage, field, expected_type):
            print(f"   ✓ Storage field '{field}' initialized")
        else:
            print(f"   ❌ Storage field '{field}' missing or wrong type")
            all_passed = False
    
    # Verify token_count is 0 initially
    if storage and 'token_count' in storage:
        if storage['token_count'] == 0:
            print(f"   ✓ Token count initialized to 0")
        else:
            print(f"   ⚠️  Token count is {storage['token_count']}, expected 0")
    
    return all_passed

def verify_fa2_token(address, config, rpc_endpoint):
    """Verify FA2 Token contract"""
    print("\n5. FA2 Token")
    print(f"   Address: {address}")
    
    if not verify_contract_exists(address, config['network'], rpc_endpoint):
        print("   ❌ Contract does not exist")
        return False
    print("   ✓ Contract exists")
    
    storage = get_contract_storage(address, rpc_endpoint)
    if storage is None:
        print("   ⚠️  Could not fetch storage")
        return False
    
    checks = [
        ('admin', str),
        ('ledger', dict),
        ('token_metadata', dict),
        ('operators', dict),
        ('next_token_id', int),
        ('asset_yield_protocol', str)
    ]
    
    all_passed = True
    for field, expected_type in checks:
        if verify_storage_field(storage, field, expected_type):
            print(f"   ✓ Storage field '{field}' initialized")
        else:
            print(f"   ❌ Storage field '{field}' missing or wrong type")
            all_passed = False
    
    # Verify asset yield protocol reference
    if storage and 'asset_yield_protocol' in storage:
        expected_addr = config['contracts']['asset_yield_protocol']
        if storage['asset_yield_protocol'] == expected_addr:
            print(f"   ✓ Asset yield protocol reference correct")
        else:
            print(f"   ⚠️  Asset yield protocol reference mismatch")
            all_passed = False
    
    return all_passed

def verify_rwa_hub(address, config, rpc_endpoint):
    """Verify RWA Hub contract"""
    print("\n6. RWA Hub")
    print(f"   Address: {address}")
    
    if not verify_contract_exists(address, config['network'], rpc_endpoint):
        print("   ❌ Contract does not exist")
        return False
    print("   ✓ Contract exists")
    
    storage = get_contract_storage(address, rpc_endpoint)
    if storage is None:
        print("   ⚠️  Could not fetch storage")
        return False
    
    checks = [
        ('admin', str),
        ('streaming_protocol', str),
        ('asset_yield_protocol', str),
        ('compliance_guard', str),
        ('token_registry', str),
        ('active_rentals', dict)
    ]
    
    all_passed = True
    for field, expected_type in checks:
        if verify_storage_field(storage, field, expected_type):
            print(f"   ✓ Storage field '{field}' initialized")
        else:
            print(f"   ❌ Storage field '{field}' missing or wrong type")
            all_passed = False
    
    # Verify all contract references
    if storage:
        contract_refs = [
            ('streaming_protocol', 'streaming_protocol'),
            ('asset_yield_protocol', 'asset_yield_protocol'),
            ('compliance_guard', 'compliance_guard'),
            ('token_registry', 'token_registry')
        ]
        
        for storage_field, config_key in contract_refs:
            if storage_field in storage:
                expected_addr = config['contracts'][config_key]
                if storage[storage_field] == expected_addr:
                    print(f"   ✓ {config_key} reference correct")
                else:
                    print(f"   ⚠️  {config_key} reference mismatch")
                    all_passed = False
    
    return all_passed

def verify_cross_contract_refs(config, rpc_endpoint):
    """Verify contracts reference each other correctly"""
    print("\n" + "="*60)
    print("CROSS-CONTRACT REFERENCE VERIFICATION")
    print("="*60)
    
    all_passed = True
    
    # Asset Yield Protocol -> Streaming Protocol
    ayp_storage = get_contract_storage(config['contracts']['asset_yield_protocol'], rpc_endpoint)
    if ayp_storage and 'streaming_protocol_address' in ayp_storage:
        if ayp_storage['streaming_protocol_address'] == config['contracts']['streaming_protocol']:
            print("✓ Asset Yield Protocol -> Streaming Protocol")
        else:
            print("❌ Asset Yield Protocol -> Streaming Protocol (mismatch)")
            all_passed = False
    
    # FA2 Token -> Asset Yield Protocol
    fa2_storage = get_contract_storage(config['contracts']['fa2_token'], rpc_endpoint)
    if fa2_storage and 'asset_yield_protocol' in fa2_storage:
        if fa2_storage['asset_yield_protocol'] == config['contracts']['asset_yield_protocol']:
            print("✓ FA2 Token -> Asset Yield Protocol")
        else:
            print("❌ FA2 Token -> Asset Yield Protocol (mismatch)")
            all_passed = False
    
    # RWA Hub -> All other contracts
    hub_storage = get_contract_storage(config['contracts']['rwa_hub'], rpc_endpoint)
    if hub_storage:
        refs = [
            ('streaming_protocol', 'Streaming Protocol'),
            ('asset_yield_protocol', 'Asset Yield Protocol'),
            ('compliance_guard', 'Compliance Guard'),
            ('token_registry', 'Token Registry')
        ]
        
        for field, name in refs:
            if field in hub_storage:
                if hub_storage[field] == config['contracts'][field]:
                    print(f"✓ RWA Hub -> {name}")
                else:
                    print(f"❌ RWA Hub -> {name} (mismatch)")
                    all_passed = False
    
    return all_passed

def test_end_to_end_flow(config, rpc_endpoint):
    """
    Test basic end-to-end flow (manual instructions)
    
    This provides instructions for manual testing since automated testing
    requires transaction signing.
    """
    print("\n" + "="*60)
    print("END-TO-END FLOW TESTING (MANUAL)")
    print("="*60)
    
    print("\nTo test the complete flow, execute these operations:")
    
    print("\n1. Register KYC Identity (Compliance Guard)")
    print(f"   Contract: {config['contracts']['compliance_guard']}")
    print(f"   Entrypoint: register_identity")
    print(f"   Parameters: user=<test_address>, jurisdiction='US', verification_level=1, expiry_time=<future_timestamp>")
    
    print("\n2. Whitelist Address (Compliance Guard)")
    print(f"   Contract: {config['contracts']['compliance_guard']}")
    print(f"   Entrypoint: whitelist_address")
    print(f"   Parameters: user=<test_address>, asset_types=[0]")
    
    print("\n3. Create Compliant RWA Stream (RWA Hub)")
    print(f"   Contract: {config['contracts']['rwa_hub']}")
    print(f"   Entrypoint: create_compliant_rwa_stream")
    print(f"   Parameters: token_address=<nft_address>, total_yield=1000000, duration=86400, asset_type=0, metadata_uri='ipfs://...'")
    
    print("\n4. Claim Yield (RWA Hub)")
    print(f"   Contract: {config['contracts']['rwa_hub']}")
    print(f"   Entrypoint: compliant_claim_yield")
    print(f"   Parameters: token_address=<nft_address>")
    
    print("\n5. Verify on Block Explorer")
    print(f"   Explorer: {config['block_explorer']}")
    print(f"   Check transaction history for each contract")
    
    print("\n⚠️  Note: Automated testing requires transaction signing and is not")
    print("   included in this verification script. Use the frontend or octez-client")
    print("   to perform these operations manually.")

def main():
    """Main verification function"""
    if len(sys.argv) < 3 or sys.argv[1] != '--network':
        print("Usage: python verify_deployment.py --network <ghostnet|mainnet>")
        sys.exit(1)
    
    network = sys.argv[2]
    if network not in ['ghostnet', 'mainnet']:
        print("Error: Network must be 'ghostnet' or 'mainnet'")
        sys.exit(1)
    
    print(f"Continuum Protocol - Deployment Verification ({network})")
    print("=" * 60)
    
    # Load configuration
    config = load_config(network)
    rpc_endpoint = config['rpc_endpoint']
    
    print(f"\n📋 Configuration:")
    print(f"   Network: {network}")
    print(f"   RPC Endpoint: {rpc_endpoint}")
    print(f"   Admin Address: {config.get('admin_address', 'Not set')}")
    print(f"   Deployed At: {config.get('deployed_at', 'Not set')}")
    
    # Check if contracts are deployed
    contracts = config['contracts']
    if not any(contracts.values()):
        print("\n❌ No contracts deployed. Run deploy_ghostnet.py first.")
        sys.exit(1)
    
    print("\n" + "="*60)
    print("CONTRACT VERIFICATION")
    print("="*60)
    
    # Verify each contract
    results = {}
    
    if contracts.get('streaming_protocol'):
        results['streaming_protocol'] = verify_streaming_protocol(
            contracts['streaming_protocol'], config, rpc_endpoint
        )
    
    if contracts.get('asset_yield_protocol'):
        results['asset_yield_protocol'] = verify_asset_yield_protocol(
            contracts['asset_yield_protocol'], config, rpc_endpoint
        )
    
    if contracts.get('compliance_guard'):
        results['compliance_guard'] = verify_compliance_guard(
            contracts['compliance_guard'], config, rpc_endpoint
        )
    
    if contracts.get('token_registry'):
        results['token_registry'] = verify_token_registry(
            contracts['token_registry'], config, rpc_endpoint
        )
    
    if contracts.get('fa2_token'):
        results['fa2_token'] = verify_fa2_token(
            contracts['fa2_token'], config, rpc_endpoint
        )
    
    if contracts.get('rwa_hub'):
        results['rwa_hub'] = verify_rwa_hub(
            contracts['rwa_hub'], config, rpc_endpoint
        )
    
    # Verify cross-contract references
    cross_refs_ok = verify_cross_contract_refs(config, rpc_endpoint)
    
    # Test end-to-end flow (manual instructions)
    test_end_to_end_flow(config, rpc_endpoint)
    
    # Summary
    print("\n" + "="*60)
    print("VERIFICATION SUMMARY")
    print("="*60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\nContract Verification: {passed}/{total} passed")
    for name, result in results.items():
        status = "✓" if result else "❌"
        print(f"  {status} {name}")
    
    print(f"\nCross-Contract References: {'✓' if cross_refs_ok else '❌'}")
    
    if passed == total and cross_refs_ok:
        print("\n✅ All verification checks passed!")
        print("\nNext steps:")
        print("  1. Perform manual end-to-end testing (see instructions above)")
        print("  2. Update frontend configuration with contract addresses")
        print("  3. Test frontend integration")
        sys.exit(0)
    else:
        print("\n⚠️  Some verification checks failed.")
        print("Review the errors above and fix deployment issues.")
        sys.exit(1)

if __name__ == "__main__":
    main()
