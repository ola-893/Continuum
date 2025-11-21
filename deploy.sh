#!/bin/bash

ACCOUNT="0x7c68c08ed30efcb9159b90c398247bf6504ab11678b39e58db12cae2360c9dc3"
MODULE="$ACCOUNT::aptos_rwa"

echo "================================"
echo "🚀 YieldStream Deployment"
echo "================================"
echo ""

echo "📦 Publishing contract..."
aptos move publish \
  --profile default \
  --named-addresses aptos_rwa=$ACCOUNT

echo ""
echo "⚙️  Initializing ecosystem..."
aptos move run \
  --profile default \
  --function-id $MODULE::rwa_hub::initialize_rwa_ecosystem \
  --type-args 0x1::aptos_coin::AptosCoin

echo ""
echo "👤 Setting up admin..."
aptos move run \
  --profile default \
  --function-id $MODULE::rwa_hub::quick_setup_with_admin \
  --type-args 0x1::aptos_coin::AptosCoin \
  --args 'vector<u8>:"US"' 'u8:1' 'u64:9999999999'

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo "Visit faucet: https://faucet.testnet.aptos.dev/?address=$ACCOUNT"
EOF