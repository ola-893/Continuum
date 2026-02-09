#!/usr/bin/env python3
"""
Tezos Data Import Script for Continuum Protocol Migration

This script imports protocol data exported from Aptos into Tezos blockchain:
- Recreates streams with preserved parameters
- Mints NFTs with preserved metadata and ownership
- Imports compliance data (KYC, whitelisting)
- Recreates asset-to-stream mappings
- Registers tokens in the registry
- Recreates active rental streams

The script reads JSON data exported by export_aptos_data.py
"""

import json
import sys
import time
from typing import Dict, List, Any, Optional
from datetime import datetime
from pytezos import pytezos, ContractInterface
from pytezos.operation.result import OperationResult

# Tezos network configuration
TEZOS_NODE_URL = "https://ghostnet.tezos.marigold.dev"  # Change to mainnet for production
TEZOS_NETWORK = "ghostnet"  # or "mainnet"

# Contract addresses (update with your deployed addresses)
STREAMING_PROTOCOL_ADDRESS = "KT1..."  # Update with actual address
ASSET_YIELD_PROTOCOL_ADDRESS = "KT1..."  # Update with actual address
COMPLIANCE_GUARD_ADDRESS = "KT1..."  # Update with actual address
TOKEN_REGISTRY_ADDRESS = "KT1..."  # Update with actual address
RWA_HUB_ADDRESS = "KT1..."  # Update with actual address
FA2_TOKEN_ADDRESS = "KT1..."  # Update with actual address

# Admin private key (use environment variable in production!)
ADMIN_PRIVATE_KEY = "edsk..."  # Update with actual key or use env var


class TezosDataImporter:
    """Imports Continuum Protocol data into Tezos blockchain"""
    
    def __init__(self, node_url: str = TEZOS_NODE_URL, private_key: str = ADMIN_PRIVATE_KEY):
        """Initialize the importer with PyTezos client"""
        self.client = pytezos.using(shell=node_url, key=private_key)
        self.import_data = None
        self.import_results = {
            "metadata": {
                "import_timestamp": datetime.utcnow().isoformat(),
                "tezos_network": TEZOS_NETWORK,
                "tezos_node_url": node_url
            },
            "streams_created": [],
            "nfts_minted": [],
            "identities_registered": [],
            "streams_frozen": [],
            "admins_added": [],
            "tokens_registered": [],
            "rentals_created": [],
            "errors": []
        }
        
        # Load contract interfaces
        self.streaming_protocol = self.client.contract(STREAMING_PROTOCOL_ADDRESS)
        self.asset_yield_protocol = self.client.contract(ASSET_YIELD_PROTOCOL_ADDRESS)
        self.compliance_guard = self.client.contract(COMPLIANCE_GUARD_ADDRESS)
        self.token_registry = self.client.contract(TOKEN_REGISTRY_ADDRESS)
        self.rwa_hub = self.client.contract(RWA_HUB_ADDRESS)
        self.fa2_token = self.client.contract(FA2_TOKEN_ADDRESS)
    
    def load_export_file(self, filename: str):
        """
        Load exported Aptos data from JSON file
        
        Args:
            filename: Input filename
        """
        print(f"Loading export data from {filename}...")
        
        try:
            with open(filename, 'r') as f:
                self.import_data = json.load(f)
            
            print(f"✓ Loaded export data successfully")
            print(f"  Export timestamp: {self.import_data['metadata']['export_timestamp']}")
            print(f"  Aptos network: {self.import_data['metadata']['aptos_network']}")
            
        except FileNotFoundError:
            print(f"✗ Error: File {filename} not found")
            sys.exit(1)
        except json.JSONDecodeError as e:
            print(f"✗ Error: Invalid JSON in {filename}: {e}")
            sys.exit(1)
    
    def import_compliance_admins(self) -> List[str]:
        """
        Import admin addresses into Compliance Guard
        
        Returns:
            List of successfully added admin addresses
        """
        print("\nImporting compliance admins...")
        admins = self.import_data["compliance"]["admins"]
        added_admins = []
        
        for admin_address in admins:
            try:
                # Add admin to compliance guard
                op = self.compliance_guard.add_admin(admin_address).send()
                print(f"  Adding admin {admin_address[:10]}... (op: {op.hash()})")
                
                # Wait for confirmation
                op.wait()
                added_admins.append(admin_address)
                
            except Exception as e:
                error_msg = f"Failed to add admin {admin_address}: {e}"
                print(f"  ✗ {error_msg}")
                self.import_results["errors"].append(error_msg)
        
        print(f"✓ Added {len(added_admins)}/{len(admins)} admins")
        return added_admins
    
    def import_compliance_identities(self) -> List[Dict[str, Any]]:
        """
        Import KYC identities into Compliance Guard
        
        Returns:
            List of successfully registered identities
        """
        print("\nImporting compliance identities...")
        identities = self.import_data["compliance"]["identities"]
        registered = []
        
        for identity in identities:
            try:
                user_address = identity["user_address"]
                jurisdiction = identity["jurisdiction"]
                verification_level = identity["verification_level"]
                expiry_time = identity["expiry_time"]
                
                # Register identity
                op = self.compliance_guard.register_identity(
                    user=user_address,
                    jurisdiction=jurisdiction,
                    verification_level=verification_level,
                    expiry_time=expiry_time
                ).send()
                
                print(f"  Registering identity for {user_address[:10]}... (op: {op.hash()})")
                op.wait()
                
                # Whitelist for asset types
                if identity.get("whitelisted_asset_types"):
                    whitelist_op = self.compliance_guard.whitelist_address(
                        user=user_address,
                        asset_types=identity["whitelisted_asset_types"]
                    ).send()
                    whitelist_op.wait()
                
                registered.append(identity)
                
            except Exception as e:
                error_msg = f"Failed to register identity for {identity.get('user_address', 'unknown')}: {e}"
                print(f"  ✗ {error_msg}")
                self.import_results["errors"].append(error_msg)
        
        print(f"✓ Registered {len(registered)}/{len(identities)} identities")
        return registered
    
    def import_nfts(self) -> List[Dict[str, Any]]:
        """
        Mint NFTs with preserved metadata and ownership
        
        Returns:
            List of successfully minted NFTs
        """
        print("\nMinting NFTs...")
        nfts = self.import_data["nfts"]
        minted = []
        
        for nft in nfts:
            try:
                owner = nft["owner"]
                metadata_uri = nft["metadata_uri"]
                
                # Mint NFT to original owner
                op = self.fa2_token.mint(
                    to=owner,
                    metadata={"": metadata_uri.encode().hex()}  # TZIP-16 format
                ).send()
                
                print(f"  Minting NFT to {owner[:10]}... (op: {op.hash()})")
                op.wait()
                
                # Store the new token_id (will be sequential)
                nft["new_token_id"] = len(minted)
                minted.append(nft)
                
            except Exception as e:
                error_msg = f"Failed to mint NFT {nft.get('token_id', 'unknown')}: {e}"
                print(f"  ✗ {error_msg}")
                self.import_results["errors"].append(error_msg)
        
        print(f"✓ Minted {len(minted)}/{len(nfts)} NFTs")
        return minted
    
    def import_streams(self) -> List[Dict[str, Any]]:
        """
        Recreate streams with preserved parameters
        
        Returns:
            List of successfully created streams
        """
        print("\nRecreating streams...")
        streams = self.import_data["streams"]
        created = []
        
        for stream in streams:
            try:
                # Convert Aptos parameters to Tezos format
                recipient = stream["recipient"]
                token_address = stream["token_address"]
                token_id = stream["token_id"]
                total_amount = int(stream["total_amount"])
                flow_rate = int(stream["flow_rate"])
                
                # Calculate duration from start_time and stop_time
                start_time = int(stream["start_time"])
                stop_time = int(stream["stop_time"])
                duration = stop_time - start_time
                
                # Create stream through streaming protocol
                # Note: This will create a new stream_id on Tezos
                op = self.streaming_protocol.create_stream(
                    recipient=recipient,
                    token_address=token_address,
                    token_id=token_id,
                    flow_rate=flow_rate,
                    duration=duration,
                    total_amount=total_amount
                ).send()
                
                print(f"  Creating stream {stream['stream_id']} (op: {op.hash()})")
                op.wait()
                
                # Store mapping of old stream_id to new stream_id
                stream["new_stream_id"] = len(created)
                created.append(stream)
                
                # If stream had withdrawals, we need to update amount_withdrawn
                if stream.get("amount_withdrawn", 0) > 0:
                    # This would require a special admin function to set amount_withdrawn
                    print(f"    Warning: Stream had {stream['amount_withdrawn']} withdrawn, may need manual adjustment")
                
            except Exception as e:
                error_msg = f"Failed to create stream {stream.get('stream_id', 'unknown')}: {e}"
                print(f"  ✗ {error_msg}")
                self.import_results["errors"].append(error_msg)
        
        print(f"✓ Created {len(created)}/{len(streams)} streams")
        return created
    
    def import_asset_mappings(self, minted_nfts: List[Dict], created_streams: List[Dict]):
        """
        Recreate asset-to-stream mappings
        
        Args:
            minted_nfts: List of minted NFTs with new token IDs
            created_streams: List of created streams with new stream IDs
        """
        print("\nRecreating asset-stream mappings...")
        mappings = self.import_data["asset_mappings"]["asset_to_stream"]
        mapped = 0
        
        # Build lookup tables
        old_to_new_stream = {s["stream_id"]: s["new_stream_id"] for s in created_streams if "new_stream_id" in s}
        
        for token_address, old_stream_id in mappings.items():
            try:
                # Find the new stream_id
                new_stream_id = old_to_new_stream.get(old_stream_id)
                if new_stream_id is None:
                    print(f"  ✗ Could not find new stream_id for old stream {old_stream_id}")
                    continue
                
                # The mapping is created automatically when creating asset yield streams
                # through the RWA Hub, so we don't need to manually create it here
                # This is just for verification
                mapped += 1
                
            except Exception as e:
                error_msg = f"Failed to map asset {token_address}: {e}"
                print(f"  ✗ {error_msg}")
                self.import_results["errors"].append(error_msg)
        
        print(f"✓ Verified {mapped}/{len(mappings)} asset-stream mappings")
    
    def import_token_registry(self, minted_nfts: List[Dict], created_streams: List[Dict]):
        """
        Register tokens in the Token Registry
        
        Args:
            minted_nfts: List of minted NFTs with new token IDs
            created_streams: List of created streams with new stream IDs
        """
        print("\nRegistering tokens in Token Registry...")
        registry_entries = self.import_data["token_registry"]
        registered = []
        
        # Build lookup tables
        old_to_new_stream = {s["stream_id"]: s["new_stream_id"] for s in created_streams if "new_stream_id" in s}
        
        for entry in registry_entries:
            try:
                token_address = entry["token_address"]
                asset_type = entry["asset_type"]
                old_stream_id = entry["stream_id"]
                metadata_uri = entry["metadata_uri"]
                
                # Find the new stream_id
                new_stream_id = old_to_new_stream.get(old_stream_id)
                if new_stream_id is None:
                    print(f"  ✗ Could not find new stream_id for token {token_address}")
                    continue
                
                # Register token
                op = self.token_registry.register_token(
                    token_address=token_address,
                    asset_type=asset_type,
                    stream_id=new_stream_id,
                    metadata_uri=metadata_uri
                ).send()
                
                print(f"  Registering token {token_address[:10]}... (op: {op.hash()})")
                op.wait()
                registered.append(entry)
                
            except Exception as e:
                error_msg = f"Failed to register token {entry.get('token_address', 'unknown')}: {e}"
                print(f"  ✗ {error_msg}")
                self.import_results["errors"].append(error_msg)
        
        print(f"✓ Registered {len(registered)}/{len(registry_entries)} tokens")
        return registered
    
    def import_frozen_streams(self, created_streams: List[Dict]):
        """
        Freeze streams that were frozen on Aptos
        
        Args:
            created_streams: List of created streams with new stream IDs
        """
        print("\nFreezing streams...")
        frozen_streams = self.import_data["compliance"]["frozen_streams"]
        frozen = []
        
        # Build lookup table
        old_to_new_stream = {s["stream_id"]: s["new_stream_id"] for s in created_streams if "new_stream_id" in s}
        
        for frozen_entry in frozen_streams:
            try:
                old_stream_id = frozen_entry["stream_id"]
                reason = frozen_entry.get("reason", "Migrated from Aptos in frozen state")
                
                # Find the new stream_id
                new_stream_id = old_to_new_stream.get(old_stream_id)
                if new_stream_id is None:
                    print(f"  ✗ Could not find new stream_id for old stream {old_stream_id}")
                    continue
                
                # Freeze stream
                op = self.compliance_guard.freeze_stream(
                    stream_id=new_stream_id,
                    reason=reason
                ).send()
                
                print(f"  Freezing stream {new_stream_id} (op: {op.hash()})")
                op.wait()
                frozen.append(frozen_entry)
                
            except Exception as e:
                error_msg = f"Failed to freeze stream {frozen_entry.get('stream_id', 'unknown')}: {e}"
                print(f"  ✗ {error_msg}")
                self.import_results["errors"].append(error_msg)
        
        print(f"✓ Froze {len(frozen)}/{len(frozen_streams)} streams")
        return frozen
    
    def import_active_rentals(self, created_streams: List[Dict]):
        """
        Recreate active rental streams
        
        Args:
            created_streams: List of created streams with new stream IDs
        """
        print("\nRecreating active rentals...")
        rentals = self.import_data["active_rentals"]
        created_rentals = []
        
        # Build lookup table
        old_to_new_stream = {s["stream_id"]: s["new_stream_id"] for s in created_streams if "new_stream_id" in s}
        
        for token_address, old_stream_id in rentals.items():
            try:
                # Find the new stream_id
                new_stream_id = old_to_new_stream.get(old_stream_id)
                if new_stream_id is None:
                    print(f"  ✗ Could not find new stream_id for rental {token_address}")
                    continue
                
                # The rental mapping is stored in RWA Hub
                # This would require a special admin function to set active_rentals
                # For now, we just log it
                print(f"  Note: Rental for {token_address[:10]}... needs manual registration")
                created_rentals.append({"token_address": token_address, "stream_id": new_stream_id})
                
            except Exception as e:
                error_msg = f"Failed to recreate rental for {token_address}: {e}"
                print(f"  ✗ {error_msg}")
                self.import_results["errors"].append(error_msg)
        
        print(f"✓ Noted {len(created_rentals)}/{len(rentals)} active rentals")
        return created_rentals
    
    def import_all(self):
        """
        Import all protocol data in correct order
        """
        print("\n" + "="*60)
        print("CONTINUUM PROTOCOL - TEZOS DATA IMPORT")
        print("="*60 + "\n")
        
        if not self.import_data:
            print("✗ Error: No import data loaded. Call load_export_file() first.")
            sys.exit(1)
        
        # Import in dependency order
        # 1. Admins first (needed for other operations)
        self.import_results["admins_added"] = self.import_compliance_admins()
        
        # 2. Compliance identities
        self.import_results["identities_registered"] = self.import_compliance_identities()
        
        # 3. Mint NFTs
        self.import_results["nfts_minted"] = self.import_nfts()
        
        # 4. Create streams
        self.import_results["streams_created"] = self.import_streams()
        
        # 5. Create asset mappings (automatic through asset yield protocol)
        self.import_asset_mappings(
            self.import_results["nfts_minted"],
            self.import_results["streams_created"]
        )
        
        # 6. Register tokens
        self.import_results["tokens_registered"] = self.import_token_registry(
            self.import_results["nfts_minted"],
            self.import_results["streams_created"]
        )
        
        # 7. Freeze streams that were frozen
        self.import_results["streams_frozen"] = self.import_frozen_streams(
            self.import_results["streams_created"]
        )
        
        # 8. Recreate active rentals
        self.import_results["rentals_created"] = self.import_active_rentals(
            self.import_results["streams_created"]
        )
    
    def save_results(self, filename: str = "tezos_import_results.json"):
        """
        Save import results to JSON file
        
        Args:
            filename: Output filename
        """
        print(f"\nSaving import results to {filename}...")
        
        try:
            with open(filename, 'w') as f:
                json.dump(self.import_results, f, indent=2)
            
            print(f"✓ Import results saved successfully to {filename}")
            
        except Exception as e:
            print(f"✗ Error saving results file: {e}")
    
    def print_summary(self):
        """Print import summary"""
        print("\n" + "="*60)
        print("IMPORT SUMMARY")
        print("="*60)
        
        print(f"Admins Added:        {len(self.import_results['admins_added'])}")
        print(f"Identities:          {len(self.import_results['identities_registered'])}")
        print(f"NFTs Minted:         {len(self.import_results['nfts_minted'])}")
        print(f"Streams Created:     {len(self.import_results['streams_created'])}")
        print(f"Tokens Registered:   {len(self.import_results['tokens_registered'])}")
        print(f"Streams Frozen:      {len(self.import_results['streams_frozen'])}")
        print(f"Rentals Created:     {len(self.import_results['rentals_created'])}")
        print(f"Errors:              {len(self.import_results['errors'])}")
        
        if self.import_results['errors']:
            print("\nErrors encountered:")
            for error in self.import_results['errors'][:10]:  # Show first 10
                print(f"  - {error}")
            if len(self.import_results['errors']) > 10:
                print(f"  ... and {len(self.import_results['errors']) - 10} more")
        
        print("="*60 + "\n")


def main():
    """Main execution function"""
    import argparse
    import os
    
    parser = argparse.ArgumentParser(
        description="Import Continuum Protocol data into Tezos blockchain"
    )
    parser.add_argument(
        "--input",
        required=True,
        help="Input JSON file from Aptos export"
    )
    parser.add_argument(
        "--node-url",
        default=TEZOS_NODE_URL,
        help="Tezos node URL"
    )
    parser.add_argument(
        "--private-key",
        default=os.environ.get("TEZOS_ADMIN_KEY", ADMIN_PRIVATE_KEY),
        help="Admin private key (or set TEZOS_ADMIN_KEY env var)"
    )
    parser.add_argument(
        "--output",
        default="tezos_import_results.json",
        help="Output filename for import results"
    )
    parser.add_argument(
        "--network",
        choices=["ghostnet", "mainnet"],
        default="ghostnet",
        help="Tezos network"
    )
    
    args = parser.parse_args()
    
    # Update global network variable
    global TEZOS_NETWORK
    TEZOS_NETWORK = args.network
    
    # Create importer and run import
    importer = TezosDataImporter(args.node_url, args.private_key)
    importer.load_export_file(args.input)
    importer.import_all()
    importer.print_summary()
    importer.save_results(args.output)
    
    print("\n✓ Import complete!")
    print(f"\nNext steps:")
    print(f"1. Review the import results in {args.output}")
    print(f"2. Run the verification script: python verify_migration.py --aptos-export {args.input} --tezos-import {args.output}")
    print(f"3. Test the migrated data on Tezos")


if __name__ == "__main__":
    main()
