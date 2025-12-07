// backend/src/__tests__/bitAgentService.test.ts
// Property-based tests for BitAgent service

import * as fc from 'fast-check';
import { bitAgentService } from '../bitAgentService';
import { AIPClient } from '../aip-sdk-wrapper';

/**
 * Feature: bitagent-unibase-integration, Property 1: Real API invocation
 * 
 * For any agent operation (launch, update, query), the system should invoke
 * real external API endpoints (BitAgent or Unibase) and never use mock
 * implementations or hardcoded responses.
 * 
 * Validates: Requirements 1.2, 4.4
 */
describe('Property 1: Real API invocation', () => {
  beforeEach(async () => {
    // Initialize the service with test configuration
    await bitAgentService.initialize({
      apiKey: 'test-api-key',
      network: 'bnb-testnet',
    });
  });

  test('launchAgent should invoke real API client methods', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // agent name
        fc.string({ minLength: 1, maxLength: 10 }), // agent ticker
        fc.string({ minLength: 10, maxLength: 100 }), // unibase ID
        async (name, ticker, unibaseId) => {
          // Spy on the AIPClient to verify real methods are called
          const launchAgentSpy = jest.spyOn(AIPClient.prototype, 'launchAgent');

          try {
            await bitAgentService.launchAgent(name, ticker, unibaseId);

            // Verify that the real API client method was called
            expect(launchAgentSpy).toHaveBeenCalled();
            
            // Verify it was called with the correct parameters
            const callArgs = launchAgentSpy.mock.calls[0][0];
            expect(callArgs.name).toBe(name);
            expect(callArgs.ticker).toBe(ticker);
            expect(callArgs.unibaseId).toBe(unibaseId);

            return true;
          } finally {
            launchAgentSpy.mockRestore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('getAgentDetails should invoke real API client methods', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }), // agent ID
        async (agentId) => {
          // Spy on the AIPClient to verify real methods are called
          const getDetailsSpy = jest.spyOn(AIPClient.prototype, 'getAgentDetails');

          try {
            await bitAgentService.getAgentDetails(agentId);

            // Verify that the real API client method was called
            expect(getDetailsSpy).toHaveBeenCalledWith(agentId);

            return true;
          } finally {
            getDetailsSpy.mockRestore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('getAgentStatus should invoke real API client methods', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }), // agent ID
        async (agentId) => {
          // Spy on the AIPClient to verify real methods are called
          const getStatusSpy = jest.spyOn(AIPClient.prototype, 'getAgentStatus');

          try {
            await bitAgentService.getAgentStatus(agentId);

            // Verify that the real API client method was called
            expect(getStatusSpy).toHaveBeenCalledWith(agentId);

            return true;
          } finally {
            getStatusSpy.mockRestore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  test('updateAgent should invoke real API client methods', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }), // agent ID
        fc.record({
          description: fc.option(fc.string({ minLength: 1, maxLength: 200 })),
          metadata: fc.option(fc.dictionary(fc.string(), fc.anything())),
        }), // updates
        async (agentId, updates) => {
          // Spy on the AIPClient to verify real methods are called
          const updateSpy = jest.spyOn(AIPClient.prototype, 'updateAgent');

          try {
            await bitAgentService.updateAgent(agentId, updates);

            // Verify that the real API client method was called
            expect(updateSpy).toHaveBeenCalledWith(agentId, updates);

            return true;
          } finally {
            updateSpy.mockRestore();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: bitagent-unibase-integration, Property 2: Valid agent identifier format
 * 
 * For any successful agent launch through BitAgent, the returned agent ID
 * should match the expected format (non-empty string, valid blockchain
 * address or transaction hash format).
 * 
 * Validates: Requirements 1.3
 */
describe('Property 2: Valid agent identifier format', () => {
  beforeEach(async () => {
    // Initialize the service with test configuration
    await bitAgentService.initialize({
      apiKey: 'test-api-key',
      network: 'bnb-testnet',
    });
  });

  test('launchAgent should return a valid non-empty agent ID', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // agent name
        fc.string({ minLength: 1, maxLength: 10 }), // agent ticker
        fc.string({ minLength: 10, maxLength: 100 }), // unibase ID
        async (name, ticker, unibaseId) => {
          const result = await bitAgentService.launchAgent(name, ticker, unibaseId);

          // Verify agent ID is non-empty string
          expect(typeof result.agentId).toBe('string');
          expect(result.agentId.length).toBeGreaterThan(0);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('launchAgent should return a valid transaction hash format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // agent name
        fc.string({ minLength: 1, maxLength: 10 }), // agent ticker
        fc.string({ minLength: 10, maxLength: 100 }), // unibase ID
        async (name, ticker, unibaseId) => {
          const result = await bitAgentService.launchAgent(name, ticker, unibaseId);

          // Verify transaction hash is non-empty string
          expect(typeof result.transactionHash).toBe('string');
          expect(result.transactionHash.length).toBeGreaterThan(0);

          // Verify it starts with 0x (blockchain transaction hash format)
          expect(result.transactionHash.startsWith('0x')).toBe(true);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('launchAgent should preserve the unibaseId in the result', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // agent name
        fc.string({ minLength: 1, maxLength: 10 }), // agent ticker
        fc.string({ minLength: 10, maxLength: 100 }), // unibase ID
        async (name, ticker, unibaseId) => {
          const result = await bitAgentService.launchAgent(name, ticker, unibaseId);

          // Verify the unibaseId is preserved in the result
          expect(result.unibaseId).toBe(unibaseId);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: bitagent-unibase-integration, Property 15: Connection logging
 * 
 * For any successful connection to BitAgent or Unibase services, the system
 * should emit a log entry containing the service name and connection status.
 * 
 * Validates: Requirements 5.4
 */
describe('Property 15: Connection logging', () => {
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on console.log to capture log messages
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  test('initialize should log successful connection with service name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 10, maxLength: 100 }), // API key
        fc.constantFrom('bnb-testnet', 'bnb-mainnet'), // network
        async (apiKey, network) => {
          // Clear previous calls
          consoleLogSpy.mockClear();

          // Create a new service instance for each test
          const { BitAgentService } = await import('../bitAgentService');
          const testService = new (BitAgentService as any)();

          await testService.initialize({ apiKey, network });

          // Verify that a log was emitted
          expect(consoleLogSpy).toHaveBeenCalled();

          // Find the initialization log
          const initLog = consoleLogSpy.mock.calls.find((call) =>
            call[0]?.includes('[BitAgent]') && call[0]?.includes('initialized')
          );

          // Verify the log contains service name and network
          expect(initLog).toBeDefined();
          expect(initLog[0]).toContain('BitAgent');
          expect(initLog[0]).toContain(network);

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('launchAgent should log agent launch with details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }), // agent name
        fc.string({ minLength: 1, maxLength: 10 }), // agent ticker
        fc.string({ minLength: 10, maxLength: 100 }), // unibase ID
        async (name, ticker, unibaseId) => {
          // Initialize service
          const { BitAgentService } = await import('../bitAgentService');
          const testService = new (BitAgentService as any)();
          await testService.initialize({
            apiKey: 'test-api-key',
            network: 'bnb-testnet',
          });

          // Clear previous calls
          consoleLogSpy.mockClear();

          await testService.launchAgent(name, ticker, unibaseId);

          // Verify that logs were emitted
          expect(consoleLogSpy).toHaveBeenCalled();

          // Find the launch log
          const launchLog = consoleLogSpy.mock.calls.find((call) =>
            call[0]?.includes('[BitAgent]') && call[0]?.includes('Launching')
          );

          // Verify the log contains agent details
          expect(launchLog).toBeDefined();

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
