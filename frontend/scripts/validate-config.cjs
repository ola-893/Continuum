#!/usr/bin/env node

/**
 * Configuration Validation Script
 * 
 * Validates environment configuration before build or deployment.
 * Checks for missing contract addresses, invalid formats, and network consistency.
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Contract address regex (Tezos KT1 addresses)
const CONTRACT_ADDRESS_REGEX = /^KT1[a-zA-Z0-9]{33}$/;

// Required contract variables
const REQUIRED_CONTRACTS = [
  'STREAMING_PROTOCOL',
  'ASSET_YIELD_PROTOCOL',
  'COMPLIANCE_GUARD',
  'TOKEN_REGISTRY',
  'RWA_HUB',
  'FA2_TOKEN',
];

/**
 * Load environment file
 */
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    
    content.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        return;
      }
      
      // Parse KEY=VALUE
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        env[key] = value;
      }
    });
    
    return env;
  } catch (error) {
    return null;
  }
}

/**
 * Validate contract address format
 */
function isValidContractAddress(address) {
  if (!address || address === '') {
    return false;
  }
  return CONTRACT_ADDRESS_REGEX.test(address);
}

/**
 * Validate network configuration
 */
function validateNetwork(env, network) {
  const errors = [];
  const warnings = [];
  const prefix = `VITE_${network.toUpperCase()}`;
  
  console.log(`\n${colors.cyan}Validating ${network} configuration...${colors.reset}`);
  
  // Check network variable
  const networkVar = env['VITE_TEZOS_NETWORK'];
  if (networkVar && networkVar !== 'ghostnet' && networkVar !== 'mainnet') {
    errors.push(`Invalid VITE_TEZOS_NETWORK value: ${networkVar}`);
  }
  
  // Check each required contract
  REQUIRED_CONTRACTS.forEach(contract => {
    const varName = `${prefix}_${contract}`;
    const address = env[varName];
    
    if (!address || address === '') {
      warnings.push(`Missing ${varName}`);
    } else if (!isValidContractAddress(address)) {
      errors.push(`Invalid address format for ${varName}: ${address}`);
    } else {
      console.log(`  ${colors.green}✓${colors.reset} ${varName}: ${address}`);
    }
  });
  
  // Check RPC endpoint
  const rpcVar = `${prefix}_RPC`;
  const rpcEndpoint = env[rpcVar];
  if (rpcEndpoint && !rpcEndpoint.startsWith('http')) {
    errors.push(`Invalid RPC endpoint for ${rpcVar}: ${rpcEndpoint}`);
  }
  
  return { errors, warnings };
}

/**
 * Main validation function
 */
function validateConfiguration(envFile) {
  console.log(`${colors.blue}==================================${colors.reset}`);
  console.log(`${colors.blue}Configuration Validation${colors.reset}`);
  console.log(`${colors.blue}==================================${colors.reset}`);
  console.log(`\nValidating: ${envFile}`);
  
  // Load environment file
  const env = loadEnvFile(envFile);
  if (!env) {
    console.error(`${colors.red}✗ Failed to load ${envFile}${colors.reset}`);
    process.exit(1);
  }
  
  console.log(`${colors.green}✓ Environment file loaded${colors.reset}`);
  
  // Determine which network to validate
  const network = env['VITE_TEZOS_NETWORK'] || 'ghostnet';
  console.log(`\nTarget network: ${colors.cyan}${network}${colors.reset}`);
  
  // Validate network configuration
  const { errors, warnings } = validateNetwork(env, network);
  
  // Display results
  console.log(`\n${colors.blue}==================================${colors.reset}`);
  console.log(`${colors.blue}Validation Results${colors.reset}`);
  console.log(`${colors.blue}==================================${colors.reset}`);
  
  if (errors.length > 0) {
    console.log(`\n${colors.red}Errors (${errors.length}):${colors.reset}`);
    errors.forEach(error => {
      console.log(`  ${colors.red}✗${colors.reset} ${error}`);
    });
  }
  
  if (warnings.length > 0) {
    console.log(`\n${colors.yellow}Warnings (${warnings.length}):${colors.reset}`);
    warnings.forEach(warning => {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${warning}`);
    });
  }
  
  if (errors.length === 0 && warnings.length === 0) {
    console.log(`\n${colors.green}✓ All checks passed!${colors.reset}`);
    return true;
  } else if (errors.length === 0) {
    console.log(`\n${colors.yellow}⚠ Validation passed with warnings${colors.reset}`);
    return true;
  } else {
    console.log(`\n${colors.red}✗ Validation failed${colors.reset}`);
    return false;
  }
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);
  const envFile = args[0] || '.env';
  const envPath = path.resolve(process.cwd(), envFile);
  
  if (!fs.existsSync(envPath)) {
    console.error(`${colors.red}✗ Environment file not found: ${envPath}${colors.reset}`);
    console.log(`\nCreate it by copying .env.example:`);
    console.log(`  cp .env.example ${envFile}`);
    process.exit(1);
  }
  
  const success = validateConfiguration(envPath);
  process.exit(success ? 0 : 1);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { validateConfiguration, isValidContractAddress };
