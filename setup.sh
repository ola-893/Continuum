#!/bin/bash

# Continuum Protocol - Tezos Migration Setup Script
# This script automates the setup of the development environment

set -e  # Exit on error

echo "=========================================="
echo "Continuum Protocol - Tezos Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo "Step 1: Checking prerequisites..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    print_info "Please install Node.js v18 or higher from https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm is installed: $NPM_VERSION"
else
    print_error "npm is not installed"
    exit 1
fi

# Check Python
if command_exists python3; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python is installed: $PYTHON_VERSION"
else
    print_error "Python 3 is not installed"
    print_info "Please install Python 3.8 or higher"
    exit 1
fi

echo ""
echo "Step 2: Installing SmartPy CLI..."
echo ""

# Check if SmartPy is already installed
if [ -d "$HOME/smartpy-cli" ]; then
    print_info "SmartPy CLI already installed at ~/smartpy-cli"
    print_info "To reinstall, remove ~/smartpy-cli and run this script again"
else
    print_info "Downloading and installing SmartPy CLI..."
    bash <(curl -s https://smartpy.io/cli/install.sh)
    
    if [ -f "$HOME/smartpy-cli/SmartPy.sh" ]; then
        print_success "SmartPy CLI installed successfully"
    else
        print_error "SmartPy CLI installation failed"
        exit 1
    fi
fi

echo ""
echo "Step 3: Installing frontend dependencies..."
echo ""

cd frontend

if [ -f "package.json" ]; then
    print_info "Installing npm packages (this may take a few minutes)..."
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Frontend dependencies installed successfully"
    else
        print_error "Failed to install frontend dependencies"
        exit 1
    fi
else
    print_error "package.json not found in frontend directory"
    exit 1
fi

cd ..

echo ""
echo "Step 4: Setting up environment variables..."
echo ""

if [ ! -f "frontend/.env" ]; then
    cp frontend/.env.example frontend/.env
    print_success "Created frontend/.env from .env.example"
    print_info "Edit frontend/.env to configure your network settings"
else
    print_info "frontend/.env already exists, skipping"
fi

echo ""
echo "Step 5: Verifying installation..."
echo ""

# Verify SmartPy
if [ -f "$HOME/smartpy-cli/SmartPy.sh" ]; then
    SMARTPY_VERSION=$($HOME/smartpy-cli/SmartPy.sh --version 2>&1 | head -n 1)
    print_success "SmartPy CLI: $SMARTPY_VERSION"
else
    print_error "SmartPy CLI verification failed"
fi

# Verify Taquito installation
cd frontend
if npm list @taquito/taquito >/dev/null 2>&1; then
    TAQUITO_VERSION=$(npm list @taquito/taquito --depth=0 2>/dev/null | grep @taquito/taquito | awk '{print $2}')
    print_success "Taquito installed: $TAQUITO_VERSION"
else
    print_error "Taquito not found in node_modules"
fi

# Verify Beacon SDK installation
if npm list @taquito/beacon-wallet >/dev/null 2>&1; then
    BEACON_VERSION=$(npm list @taquito/beacon-wallet --depth=0 2>/dev/null | grep @taquito/beacon-wallet | awk '{print $2}')
    print_success "Beacon SDK installed: $BEACON_VERSION"
else
    print_error "Beacon SDK not found in node_modules"
fi

cd ..

echo ""
echo "=========================================="
echo "Setup Complete! 🚀"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Get Ghostnet test tokens from: https://faucet.ghostnet.teztnets.xyz"
echo "2. Review the setup guide: cat SETUP_GUIDE.md"
echo "3. Start implementing contracts in tezos/contracts/"
echo "4. Run tests with: ~/smartpy-cli/SmartPy.sh test tests/test_*.py output/"
echo ""
echo "Useful commands:"
echo "  - Compile contracts: ~/smartpy-cli/SmartPy.sh compile contracts/<contract>.py output/"
echo "  - Run frontend dev server: cd frontend && npm run dev"
echo "  - Deploy to Ghostnet: ~/smartpy-cli/SmartPy.sh run scripts/deploy_ghostnet.py"
echo ""
print_success "Happy coding!"
