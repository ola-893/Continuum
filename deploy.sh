#!/bin/bash

# Your Account
ACCOUNT="0x3d736659c9bd22dc89c1ef88c04becd804b372396975571559225f1e8c78d49b"
PROFILE="continuum-admin"
MAX_GAS="150000"

echo "================================"
echo "🚀 Continuum Protocol Deployment"
echo "================================"
echo "Target Address: $ACCOUNT"
echo "Using Profile:  $PROFILE"
echo ""

# Double check balance just to be safe (prints to console)
aptos account list --profile $PROFILE

echo ""
echo "📦 Publishing contract (Max Gas $MAX_GAS)..."
# FIX APPLIED: Ensure NO spaces are after the backslash (\) for line continuation
aptos move publish \
  --profile $PROFILE \
  --named-addresses continuum=$ACCOUNT \
  --max-gas $MAX_GAS \
  --assume-yes

echo ""
echo "👤 Setting up admin (Step 1)..."
# FIX APPLIED: Ensure NO spaces are after the backslash (\)
aptos move run \
  --profile $PROFILE \
  --function-id $ACCOUNT::rwa_hub::quick_setup_with_admin \
  --type-args 0x1::aptos_coin::AptosCoin \
  --args string:US u8:1 u64:9999999999 \
  --max-gas $MAX_GAS \
  --assume-yes

echo ""
echo "⚙️  Initializing ecosystem (Step 2)..."
# FIX APPLIED: Ensure NO spaces are after the backslash (\)
aptos move run \
  --profile $PROFILE \
  --function-id $ACCOUNT::rwa_hub::initialize_rwa_ecosystem \
  --type-args 0x1::aptos_coin::AptosCoin \
  --max-gas $MAX_GAS \
  --assume-yes

echo ""
echo "📝 Initializing token registry..."
# FIX APPLIED: Ensure NO spaces are after the backslash (\)
aptos move run \
  --profile $PROFILE \
  --function-id $ACCOUNT::token_registry::initialize \
  --max-gas $MAX_GAS \
  --assume-yes

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "Address: $ACCOUNT"