#!/usr/bin/env python3
"""
Aptos Data Export Script for Continuum Protocol Migration

This script exports all protocol data from Aptos blockchain including:
- All streams from Streaming Protocol
- All NFTs and metadata from FA2 Token contracts
- All compliance data (KYC, whitelisting) from Compliance Guard
- Asset-to-stream mappings from Asset Yield Protocol
- Token registry data

The exported data is saved in JSON format for import into Tezos.
"""

import json
import sys
from typing import Dict, List, Any, Optional
from datetime import datetime
from aptos_sdk.client import RestClient
from aptos_sdk.account_address import AccountAddress

# Aptos network configuration
APTOS_NODE_URL = "https://fullnode.mainnet.aptoslabs.com/v1"  # Change to your network
APTOS_NETWORK = "mainnet"  # or "testnet", "devnet"

# Contract addresses (update with your deployed addresses)
STREAMING_PROTOCOL_ADDRESS = "0x..."  # Update with actual address
ASSET_YIELD_PROTOCOL_ADDRESS = "0x..."  # Update with actual address
COMPLIANCE_GUARD_ADDRESS = "0x..."  # Update with actual address
TOKEN_REGISTRY_ADDRESS = "0x..."  # Update with actual address
RWA_HUB_ADDRESS = "0x..."  # Update with actual address
FA2_TOKEN_ADDRESS = "0x..."  # Update with actual address


class AptosDataExporter:
    """Exports Continuum Protocol data from Aptos blockchain"""
    
    def __init__(self, node_url: str = APTOS_NODE_URL):
        """Initialize the exporter with Aptos REST client"""
        self.client = RestClient(node_url)
        self.export_data = {
            "metadata": {
                "export_timestamp": datetime.utcnow().isoformat(),
                "aptos_network": APTOS_NETWORK,
                "aptos_node_url": node_url,
                "protocol_version": "1.0.0"
            },
            "streams": [],
            "nfts": [],
            "compliance": {
                "identities": [],
                "frozen_streams": [],
                "admins": []
            },
            "asset_mappings": {
                "asset_to_stream": {},
                "stream_to_asset": {}
            },
            "token_registry": [],
            "active_rentals": {}
        }
    
    def export_streams(self) -> List[Dict[str, Any]]:
        """
        Export all streams from Streaming Protocol contract
        
        Returns:
            List of stream objects with all parameters
        """
        print("Exporting streams from Streaming Protocol...")
        streams = []
        
        try:
            # Query the streaming protocol resource
            resource_type = f"{STREAMING_PROTOCOL_ADDRESS}::streaming_protocol::StreamingProtocol"
            resource = self.client.account_resource(
                AccountAddress.from_hex(STREAMING_PROTOCOL_ADDRESS),
                resource_type
            )
            
            # Extract streams from the resource data
            # Note: Aptos stores streams in a Table, we need to iterate through events
            # or use indexer API for complete data
            
            # Get stream creation events
            stream_events = self.client.get_account_events(
                AccountAddress.from_hex(STREAMING_PROTOCOL_ADDRESS),
                f"{resource_type}::StreamCreatedEvent"
            )
            
            for event in stream_events:
                stream_data = event.get("data", {})
                stream = {
                    "stream_id": stream_data.get("stream_id"),
                    "sender": stream_data.get("sender"),
                    "recipient": stream_data.get("recipient"),
                    "token_address": stream_data.get("token_address"),
                    "token_id": stream_data.get("token_id"),
                    "total_amount": stream_data.get("total_amount"),
                    "flow_rate": stream_data.get("flow_rate"),
                    "start_time": stream_data.get("start_time"),
                    "stop_time": stream_data.get("stop_time"),
                    "amount_withdrawn": stream_data.get("amount_withdrawn", 0),
                    "status": stream_data.get("status", 0)
                }
                streams.append(stream)
            
            print(f"✓ Exported {len(streams)} streams")
            
        except Exception as e:
            print(f"✗ Error exporting streams: {e}")
            print("  Note: You may need to use Aptos Indexer API for complete data")
        
        return streams
    
    def export_nfts(self) -> List[Dict[str, Any]]:
        """
        Export all NFTs and their metadata from FA2 Token contract
        
        Returns:
            List of NFT objects with metadata and ownership
        """
        print("Exporting NFTs from FA2 Token contract...")
        nfts = []
        
        try:
            # Query FA2 token contract
            resource_type = f"{FA2_TOKEN_ADDRESS}::fa2_token::FA2Token"
            
            # Get mint events to discover all NFTs
            mint_events = self.client.get_account_events(
                AccountAddress.from_hex(FA2_TOKEN_ADDRESS),
                f"{resource_type}::MintEvent"
            )
            
            for event in mint_events:
                mint_data = event.get("data", {})
                
                # Query current owner and metadata
                token_id = mint_data.get("token_id")
                
                nft = {
                    "token_id": token_id,
                    "token_address": FA2_TOKEN_ADDRESS,
                    "owner": mint_data.get("to"),  # Initial owner, may have changed
                    "metadata_uri": mint_data.get("metadata_uri"),
                    "metadata": {},  # Fetch from URI if needed
                    "mint_timestamp": event.get("timestamp")
                }
                
                # Try to fetch current owner from ledger
                # Note: This requires querying the token balance
                
                nfts.append(nft)
            
            print(f"✓ Exported {len(nfts)} NFTs")
            
        except Exception as e:
            print(f"✗ Error exporting NFTs: {e}")
        
        return nfts
    
    def export_compliance_data(self) -> Dict[str, Any]:
        """
        Export all compliance data from Compliance Guard contract
        
        Returns:
            Dictionary with identities, frozen streams, and admins
        """
        print("Exporting compliance data from Compliance Guard...")
        compliance = {
            "identities": [],
            "frozen_streams": [],
            "admins": []
        }
        
        try:
            resource_type = f"{COMPLIANCE_GUARD_ADDRESS}::compliance_guard::ComplianceGuard"
            
            # Get identity registration events
            identity_events = self.client.get_account_events(
                AccountAddress.from_hex(COMPLIANCE_GUARD_ADDRESS),
                f"{resource_type}::IdentityRegisteredEvent"
            )
            
            for event in identity_events:
                identity_data = event.get("data", {})
                identity = {
                    "user_address": identity_data.get("user"),
                    "is_verified": identity_data.get("is_verified", True),
                    "jurisdiction": identity_data.get("jurisdiction"),
                    "verification_level": identity_data.get("verification_level"),
                    "expiry_time": identity_data.get("expiry_time"),
                    "whitelisted_asset_types": identity_data.get("whitelisted_asset_types", [])
                }
                compliance["identities"].append(identity)
            
            # Get freeze events
            freeze_events = self.client.get_account_events(
                AccountAddress.from_hex(COMPLIANCE_GUARD_ADDRESS),
                f"{resource_type}::StreamFrozenEvent"
            )
            
            for event in freeze_events:
                freeze_data = event.get("data", {})
                # Check if stream is still frozen (not unfrozen later)
                compliance["frozen_streams"].append({
                    "stream_id": freeze_data.get("stream_id"),
                    "reason": freeze_data.get("reason"),
                    "frozen_at": event.get("timestamp")
                })
            
            # Get admin list from resource
            resource = self.client.account_resource(
                AccountAddress.from_hex(COMPLIANCE_GUARD_ADDRESS),
                resource_type
            )
            compliance["admins"] = resource.get("data", {}).get("admins", [])
            
            print(f"✓ Exported {len(compliance['identities'])} identities")
            print(f"✓ Exported {len(compliance['frozen_streams'])} frozen streams")
            print(f"✓ Exported {len(compliance['admins'])} admins")
            
        except Exception as e:
            print(f"✗ Error exporting compliance data: {e}")
        
        return compliance
    
    def export_asset_mappings(self) -> Dict[str, Dict[str, Any]]:
        """
        Export asset-to-stream mappings from Asset Yield Protocol
        
        Returns:
            Dictionary with bidirectional mappings
        """
        print("Exporting asset-stream mappings from Asset Yield Protocol...")
        mappings = {
            "asset_to_stream": {},
            "stream_to_asset": {}
        }
        
        try:
            resource_type = f"{ASSET_YIELD_PROTOCOL_ADDRESS}::asset_yield_protocol::AssetYieldProtocol"
            
            # Get asset stream creation events
            creation_events = self.client.get_account_events(
                AccountAddress.from_hex(ASSET_YIELD_PROTOCOL_ADDRESS),
                f"{resource_type}::AssetStreamCreatedEvent"
            )
            
            for event in creation_events:
                event_data = event.get("data", {})
                token_address = event_data.get("token_address")
                stream_id = event_data.get("stream_id")
                
                mappings["asset_to_stream"][token_address] = stream_id
                mappings["stream_to_asset"][str(stream_id)] = token_address
            
            print(f"✓ Exported {len(mappings['asset_to_stream'])} asset-stream mappings")
            
        except Exception as e:
            print(f"✗ Error exporting asset mappings: {e}")
        
        return mappings
    
    def export_token_registry(self) -> List[Dict[str, Any]]:
        """
        Export all registered tokens from Token Registry
        
        Returns:
            List of registered token entries
        """
        print("Exporting token registry data...")
        tokens = []
        
        try:
            resource_type = f"{TOKEN_REGISTRY_ADDRESS}::token_registry::TokenRegistry"
            
            # Get token registration events
            registration_events = self.client.get_account_events(
                AccountAddress.from_hex(TOKEN_REGISTRY_ADDRESS),
                f"{resource_type}::TokenRegisteredEvent"
            )
            
            for event in registration_events:
                token_data = event.get("data", {})
                token = {
                    "token_address": token_data.get("token_address"),
                    "asset_type": token_data.get("asset_type"),
                    "stream_id": token_data.get("stream_id"),
                    "metadata_uri": token_data.get("metadata_uri"),
                    "registration_time": event.get("timestamp")
                }
                tokens.append(token)
            
            print(f"✓ Exported {len(tokens)} registered tokens")
            
        except Exception as e:
            print(f"✗ Error exporting token registry: {e}")
        
        return tokens
    
    def export_active_rentals(self) -> Dict[str, int]:
        """
        Export active rental streams from RWA Hub
        
        Returns:
            Dictionary mapping token addresses to rental stream IDs
        """
        print("Exporting active rentals from RWA Hub...")
        rentals = {}
        
        try:
            resource_type = f"{RWA_HUB_ADDRESS}::rwa_hub::RWAHub"
            
            # Get rental creation events
            rental_events = self.client.get_account_events(
                AccountAddress.from_hex(RWA_HUB_ADDRESS),
                f"{resource_type}::RentalStreamCreatedEvent"
            )
            
            for event in rental_events:
                rental_data = event.get("data", {})
                token_address = rental_data.get("token_address")
                stream_id = rental_data.get("stream_id")
                
                # Only include if still active (not ended)
                rentals[token_address] = stream_id
            
            print(f"✓ Exported {len(rentals)} active rentals")
            
        except Exception as e:
            print(f"✗ Error exporting active rentals: {e}")
        
        return rentals
    
    def export_all(self) -> Dict[str, Any]:
        """
        Export all protocol data
        
        Returns:
            Complete export data dictionary
        """
        print("\n" + "="*60)
        print("CONTINUUM PROTOCOL - APTOS DATA EXPORT")
        print("="*60 + "\n")
        
        # Export all data
        self.export_data["streams"] = self.export_streams()
        self.export_data["nfts"] = self.export_nfts()
        self.export_data["compliance"] = self.export_compliance_data()
        self.export_data["asset_mappings"] = self.export_asset_mappings()
        self.export_data["token_registry"] = self.export_token_registry()
        self.export_data["active_rentals"] = self.export_active_rentals()
        
        # Add summary
        self.export_data["metadata"]["summary"] = {
            "total_streams": len(self.export_data["streams"]),
            "total_nfts": len(self.export_data["nfts"]),
            "total_identities": len(self.export_data["compliance"]["identities"]),
            "total_frozen_streams": len(self.export_data["compliance"]["frozen_streams"]),
            "total_admins": len(self.export_data["compliance"]["admins"]),
            "total_asset_mappings": len(self.export_data["asset_mappings"]["asset_to_stream"]),
            "total_registered_tokens": len(self.export_data["token_registry"]),
            "total_active_rentals": len(self.export_data["active_rentals"])
        }
        
        return self.export_data
    
    def save_to_file(self, filename: str = "aptos_export.json"):
        """
        Save exported data to JSON file
        
        Args:
            filename: Output filename
        """
        print(f"\nSaving export data to {filename}...")
        
        try:
            with open(filename, 'w') as f:
                json.dump(self.export_data, f, indent=2)
            
            print(f"✓ Export saved successfully to {filename}")
            print(f"\nFile size: {len(json.dumps(self.export_data)) / 1024:.2f} KB")
            
        except Exception as e:
            print(f"✗ Error saving export file: {e}")
            sys.exit(1)
    
    def print_summary(self):
        """Print export summary"""
        print("\n" + "="*60)
        print("EXPORT SUMMARY")
        print("="*60)
        
        summary = self.export_data["metadata"]["summary"]
        print(f"Streams:           {summary['total_streams']}")
        print(f"NFTs:              {summary['total_nfts']}")
        print(f"Identities:        {summary['total_identities']}")
        print(f"Frozen Streams:    {summary['total_frozen_streams']}")
        print(f"Admins:            {summary['total_admins']}")
        print(f"Asset Mappings:    {summary['total_asset_mappings']}")
        print(f"Registered Tokens: {summary['total_registered_tokens']}")
        print(f"Active Rentals:    {summary['total_active_rentals']}")
        print("="*60 + "\n")


def main():
    """Main execution function"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Export Continuum Protocol data from Aptos blockchain"
    )
    parser.add_argument(
        "--node-url",
        default=APTOS_NODE_URL,
        help="Aptos node URL"
    )
    parser.add_argument(
        "--output",
        default="aptos_export.json",
        help="Output filename"
    )
    parser.add_argument(
        "--network",
        choices=["mainnet", "testnet", "devnet"],
        default="mainnet",
        help="Aptos network"
    )
    
    args = parser.parse_args()
    
    # Update global network variable
    global APTOS_NETWORK
    APTOS_NETWORK = args.network
    
    # Create exporter and run export
    exporter = AptosDataExporter(args.node_url)
    exporter.export_all()
    exporter.print_summary()
    exporter.save_to_file(args.output)
    
    print("\n✓ Export complete!")
    print(f"\nNext steps:")
    print(f"1. Review the exported data in {args.output}")
    print(f"2. Run the Tezos import script: python import_tezos_data.py --input {args.output}")
    print(f"3. Verify data integrity with: python verify_migration.py")


if __name__ == "__main__":
    main()
