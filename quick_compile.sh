#!/bin/bash

# Quick compile script - no frills, just works
echo "⚡ Quick Compile for Aptos RWA"
echo "=============================="

# Step 1: Update Move.toml with CORRECT dependencies
echo "📝 Updating Move.toml..."

ADDR=$(aptos config show-profiles --profile default 2>/dev/null | grep account | awk '{print $2}')

cat > Move.toml << EOF
[package]
name = "YieldStream"
version = "1.0.0"

[addresses]
aptos_rwa = "_"

[dependencies]
AptosFramework = { git = "https://github.com/aptos-labs/aptos-framework.git", subdir = "aptos-framework", rev = "mainnet" }

[dev-addresses]
aptos_rwa = "$ADDR"
EOF

echo "✅ Move.toml updated"

# Step 2: Clean
echo "🧹 Cleaning..."
rm -rf build/ .aptos/

# Step 3: Compile with skip flag (most reliable)
echo "📦 Compiling..."
aptos move compile \
  --named-addresses aptos_rwa=default \
  --skip-fetch-latest-git-deps

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! Compilation complete."
    echo ""
    echo "Next steps:"
    echo "  1. Test:   aptos move test --skip-fetch-latest-git-deps"
    echo "  2. Deploy: aptos move publish --named-addresses aptos_rwa=default --skip-fetch-latest-git-deps --assume-yes"
else
    echo ""
    echo "❌ Compilation failed."
    echo ""
    echo "Try these fixes:"
    echo "  1. Check internet: ping github.com"
    echo "  2. Run: ./fix_network_issues.sh"
    echo "  3. Or manually fix with:"
    echo "     git config --global url.\"https://\".insteadOf git://"
    echo "     rm -rf ~/.move"
    echo "     aptos move compile --named-addresses aptos_rwa=default --skip-fetch-latest-git-deps"
fi