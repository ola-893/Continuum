#!/bin/bash

# ==============================================================================
# CONTINUUM RWA PROTOCOL - DEPLOYMENT & USER FLOW SCRIPT
# ==============================================================================

# 1. CONFIGURATION
# ------------------------------------------------------------------------------
PROFILE="default"          # The Aptos CLI profile to use (usually 'default')
NAMED_ADDRESS="aptos_rwa"  # The named address in Move.toml
PACKAGE_DIR="."            # Directory containing Move.toml

# REPLACE THIS WITH YOUR OWN ADDRESS AFTER INITIALIZING PROFILE
# Run: aptos init --profile default
DEPLOYER_ADDR=$(aptos account lookup-address --profile $PROFILE)

# REPLACE THIS WITH A REAL NFT OBJECT ADDRESS YOU OWN
# If you don't have one, create a collection via CLI or GUI and paste the address here.
# The protocol NEEDS an Asset Object to attach the stream to.
ASSET_TOKEN_ADDR="0x1234567890123456789012345678901234567890123456789012345678901234" 

# Constants
COIN_TYPE="0x1::aptos_coin::AptosCoin"
ONE_APT=100000000 # 1 APT (8 decimals)
DURATION=2592000  # 30 Days in seconds
ASSET_TYPE_REAL_ESTATE=1

echo "Starting Continuum Deployment Sequence..."
echo "   Deployer: $DEPLOYER_ADDR"
echo "   Asset Target: $ASSET_TOKEN_ADDR"
echo "----------------------------------------------------------------"

# 2. PUBLISH MODULES
# ------------------------------------------------------------------------------
echo "Step 1: Compiling and Publishing Smart Contracts..."

aptos move publish \
  --named-addresses $NAMED_ADDRESS=$DEPLOYER_ADDR \
  --profile $PROFILE \
  --assume-yes

echo "Contracts Published."
echo "----------------------------------------------------------------"

# 3. INITIALIZE ECOSYSTEM
# ------------------------------------------------------------------------------
echo "Step 2: Initializing RWA Ecosystem (Stream, Yield, Compliance)..."
# Calls rwa_hub::initialize_rwa_ecosystem
# This creates the resource accounts for StreamRegistry, AssetYieldRegistry, etc.

aptos move run \
  --function-id $DEPLOYER_ADDR::rwa_hub::initialize_rwa_ecosystem \
  --type-args $COIN_TYPE \
  --profile $PROFILE \
  --assume-yes

echo "Ecosystem Initialized."
echo "----------------------------------------------------------------"

# 4. COMPLIANCE SETUP (KYC & Whitelisting)
# ------------------------------------------------------------------------------
echo "Step 3: Setting up Compliance (KYC & Whitelist)..."

# A. Register Identity (KYC) for the Deployer (simulating the Investor/Owner)
# Arguments: user, is_kyc_verified, jurisdiction(bytes), level, expiry
# We use hex string for "US" jurisdiction (0x5553)
aptos move run \
  --function-id $DEPLOYER_ADDR::compliance_guard::register_identity \
  --args address:$DEPLOYER_ADDR bool:true string:US u8:1 u64:1999999999 \
  --profile $PROFILE \
  --assume-yes

# B. Whitelist the Deployer for Real Estate (Asset Type 1)
# Arguments: compliance_addr, user, asset_types (vector<u8>)
# Note: The registry lives at DEPLOYER_ADDR
aptos move run \
  --function-id $DEPLOYER_ADDR::compliance_guard::whitelist_address \
  --args address:$DEPLOYER_ADDR address:$DEPLOYER_ADDR "hex:[01]" \
  --profile $PROFILE \
  --assume-yes

echo "User KYC'd and Whitelisted."
echo "----------------------------------------------------------------"

# 5. CREATE RWA STREAM (The "Issuer" Flow)
# ------------------------------------------------------------------------------
echo "Step 4: Creating Asset-Bound Stream..."
echo "   Streaming 10 APT to Asset: $ASSET_TOKEN_ADDR"

# Arguments: 
# 1. issuer (signer)
# 2. stream_registry_addr
# 3. yield_registry_addr
# 4. compliance_addr
# 5. token_obj_addr (The NFT)
# 6. total_yield (10 APT)
# 7. duration (30 Days)

aptos move run \
  --function-id $DEPLOYER_ADDR::rwa_hub::create_real_estate_stream \
  --type-args $COIN_TYPE \
  --args \
      address:$DEPLOYER_ADDR \
      address:$DEPLOYER_ADDR \
      address:$DEPLOYER_ADDR \
      address:$ASSET_TOKEN_ADDR \
      u64:1000000000 \
      u64:$DURATION \
  --profile $PROFILE \
  --assume-yes

echo "Stream Active! Funds are now flowing to the Asset Object."
echo "----------------------------------------------------------------"

# 6. CLAIM YIELD (The "Investor" Flow)
# ------------------------------------------------------------------------------
echo "Step 5: Claiming Yield..."
echo "   Verifying ownership of $ASSET_TOKEN_ADDR..."

# Note: This will only work if the PROFILE account actually OWNS the ASSET_TOKEN_ADDR.
# If the asset is owned by a different wallet, you must switch profiles.

aptos move run \
  --function-id $DEPLOYER_ADDR::rwa_hub::compliant_claim_yield \
  --type-args $COIN_TYPE \
  --args \
      address:$DEPLOYER_ADDR \
      address:$DEPLOYER_ADDR \
      address:$DEPLOYER_ADDR \
      address:$ASSET_TOKEN_ADDR \
      u8:$ASSET_TYPE_REAL_ESTATE \
  --profile $PROFILE \
  --assume-yes

echo "Yield Claimed Successfully."
echo "----------------------------------------------------------------"

# 7. FLASH ADVANCE (The "Innovation" Flow)
# ------------------------------------------------------------------------------
echo "Step 6: Requesting Flash Advance (Time Travel Loan)..."
echo "   Requesting 0.5 APT advance from future earnings."

aptos move run \
  --function-id $DEPLOYER_ADDR::rwa_hub::compliant_flash_advance \
  --type-args $COIN_TYPE \
  --args \
      address:$DEPLOYER_ADDR \
      address:$DEPLOYER_ADDR \
      address:$DEPLOYER_ADDR \
      address:$ASSET_TOKEN_ADDR \
      u64:50000000 \
      u8:$ASSET_TYPE_REAL_ESTATE \
  --profile $PROFILE \
  --assume-yes

echo "Flash Advance Executed. Future yield intercepted."
echo "----------------------------------------------------------------"
echo "Continuum Flow Complete."