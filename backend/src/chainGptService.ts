// backend/src/chainGPTService.ts
// ChainGPT API integration for Web3 AI chatbot and smart contract auditing

import axios from 'axios';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Context injection for personalizing ChainGPT responses
 */
export interface ContextInjection {
  companyName?: string;
  companyDescription?: string;
  companyWebsiteUrl?: string;
  whitePaperUrl?: string;
  purpose?: string;
  cryptoToken?: boolean;
  tokenInformation?: {
    tokenName?: string;
    tokenSymbol?: string;
    tokenAddress?: string;
    blockchain?: string[];
    explorerUrl?: string;
  };
  socialMediaUrls?: Array<{ name: string; url: string }>;
  aiTone?: 'DEFAULT_TONE' | 'CUSTOM_TONE' | 'PRE_SET_TONE';
  selectedTone?: 'PROFESSIONAL' | 'FRIENDLY' | 'INFORMATIVE' | 'CONVERSATIONAL';
  customTone?: string;
}

/**
 * Parameters for chat completion requests
 */
export interface ChatCompletionParams {
  question: string;
  chatHistory?: 'on' | 'off';
  sdkUniqueId?: string;
  useCustomContext?: boolean;
  contextInjection?: ContextInjection;
}

/**
 * Parameters for smart contract audit requests
 */
export interface AuditContractParams {
  contractCode: string;
  question?: string;
  chatHistory?: 'on' | 'off';
  sdkUniqueId?: string;
}

/**
 * Result from chat completion
 */
export interface ChatCompletionResult {
  status: boolean;
  message: string;
  data: {
    bot: string;
  };
}

/**
 * Result from contract audit
 */
export interface AuditResult {
  status: boolean;
  message: string;
  data: {
    bot: string; // Audit report with vulnerabilities and recommendations
  };
}

/**
 * Single chat history entry
 */
export interface ChainGPTHistoryEntry {
  id: string;
  question: string;
  bot: string;
  createdAt: string;
  sdkUniqueId?: string;
}

/**
 * Chat history response
 */
export interface ChatHistory {
  status: boolean;
  message: string;
  data: {
    rows: ChainGPTHistoryEntry[];
    count: number;
  };
}

/**
 * Audit history response (same structure as chat history)
 */
export type AuditHistory = ChatHistory;

// ============================================================================
// Service Interface
// ============================================================================

/**
 * Interface for ChainGPT service operations
 */
export interface IChainGPTService {
  // Web3 AI Chatbot
  chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult>;
  chatCompletionStream(params: ChatCompletionParams): Promise<any>;
  getChatHistory(sessionId?: string, limit?: number): Promise<ChatHistory>;
  
  // Smart Contract Auditor
  auditContract(params: AuditContractParams): Promise<AuditResult>;
  auditContractStream(params: AuditContractParams): Promise<any>;
  getAuditHistory(sessionId?: string, limit?: number): Promise<AuditHistory>;
}

// ============================================================================
// Custom Error Classes
// ============================================================================

/**
 * Error for ChainGPT authentication issues
 */
export class ChainGPTAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChainGPTAuthError';
  }
}

/**
 * Error for ChainGPT rate limiting
 */
export class ChainGPTRateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter: number // seconds
  ) {
    super(message);
    this.name = 'ChainGPTRateLimitError';
  }
}

/**
 * Error for ChainGPT streaming issues
 */
export class ChainGPTStreamError extends Error {
  constructor(
    message: string,
    public partialData?: string
  ) {
    super(message);
    this.name = 'ChainGPTStreamError';
  }
}

// ============================================================================
// Service Implementation
// ============================================================================

/**
 * ChainGPT service for Web3 AI and smart contract auditing
 */
export class ChainGPTService implements IChainGPTService {
  private client: ReturnType<typeof axios.create>;
  private apiKey: string;
  private baseURL: string;
  private timeout: number;

  constructor(apiKey: string, baseURL: string = 'https://api.chaingpt.org', timeout: number = 60000) {
    if (!apiKey) {
      throw new ChainGPTAuthError('ChainGPT API key is required');
    }

    this.apiKey = apiKey;
    this.baseURL = baseURL;
    this.timeout = timeout;

    // Initialize axios client with authentication
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: any) => response,
      (error: any) => this.handleError(error)
    );
  }

  /**
   * Send a chat completion request to ChainGPT's Web3 LLM
   */
  async chatCompletion(params: ChatCompletionParams): Promise<ChatCompletionResult> {
    try {
      const response = await this.client.post('/chat/stream', {
        model: 'general_assistant',
        question: params.question,
        chatHistory: params.chatHistory || 'off',
        sdkUniqueId: params.sdkUniqueId,
        useCustomContext: params.useCustomContext || false,
        contextInjection: params.contextInjection
      });

      return response.data as ChatCompletionResult;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send a streaming chat completion request to ChainGPT
   */
  async chatCompletionStream(params: ChatCompletionParams): Promise<any> {
    try {
      const streamClient = axios.create({
        baseURL: this.baseURL,
        timeout: this.timeout,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      });

      const response = await streamClient.post('/chat/stream', {
        model: 'general_assistant',
        question: params.question,
        chatHistory: params.chatHistory || 'off',
        sdkUniqueId: params.sdkUniqueId,
        useCustomContext: params.useCustomContext || false,
        contextInjection: params.contextInjection
      });

      return response.data;
    } catch (error) {
      throw new ChainGPTStreamError(
        `Failed to stream chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieve chat history for a session
   */
  async getChatHistory(sessionId?: string, limit: number = 10): Promise<ChatHistory> {
    try {
      const params: any = { 
        limit, 
        offset: 0, 
        sortOrder: 'desc' 
      };
      
      if (sessionId) {
        params.sdkUniqueId = sessionId;
      }

      const response = await this.client.get('/chat/chatHistory', { params });
      return response.data as ChatHistory;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit a smart contract for security audit
   */
  async auditContract(params: AuditContractParams): Promise<AuditResult> {
    try {
      const question = params.question || 
        `Audit the following smart contract:\n\`\`\`solidity\n${params.contractCode}\n\`\`\`\nIdentify any security issues, vulnerabilities, and provide recommendations.`;

      const response = await this.client.post('/chat/stream', {
        model: 'smart_contract_auditor',
        question,
        chatHistory: params.chatHistory || 'off',
        sdkUniqueId: params.sdkUniqueId
      });

      return response.data as AuditResult;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Submit a smart contract for streaming audit
   */
  async auditContractStream(params: AuditContractParams): Promise<any> {
    try {
      const streamClient = axios.create({
        baseURL: this.baseURL,
        timeout: this.timeout,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        responseType: 'stream'
      });

      const question = params.question || 
        `Audit the following smart contract:\n\`\`\`solidity\n${params.contractCode}\n\`\`\`\nIdentify any security issues, vulnerabilities, and provide recommendations.`;

      const response = await streamClient.post('/chat/stream', {
        model: 'smart_contract_auditor',
        question,
        chatHistory: params.chatHistory || 'off',
        sdkUniqueId: params.sdkUniqueId
      });

      return response.data;
    } catch (error) {
      throw new ChainGPTStreamError(
        `Failed to stream contract audit: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Retrieve audit history for a session
   */
  async getAuditHistory(sessionId?: string, limit: number = 10): Promise<AuditHistory> {
    // Audit history uses the same endpoint as chat history
    return this.getChatHistory(sessionId, limit);
  }

  /**
   * Handle errors from ChainGPT API
   */
  private handleError(error: any): Error {
    if (error.isAxiosError || (error.response && error.config)) {
      const axiosError = error;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as any;

      // Authentication errors (401, 402)
      if (status === 401) {
        return new ChainGPTAuthError('Invalid ChainGPT API key');
      }
      if (status === 402) {
        return new ChainGPTAuthError('Insufficient ChainGPT credits. Please top up your account.');
      }

      // Rate limit error (429)
      if (status === 429) {
        const retryAfter = parseInt(axiosError.response?.headers['retry-after'] || '60', 10);
        return new ChainGPTRateLimitError(
          'ChainGPT rate limit exceeded (200 requests/minute). Please retry later.',
          retryAfter
        );
      }

      // Timeout error
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return new Error('ChainGPT API request timeout. Please try again.');
      }

      // Server errors (5xx)
      if (status && status >= 500) {
        return new Error(`ChainGPT API server error: ${data?.message || 'Unknown error'}`);
      }

      // Client errors (4xx)
      if (status && status >= 400) {
        return new Error(`ChainGPT API error: ${data?.message || 'Bad request'}`);
      }

      // Network errors
      if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
        return new Error('Cannot connect to ChainGPT API. Please check your network connection.');
      }

      return new Error(`ChainGPT API error: ${axiosError.message}`);
    }

    // Unknown error
    return error instanceof Error ? error : new Error('Unknown ChainGPT error');
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Generate a unique session ID for chat history
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Build context injection from environment variables and overrides
 */
export function buildContextInjection(overrides?: Partial<ContextInjection>): ContextInjection {
  const defaultContext: ContextInjection = {
    companyName: process.env.CHAINGPT_COMPANY_NAME,
    companyDescription: process.env.CHAINGPT_COMPANY_DESCRIPTION,
    companyWebsiteUrl: process.env.CHAINGPT_COMPANY_WEBSITE,
    cryptoToken: process.env.CHAINGPT_TOKEN_NAME ? true : false,
    tokenInformation: process.env.CHAINGPT_TOKEN_NAME ? {
      tokenName: process.env.CHAINGPT_TOKEN_NAME,
      tokenSymbol: process.env.CHAINGPT_TOKEN_SYMBOL,
      tokenAddress: process.env.CHAINGPT_TOKEN_ADDRESS,
      blockchain: process.env.CHAINGPT_TOKEN_BLOCKCHAIN?.split(','),
      explorerUrl: process.env.CHAINGPT_TOKEN_EXPLORER_URL,
    } : undefined,
    aiTone: 'PRE_SET_TONE',
    selectedTone: (process.env.CHAINGPT_DEFAULT_TONE as any) || 'PROFESSIONAL',
  };

  return {
    ...defaultContext,
    ...overrides,
  };
}
