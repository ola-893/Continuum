// backend/src/aipAgentService.ts
// HTTP client for Python microservice that wraps AIP Agent SDK

import axios from 'axios';

/**
 * Request/Response Type Definitions
 * These match the Pydantic models in backend-python/models.py
 */

export interface RegisterRequest {
  agent_id: string;
}

export interface RegisterResponse {
  success: boolean;
  transaction_hash: string;
  agent_id: string;
  wallet_address: string;
}

export interface InitializeParams {
  agent_id: string;
  description: string;
  memory_hub_address?: string;
}

export interface InitializeResponse {
  success: boolean;
  agent_id: string;
  status: string;
}

export interface QueryRequest {
  agent_id: string;
  query: string;
  user_context?: Record<string, any>;
}

export interface QueryResponse {
  success: boolean;
  response: string;
  agent_state: Record<string, any>;
  interaction_id: string;
}

export interface AgentStatus {
  agent_id: string;
  status: string;
  registered: boolean;
  wallet_address: string;
  memory_hub_connected: boolean;
}

export interface AgentMemory {
  agent_id: string;
  state: Record<string, any>;
  last_updated: string;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    retryable: boolean;
  };
}

/**
 * AIP Agent Service
 * 
 * HTTP client that communicates with the Python microservice
 * which wraps the AIP Agent SDK for blockchain-based AI agents.
 */
export class AIPAgentService {
  private client: ReturnType<typeof axios.create>;
  private pythonServiceUrl: string;
  private maxRetries: number;
  private baseDelay: number;

  /**
   * Initialize the AIP Agent service
   * 
   * @param pythonServiceUrl - URL of the Python microservice (e.g., http://localhost:5000)
   * @param timeout - Request timeout in milliseconds (default: 30000)
   * @param maxRetries - Maximum retry attempts (default: 3)
   */
  constructor(
    pythonServiceUrl: string,
    timeout: number = 30000,
    maxRetries: number = 3
  ) {
    this.pythonServiceUrl = pythonServiceUrl;
    this.maxRetries = maxRetries;
    this.baseDelay = 1000; // 1 second base delay for exponential backoff

    this.client = axios.create({
      baseURL: pythonServiceUrl,
      timeout: timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log(`[AIPAgentService] Initialized with URL: ${pythonServiceUrl}`);
  }

  /**
   * Register an agent on-chain via Membase smart contract
   * 
   * @param agentId - Unique agent identifier (e.g., "continuum_agent_001")
   * @returns Registration result with transaction hash
   */
  async registerAgent(agentId: string): Promise<RegisterResponse> {
    console.log(`[AIPAgentService] Registering agent: ${agentId}`);

    const response = await this.retryRequest<RegisterResponse>(async () => {
      const res = await this.client.post<RegisterResponse>('/agent/register', {
        agent_id: agentId,
      });
      return res;
    });

    console.log(`[AIPAgentService] Agent registered successfully:`);
    console.log(`  - Agent ID: ${response.agent_id}`);
    console.log(`  - Transaction Hash: ${response.transaction_hash}`);
    console.log(`  - Wallet Address: ${response.wallet_address}`);

    return response;
  }

  /**
   * Initialize an AIP agent with Memory Hub connection
   * 
   * @param params - Initialization parameters
   * @returns Initialization result
   */
  async initializeAgent(params: InitializeParams): Promise<InitializeResponse> {
    console.log(`[AIPAgentService] Initializing agent: ${params.agent_id}`);

    const response = await this.retryRequest<InitializeResponse>(async () => {
      const res = await this.client.post<InitializeResponse>('/agent/initialize', params);
      return res;
    });

    console.log(`[AIPAgentService] Agent initialized successfully:`);
    console.log(`  - Agent ID: ${response.agent_id}`);
    console.log(`  - Status: ${response.status}`);

    return response;
  }

  /**
   * Send a query to an agent and get intelligent response
   * 
   * @param agentId - Agent identifier
   * @param query - User query string
   * @param context - Optional context data
   * @returns Query response with agent's answer and updated state
   */
  async queryAgent(
    agentId: string,
    query: string,
    context?: Record<string, any>
  ): Promise<QueryResponse> {
    console.log(`[AIPAgentService] Querying agent: ${agentId}`);
    console.log(`  - Query: ${query}`);

    const response = await this.retryRequest<QueryResponse>(async () => {
      const res = await this.client.post<QueryResponse>('/agent/query', {
        agent_id: agentId,
        query: query,
        user_context: context,
      });
      return res;
    });

    console.log(`[AIPAgentService] Query completed successfully`);
    console.log(`  - Interaction ID: ${response.interaction_id}`);

    return response;
  }

  /**
   * Get agent status and metadata
   * 
   * @param agentId - Agent identifier
   * @returns Agent status information
   */
  async getAgentStatus(agentId: string): Promise<AgentStatus> {
    console.log(`[AIPAgentService] Getting status for agent: ${agentId}`);

    const response = await this.retryRequest<AgentStatus>(async () => {
      const res = await this.client.get<AgentStatus>(`/agent/status/${agentId}`);
      return res;
    });

    console.log(`[AIPAgentService] Agent status retrieved:`);
    console.log(`  - Status: ${response.status}`);
    console.log(`  - Registered: ${response.registered}`);
    console.log(`  - Memory Hub Connected: ${response.memory_hub_connected}`);

    return response;
  }

  /**
   * Retrieve agent's decentralized memory from Membase
   * 
   * @param agentId - Agent identifier
   * @returns Agent memory and state
   */
  async getAgentMemory(agentId: string): Promise<AgentMemory> {
    console.log(`[AIPAgentService] Getting memory for agent: ${agentId}`);

    const response = await this.retryRequest<AgentMemory>(async () => {
      const res = await this.client.get<AgentMemory>(`/agent/memory/${agentId}`);
      return res;
    });

    console.log(`[AIPAgentService] Agent memory retrieved`);
    console.log(`  - Last Updated: ${response.last_updated}`);

    return response;
  }

  /**
   * Retry a request with exponential backoff
   * 
   * Implements retry logic for transient failures:
   * - Retries on 5xx errors (server errors)
   * - Retries on timeout errors
   * - Does NOT retry on 4xx errors (client errors)
   * - Uses exponential backoff: 1s, 2s, 4s
   * 
   * @param fn - Function that returns a Promise
   * @returns Result from the function
   */
  private async retryRequest<T>(
    fn: () => Promise<any>
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fn();
        return response.data;
      } catch (error) {
        lastError = error as Error;
        const isLastAttempt = attempt === this.maxRetries - 1;

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error);

        if (isLastAttempt || !isRetryable) {
          // Don't retry on last attempt or non-retryable errors
          throw this.formatError(error);
        }

        // Calculate exponential backoff delay
        const delay = this.baseDelay * Math.pow(2, attempt);
        
        console.log(
          `[AIPAgentService] Request failed (attempt ${attempt + 1}/${this.maxRetries}), ` +
          `retrying in ${delay}ms...`
        );

        await this.delay(delay);
      }
    }

    // This should never be reached, but TypeScript needs it
    throw this.formatError(lastError!);
  }

  /**
   * Check if an error is retryable
   * 
   * @param error - Error object
   * @returns true if error is retryable
   */
  private isRetryableError(error: any): boolean {
    // @ts-ignore - axios.isAxiosError exists at runtime but may not be in type definitions
    if (axios.isAxiosError && axios.isAxiosError(error)) {
      const axiosError = error;

      // Retry on timeout
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return true;
      }

      // Retry on network errors
      if (!axiosError.response) {
        return true;
      }

      // Retry on 5xx server errors
      const status = axiosError.response.status;
      if (status >= 500 && status < 600) {
        return true;
      }

      // Don't retry on 4xx client errors
      return false;
    }

    // Retry on unknown errors
    return true;
  }

  /**
   * Format error for consistent error handling
   * 
   * @param error - Error object
   * @returns Formatted error
   */
  private formatError(error: any): Error {
    // @ts-ignore - axios.isAxiosError exists at runtime but may not be in type definitions
    if (axios.isAxiosError && axios.isAxiosError(error)) {
      const axiosError = error;

      // Handle timeout
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return new Error(
          `Python service request timeout after ${this.maxRetries} attempts. ` +
          `Please check if the Python microservice is running at ${this.pythonServiceUrl}`
        );
      }

      // Handle network errors
      if (!axiosError.response) {
        return new Error(
          `Cannot connect to Python service at ${this.pythonServiceUrl}. ` +
          `Please ensure the service is running and accessible.`
        );
      }

      // Handle HTTP errors
      const status = axiosError.response.status;
      const data = axiosError.response.data as any;

      if (data && data.error) {
        // Python service returned structured error
        return new Error(
          `Python service error (${status}): ${data.error.message || data.error.code}`
        );
      }

      return new Error(
        `Python service returned ${status}: ${axiosError.message}`
      );
    }

    // Unknown error
    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * Delay helper for exponential backoff
   * 
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get the Python service URL
   */
  getServiceUrl(): string {
    return this.pythonServiceUrl;
  }

  /**
   * Check if the Python service is reachable
   * 
   * @returns true if service is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.get('/health', { timeout: 5000 });
      return true;
    } catch (error) {
      console.error('[AIPAgentService] Health check failed:', error);
      return false;
    }
  }
}

/**
 * Create a singleton instance of AIPAgentService
 * This can be imported and used throughout the application
 */
export function createAIPAgentService(
  pythonServiceUrl: string,
  timeout?: number,
  maxRetries?: number
): AIPAgentService {
  return new AIPAgentService(pythonServiceUrl, timeout, maxRetries);
}
