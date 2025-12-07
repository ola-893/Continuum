// backend/src/config.ts
// Configuration validation and management for BitAgent and Unibase integrations

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export interface BitAgentConfig {
  apiKey: string;
  network: 'bnb-testnet' | 'bnb-mainnet';
  rpcUrl?: string;
}

export interface UnibaseConfig {
  apiKey?: string;
  network?: string;
}

export interface AIPAgentConfig {
  pythonServiceUrl: string;  // URL of Python microservice
  timeout: number;           // Request timeout in ms
  maxRetries: number;        // Max retry attempts
}

export interface AppConfig {
  bitAgent: BitAgentConfig;
  unibase: UnibaseConfig;
  aipAgent: AIPAgentConfig;
  port: number;
}

/**
 * Validates that all required environment variables are present
 * Throws descriptive errors for missing configuration
 */
export function validateConfig(): AppConfig {
  const errors: string[] = [];

  // Validate BitAgent configuration
  const bitAgentApiKey = process.env.BITAGENT_API_KEY;
  if (!bitAgentApiKey) {
    errors.push('BITAGENT_API_KEY is required. Please set it in your .env file.');
  }

  const bitAgentNetwork = process.env.BITAGENT_NETWORK;
  if (!bitAgentNetwork) {
    errors.push('BITAGENT_NETWORK is required. Please set it to "bnb-testnet" or "bnb-mainnet" in your .env file.');
  } else if (bitAgentNetwork !== 'bnb-testnet' && bitAgentNetwork !== 'bnb-mainnet') {
    errors.push('BITAGENT_NETWORK must be either "bnb-testnet" or "bnb-mainnet".');
  }

  // Validate AIP Agent configuration
  const pythonServiceUrl = process.env.PYTHON_SERVICE_URL;
  if (!pythonServiceUrl) {
    errors.push('PYTHON_SERVICE_URL is required. Please set it in your .env file (e.g., http://localhost:5000).');
  } else {
    // Validate URL format
    try {
      const url = new URL(pythonServiceUrl);
      if (!url.protocol.startsWith('http')) {
        errors.push('PYTHON_SERVICE_URL must use http or https protocol.');
      }
    } catch (e) {
      errors.push('PYTHON_SERVICE_URL must be a valid URL (e.g., http://localhost:5000).');
    }
  }

  // Throw all errors at once for better developer experience
  if (errors.length > 0) {
    throw new Error(
      'Configuration validation failed:\n' +
      errors.map(err => `  - ${err}`).join('\n')
    );
  }

  // Build configuration object
  const config: AppConfig = {
    bitAgent: {
      apiKey: bitAgentApiKey!,
      network: bitAgentNetwork as 'bnb-testnet' | 'bnb-mainnet',
      rpcUrl: process.env.BSC_TESTNET_RPC_URL,
    },
    unibase: {
      apiKey: process.env.UNIBASE_API_KEY,
      network: process.env.UNIBASE_NETWORK,
    },
    aipAgent: {
      pythonServiceUrl: pythonServiceUrl!,
      timeout: parseInt(process.env.AIP_TIMEOUT || '30000', 10),
      maxRetries: parseInt(process.env.AIP_MAX_RETRIES || '3', 10),
    },
    port: parseInt(process.env.PORT || '3001', 10),
  };

  return config;
}

/**
 * Logs the current configuration (without sensitive data)
 */
export function logConfig(config: AppConfig): void {
  console.log('[Config] Application configuration:');
  console.log(`  - BitAgent Network: ${config.bitAgent.network}`);
  console.log(`  - BitAgent API Key: ${config.bitAgent.apiKey ? '***configured***' : 'NOT SET'}`);
  console.log(`  - Unibase API Key: ${config.unibase.apiKey ? '***configured***' : 'NOT SET'}`);
  console.log(`  - Python Service URL: ${maskUrl(config.aipAgent.pythonServiceUrl)}`);
  console.log(`  - AIP Timeout: ${config.aipAgent.timeout}ms`);
  console.log(`  - AIP Max Retries: ${config.aipAgent.maxRetries}`);
  console.log(`  - Port: ${config.port}`);
}

/**
 * Masks sensitive parts of a URL for logging
 * Example: http://user:pass@localhost:5000/path -> http://***:***@localhost:5000/***
 */
function maskUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    let masked = `${url.protocol}//${url.hostname}`;
    if (url.port) {
      masked += `:${url.port}`;
    }
    if (url.pathname && url.pathname !== '/') {
      masked += '/***';
    }
    return masked;
  } catch (e) {
    return '***invalid-url***';
  }
}

/**
 * Gets configuration with validation
 * This is the main function to use when initializing the application
 */
export function getConfig(): AppConfig {
  return validateConfig();
}
