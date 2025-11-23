#!/bin/bash

# Your Account
ACCOUNT="0xf630676ecb561cf2b2fadc1a34daa8a054d24f0e936439f2e63a90d2651b87ef"
PROFILE="continuum-v3"
MAX_GAS="150000"

echo "================================"
echo "Continuum Protocol Deployment"
echo "================================"
echo "Target Address: $ACCOUNT"
echo "Using Profile:  $PROFILE"
echo ""

# Double check balance just to be safe (prints to console)
aptos account list --profile $PROFILE

echo ""
echo "Publishing contract (Max Gas $MAX_GAS)..."
aptos move publish \
  --profile $PROFILE \
  --named-addresses continuum=$ACCOUNT \
  --max-gas $MAX_GAS \
  --assume-yes

echo ""
echo "Setting up Admin & Initializing Ecosystem..."
# This ONE function initializes streaming, yield, compliance, and registry!
aptos move run \
  --profile $PROFILE \
  --function-id $ACCOUNT::rwa_hub::quick_setup_with_admin \
  --type-args 0x1::aptos_coin::AptosCoin \
  --args string:US u8:1 u64:9999999999 \
  --max-gas $MAX_GAS \
  --assume-yes

echo ""
echo "DEPLOYMENT COMPLETE!"
echo "Address: $ACCOUNT"