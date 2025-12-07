// backend/src/__tests__/config.test.ts
// Property-based tests for configuration management

import * as fc from 'fast-check';
import { validateConfig } from '../config';

/**
 * Feature: bitagent-unibase-integration, Property 16: Environment variable usage
 * 
 * For any environment variable set for BitAgent or Unibase configuration,
 * the system should use that value in the respective client initialization
 * (verified by checking the client's config object).
 * 
 * Validates: Requirements 5.5
 */
describe('Property 16: Environment variable usage', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original environment after each test
    process.env = { ...originalEnv };
  });

  test('should use BITAGENT_API_KEY from environment in config', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 100 }), // Generate random API keys
        (apiKey) => {
          // Set environment variable
          process.env.BITAGENT_API_KEY = apiKey;
          process.env.BITAGENT_NETWORK = 'bnb-testnet';

          // Get configuration
          const config = validateConfig();

          // Verify the environment variable value is used in config
          return config.bitAgent.apiKey === apiKey;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use BITAGENT_NETWORK from environment in config', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('bnb-testnet', 'bnb-mainnet'), // Valid network values
        (network) => {
          // Set environment variables
          process.env.BITAGENT_API_KEY = 'test-api-key';
          process.env.BITAGENT_NETWORK = network;

          // Get configuration
          const config = validateConfig();

          // Verify the environment variable value is used in config
          return config.bitAgent.network === network;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use BSC_TESTNET_RPC_URL from environment in config when set', () => {
    fc.assert(
      fc.property(
        fc.webUrl(), // Generate random URLs
        (rpcUrl) => {
          // Set environment variables
          process.env.BITAGENT_API_KEY = 'test-api-key';
          process.env.BITAGENT_NETWORK = 'bnb-testnet';
          process.env.BSC_TESTNET_RPC_URL = rpcUrl;

          // Get configuration
          const config = validateConfig();

          // Verify the environment variable value is used in config
          return config.bitAgent.rpcUrl === rpcUrl;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use UNIBASE_API_KEY from environment in config when set', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }), // Optional API key
        (apiKey) => {
          // Set environment variables
          process.env.BITAGENT_API_KEY = 'test-api-key';
          process.env.BITAGENT_NETWORK = 'bnb-testnet';
          if (apiKey !== undefined) {
            process.env.UNIBASE_API_KEY = apiKey;
          } else {
            delete process.env.UNIBASE_API_KEY;
          }

          // Get configuration
          const config = validateConfig();

          // Verify the environment variable value is used in config
          return config.unibase.apiKey === apiKey;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use UNIBASE_NETWORK from environment in config when set', () => {
    fc.assert(
      fc.property(
        fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }), // Optional network
        (network) => {
          // Set environment variables
          process.env.BITAGENT_API_KEY = 'test-api-key';
          process.env.BITAGENT_NETWORK = 'bnb-testnet';
          if (network !== undefined) {
            process.env.UNIBASE_NETWORK = network;
          } else {
            delete process.env.UNIBASE_NETWORK;
          }

          // Get configuration
          const config = validateConfig();

          // Verify the environment variable value is used in config
          return config.unibase.network === network;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use PORT from environment in config when set', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1024, max: 65535 }), // Valid port range
        (port) => {
          // Set environment variables
          process.env.BITAGENT_API_KEY = 'test-api-key';
          process.env.BITAGENT_NETWORK = 'bnb-testnet';
          process.env.PORT = port.toString();

          // Get configuration
          const config = validateConfig();

          // Verify the environment variable value is used in config
          return config.port === port;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use default PORT 3001 when PORT environment variable is not set', () => {
    // Set required environment variables
    process.env.BITAGENT_API_KEY = 'test-api-key';
    process.env.BITAGENT_NETWORK = 'bnb-testnet';
    process.env.PYTHON_SERVICE_URL = 'http://localhost:5000';
    delete process.env.PORT;

    // Get configuration
    const config = validateConfig();

    // Verify default port is used
    expect(config.port).toBe(3001);
  });

  test('should use PYTHON_SERVICE_URL from environment in config', () => {
    fc.assert(
      fc.property(
        fc.webUrl({ validSchemes: ['http', 'https'] }), // Generate random HTTP URLs
        (pythonServiceUrl) => {
          // Set environment variables
          process.env.BITAGENT_API_KEY = 'test-api-key';
          process.env.BITAGENT_NETWORK = 'bnb-testnet';
          process.env.PYTHON_SERVICE_URL = pythonServiceUrl;

          // Get configuration
          const config = validateConfig();

          // Verify the environment variable value is used in config
          return config.aipAgent.pythonServiceUrl === pythonServiceUrl;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use AIP_TIMEOUT from environment in config when set', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1000, max: 120000 }), // Valid timeout range (1s to 2min)
        (timeout) => {
          // Set environment variables
          process.env.BITAGENT_API_KEY = 'test-api-key';
          process.env.BITAGENT_NETWORK = 'bnb-testnet';
          process.env.PYTHON_SERVICE_URL = 'http://localhost:5000';
          process.env.AIP_TIMEOUT = timeout.toString();

          // Get configuration
          const config = validateConfig();

          // Verify the environment variable value is used in config
          return config.aipAgent.timeout === timeout;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use default AIP_TIMEOUT 30000 when AIP_TIMEOUT environment variable is not set', () => {
    // Set required environment variables
    process.env.BITAGENT_API_KEY = 'test-api-key';
    process.env.BITAGENT_NETWORK = 'bnb-testnet';
    process.env.PYTHON_SERVICE_URL = 'http://localhost:5000';
    delete process.env.AIP_TIMEOUT;

    // Get configuration
    const config = validateConfig();

    // Verify default timeout is used
    expect(config.aipAgent.timeout).toBe(30000);
  });

  test('should use AIP_MAX_RETRIES from environment in config when set', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 10 }), // Valid retry range
        (maxRetries) => {
          // Set environment variables
          process.env.BITAGENT_API_KEY = 'test-api-key';
          process.env.BITAGENT_NETWORK = 'bnb-testnet';
          process.env.PYTHON_SERVICE_URL = 'http://localhost:5000';
          process.env.AIP_MAX_RETRIES = maxRetries.toString();

          // Get configuration
          const config = validateConfig();

          // Verify the environment variable value is used in config
          return config.aipAgent.maxRetries === maxRetries;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('should use default AIP_MAX_RETRIES 3 when AIP_MAX_RETRIES environment variable is not set', () => {
    // Set required environment variables
    process.env.BITAGENT_API_KEY = 'test-api-key';
    process.env.BITAGENT_NETWORK = 'bnb-testnet';
    process.env.PYTHON_SERVICE_URL = 'http://localhost:5000';
    delete process.env.AIP_MAX_RETRIES;

    // Get configuration
    const config = validateConfig();

    // Verify default max retries is used
    expect(config.aipAgent.maxRetries).toBe(3);
  });
});

describe('Configuration validation', () => {
  // Store original environment variables
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original environment after each test
    process.env = { ...originalEnv };
  });

  test('should throw error when PYTHON_SERVICE_URL is missing', () => {
    process.env.BITAGENT_API_KEY = 'test-api-key';
    process.env.BITAGENT_NETWORK = 'bnb-testnet';
    delete process.env.PYTHON_SERVICE_URL;

    expect(() => validateConfig()).toThrow('PYTHON_SERVICE_URL is required');
  });

  test('should throw error when PYTHON_SERVICE_URL is not a valid URL', () => {
    process.env.BITAGENT_API_KEY = 'test-api-key';
    process.env.BITAGENT_NETWORK = 'bnb-testnet';
    process.env.PYTHON_SERVICE_URL = 'not-a-valid-url';

    expect(() => validateConfig()).toThrow('PYTHON_SERVICE_URL must be a valid URL');
  });

  test('should throw error when PYTHON_SERVICE_URL does not use http or https protocol', () => {
    process.env.BITAGENT_API_KEY = 'test-api-key';
    process.env.BITAGENT_NETWORK = 'bnb-testnet';
    process.env.PYTHON_SERVICE_URL = 'ftp://localhost:5000';

    expect(() => validateConfig()).toThrow('PYTHON_SERVICE_URL must use http or https protocol');
  });
});
