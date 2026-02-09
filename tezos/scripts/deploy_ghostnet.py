"""
Ghostnet Deployment Script

This script deploys all Continuum Protocol contracts to Tezos Ghostnet testnet.

Deployment order:
1. Streaming Protocol
2. Asset Yield Protocol
3. Compliance Guard
4. Token Registry
5. FA2 Token
6. RWA Hub (coordinates all other contracts)

After deployment, contract addresses are saved to config/ghostnet.json

Usage:
    python deploy_ghostnet.py --admin <admin_address> [--rpc <rpc_endpoint>]

Requirements: 15.1, 15.3, 15.4
"""

import sys
import os
import json
import subprocess
from datetime import datetime
from pathlib import Path

# Add contracts directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'contracts'))

def load_config():
    """Load Ghostnet configuration"""
    config_path = Path(__file__).parent.parent / 'config' / 'ghostnet.json'
    with open(config_path, 'r') as f:
        return json.load(f)

def save_config(config):
    """Save updated configuration with deployed contract addresses"""
    config_path = Path(__file__).parent.parent / 'config' / 'ghostnet.json'
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    print(f"✓ Configuration saved to {config_path}")

def compile_contract(contract_name, contract_module, init_params):
    """
    Compile a SmartPy contract to Michelson
    
    Args:
        contract_name: Name of the contract (e.g., 'streaming_protocol')
        contract_module: Imported contract module
        init_params: Dictionary of initialization parameters
    
    Returns:
        Path to compiled contract directory
    """
    print(f"\n📝 Compiling {contract_name}...")
    
    output_dir = Path(__file__).parent.parent / 'output_deploy' / contract_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Import the contract class
    contract_class = getattr(contract_module.main, contract_name.title().replace('_', ''))
    
    # Create contract instance with init params
    contract = contract_class(**init_params)
    
    # Compile using SmartPy
    import smartpy as sp
    
    # Create a test scenario to compile the contract
    @sp.add_test()
    def test():
        scenario = sp.test_scenario("Compilation", contract_module.main)
        scenario += contract
    
    # Compile to Michelson
    sp.compile_contract(
        contract,
        target_directory=str(output_dir),
        contract_name=contract_name
    )
    
    print(f"✓ Compiled to {output_dir}")
    return output_dir

def originate_contract(contract_name, compiled_dir, admin_address, rpc_endpoint):
    """
    Originate (deploy) a compiled contract to Ghostnet
    
    Args:
        contract_name: Name of the contract
        compiled_dir: Path to compiled contract directory
        admin_address: Admin address for the contract
        rpc_endpoint: Tezos RPC endpoint
    
    Returns:
        Deployed contract address (KT1...)
    """
    print(f"\n🚀 Originating {contract_name} to Ghostnet...")
    
    # In a real deployment, this would use octez-client or pytezos
    # For now, we'll provide instructions for manual deployment
    
    michelson_file = compiled_dir / f"{contract_name}.tz"
    storage_file = compiled_dir / f"{contract_name}_storage.tz"
    
    print(f"\n📋 Manual Origination Instructions:")
    print(f"   Contract: {michelson_file}")
    print(f"   Storage: {storage_file}")
    print(f"\n   Using octez-client:")
    print(f"   octez-client originate contract {contract_name} \\")
    print(f"     transferring 0 from {admin_address} \\")
    print(f"     running {michelson_file} \\")
    print(f"     --init \"$(cat {storage_file})\" \\")
    print(f"     --burn-cap 10 \\")
    print(f"     --endpoint {rpc_endpoint}")
    
    # Placeholder: In production, use pytezos or octez-client programmatically
    contract_address = input(f"\n   Enter deployed contract address for {contract_name} (KT1...): ").strip()
    
    if not contract_address.startswith('KT1'):
        raise ValueError(f"Invalid contract address: {contract_address}")
    
    print(f"✓ Contract deployed at: {contract_address}")
    return contract_address

def deploy_streaming_protocol(admin_address, rpc_endpoint):
    """Deploy Streaming Protocol contract"""
    print("\n" + "="*60)
    print("1. DEPLOYING STREAMING PROTOCOL")
    print("="*60)
    
    from streaming_protocol import main as streaming_module
    
    init_params = {'admin': admin_address}
    compiled_dir = compile_contract('streaming_protocol', streaming_module, init_params)
    contract_address = originate_contract('streaming_protocol', compiled_dir, admin_address, rpc_endpoint)
    
    return contract_address

def deploy_asset_yield_protocol(admin_address, streaming_protocol_address, rpc_endpoint):
    """Deploy Asset Yield Protocol contract"""
    print("\n" + "="*60)
    print("2. DEPLOYING ASSET YIELD PROTOCOL")
    print("="*60)
    
    from asset_yield_protocol import main as asset_module
    
    init_params = {
        'admin': admin_address,
        'streaming_protocol_address': streaming_protocol_address
    }
    compiled_dir = compile_contract('asset_yield_protocol', asset_module, init_params)
    contract_address = originate_contract('asset_yield_protocol', compiled_dir, admin_address, rpc_endpoint)
    
    return contract_address

def deploy_compliance_guard(admin_address, rpc_endpoint):
    """Deploy Compliance Guard contract"""
    print("\n" + "="*60)
    print("3. DEPLOYING COMPLIANCE GUARD")
    print("="*60)
    
    from compliance_guard import main as compliance_module
    
    init_params = {'admin': admin_address}
    compiled_dir = compile_contract('compliance_guard', compliance_module, init_params)
    contract_address = originate_contract('compliance_guard', compiled_dir, admin_address, rpc_endpoint)
    
    return contract_address

def deploy_token_registry(admin_address, rpc_endpoint):
    """Deploy Token Registry contract"""
    print("\n" + "="*60)
    print("4. DEPLOYING TOKEN REGISTRY")
    print("="*60)
    
    from token_registry import main as registry_module
    
    init_params = {'admin': admin_address}
    compiled_dir = compile_contract('token_registry', registry_module, init_params)
    contract_address = originate_contract('token_registry', compiled_dir, admin_address, rpc_endpoint)
    
    return contract_address

def deploy_fa2_token(admin_address, asset_yield_protocol_address, rpc_endpoint):
    """Deploy FA2 Token contract"""
    print("\n" + "="*60)
    print("5. DEPLOYING FA2 TOKEN")
    print("="*60)
    
    from fa2_token import main as fa2_module
    
    init_params = {
        'admin': admin_address,
        'asset_yield_protocol': asset_yield_protocol_address
    }
    compiled_dir = compile_contract('fa2_token', fa2_module, init_params)
    contract_address = originate_contract('fa2_token', compiled_dir, admin_address, rpc_endpoint)
    
    return contract_address

def deploy_rwa_hub(admin_address, contract_addresses, rpc_endpoint):
    """Deploy RWA Hub contract (main orchestrator)"""
    print("\n" + "="*60)
    print("6. DEPLOYING RWA HUB")
    print("="*60)
    
    from rwa_hub import main as hub_module
    
    init_params = {
        'admin': admin_address,
        'streaming_protocol': contract_addresses['streaming_protocol'],
        'asset_yield_protocol': contract_addresses['asset_yield_protocol'],
        'compliance_guard': contract_addresses['compliance_guard'],
        'token_registry': contract_addresses['token_registry']
    }
    compiled_dir = compile_contract('rwa_hub', hub_module, init_params)
    contract_address = originate_contract('rwa_hub', compiled_dir, admin_address, rpc_endpoint)
    
    return contract_address

def verify_deployment(config):
    """Basic verification that all contracts are deployed"""
    print("\n" + "="*60)
    print("VERIFYING DEPLOYMENT")
    print("="*60)
    
    contracts = config['contracts']
    all_deployed = True
    
    for name, address in contracts.items():
        if not address or not address.startswith('KT1'):
            print(f"❌ {name}: NOT DEPLOYED")
            all_deployed = False
        else:
            print(f"✓ {name}: {address}")
    
    return all_deployed

def main():
    """Main deployment function"""
    print("Continuum Protocol - Ghostnet Deployment")
    print("=" * 60)
    
    # Parse command line arguments
    if len(sys.argv) < 3 or sys.argv[1] != '--admin':
        print("\nUsage: python deploy_ghostnet.py --admin <admin_address> [--rpc <rpc_endpoint>]")
        print("\nExample:")
        print("  python deploy_ghostnet.py --admin tz1VSUr8wwNhLAzempoch5d6hLRiTh8Cjcjb")
        sys.exit(1)
    
    admin_address = sys.argv[2]
    
    # Validate admin address
    if not (admin_address.startswith('tz1') or admin_address.startswith('tz2') or admin_address.startswith('tz3')):
        print(f"Error: Invalid admin address: {admin_address}")
        print("Admin address must start with tz1, tz2, or tz3")
        sys.exit(1)
    
    # Load configuration
    config = load_config()
    rpc_endpoint = config['rpc_endpoint']
    
    # Override RPC if provided
    if '--rpc' in sys.argv:
        rpc_idx = sys.argv.index('--rpc')
        if rpc_idx + 1 < len(sys.argv):
            rpc_endpoint = sys.argv[rpc_idx + 1]
    
    print(f"\n📋 Deployment Configuration:")
    print(f"   Network: {config['network']}")
    print(f"   RPC Endpoint: {rpc_endpoint}")
    print(f"   Admin Address: {admin_address}")
    print(f"   Block Explorer: {config['block_explorer']}")
    
    print("\n⚠️  Prerequisites:")
    print("   1. SmartPy CLI installed")
    print("   2. octez-client installed and configured")
    print("   3. Admin account funded with XTZ (get from faucet)")
    print(f"   4. Faucet: {config['faucet_url']}")
    
    confirm = input("\n   Continue with deployment? (yes/no): ").strip().lower()
    if confirm != 'yes':
        print("Deployment cancelled.")
        return
    
    try:
        # Deploy contracts in order
        deployed_addresses = {}
        
        # 1. Streaming Protocol
        deployed_addresses['streaming_protocol'] = deploy_streaming_protocol(
            admin_address, rpc_endpoint
        )
        
        # 2. Asset Yield Protocol (needs streaming protocol address)
        deployed_addresses['asset_yield_protocol'] = deploy_asset_yield_protocol(
            admin_address,
            deployed_addresses['streaming_protocol'],
            rpc_endpoint
        )
        
        # 3. Compliance Guard
        deployed_addresses['compliance_guard'] = deploy_compliance_guard(
            admin_address, rpc_endpoint
        )
        
        # 4. Token Registry
        deployed_addresses['token_registry'] = deploy_token_registry(
            admin_address, rpc_endpoint
        )
        
        # 5. FA2 Token (needs asset yield protocol address)
        deployed_addresses['fa2_token'] = deploy_fa2_token(
            admin_address,
            deployed_addresses['asset_yield_protocol'],
            rpc_endpoint
        )
        
        # 6. RWA Hub (needs all other contract addresses)
        deployed_addresses['rwa_hub'] = deploy_rwa_hub(
            admin_address,
            deployed_addresses,
            rpc_endpoint
        )
        
        # Update configuration
        config['contracts'] = deployed_addresses
        config['admin_address'] = admin_address
        config['deployed_at'] = datetime.now().isoformat()
        
        # Save configuration
        save_config(config)
        
        # Verify deployment
        if verify_deployment(config):
            print("\n" + "="*60)
            print("✅ DEPLOYMENT SUCCESSFUL!")
            print("="*60)
            print(f"\nAll contracts deployed to Ghostnet.")
            print(f"Configuration saved to: config/ghostnet.json")
            print(f"\nNext steps:")
            print(f"  1. Run verification script: python scripts/verify_deployment.py --network ghostnet")
            print(f"  2. Test contract interactions")
            print(f"  3. Update frontend configuration with contract addresses")
            print(f"\nView contracts on block explorer:")
            for name, address in deployed_addresses.items():
                print(f"  {name}: {config['block_explorer']}/{address}")
        else:
            print("\n⚠️  Deployment incomplete. Some contracts failed to deploy.")
            print("Check the configuration file and retry failed deployments.")
    
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        print("\nPartial deployment may have occurred. Check config/ghostnet.json")
        sys.exit(1)

if __name__ == "__main__":
    main()
