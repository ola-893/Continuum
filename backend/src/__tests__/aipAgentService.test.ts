// backend/src/__tests__/aipAgentService.test.ts
// Tests for AIP Agent HTTP client service

import { AIPAgentService, createAIPAgentService } from '../aipAgentService';

describe('AIPAgentService', () => {
  describe('Constructor', () => {
    it('should create an instance with default timeout and retries', () => {
      const service = new AIPAgentService('http://localhost:5000');
      expect(service).toBeInstanceOf(AIPAgentService);
      expect(service.getServiceUrl()).toBe('http://localhost:5000');
    });

    it('should create an instance with custom timeout and retries', () => {
      const service = new AIPAgentService('http://localhost:5000', 60000, 5);
      expect(service).toBeInstanceOf(AIPAgentService);
    });

    it('should be created via factory function', () => {
      const service = createAIPAgentService('http://localhost:5000');
      expect(service).toBeInstanceOf(AIPAgentService);
    });
  });

  describe('Service URL', () => {
    it('should return the configured service URL', () => {
      const url = 'http://python-service:5000';
      const service = new AIPAgentService(url);
      expect(service.getServiceUrl()).toBe(url);
    });
  });

  describe('Type Definitions', () => {
    it('should have correct interface types', () => {
      const service = new AIPAgentService('http://localhost:5000');
      
      // These should compile without errors
      const registerPromise: Promise<any> = service.registerAgent('test-agent');
      const initializePromise: Promise<any> = service.initializeAgent({
        agent_id: 'test-agent',
        description: 'Test agent',
      });
      const queryPromise: Promise<any> = service.queryAgent('test-agent', 'test query');
      const statusPromise: Promise<any> = service.getAgentStatus('test-agent');
      const memoryPromise: Promise<any> = service.getAgentMemory('test-agent');

      // Verify promises exist (they won't resolve in this test)
      expect(registerPromise).toBeDefined();
      expect(initializePromise).toBeDefined();
      expect(queryPromise).toBeDefined();
      expect(statusPromise).toBeDefined();
      expect(memoryPromise).toBeDefined();
    });
  });
});
