// frontend/src/config/api.example.ts
/**
 * Example usage of the API configuration module
 * 
 * This file demonstrates how to use the api.ts configuration module
 * in your services and components.
 */

import axios, { AxiosInstance } from 'axios';
import { getApiConfig, API_BASE_URL, API_TIMEOUT, API_MAX_RETRIES, API_RETRY_DELAY } from './api';

/**
 * Example 1: Using the full configuration object
 */
export function createApiClientWithConfig(): AxiosInstance {
  const config = getApiConfig();
  
  return axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Example 2: Using individual configuration exports
 */
export function createApiClientWithExports(): AxiosInstance {
  return axios.create({
    baseURL: API_BASE_URL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Example 3: Implementing retry logic with configuration
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  maxRetries: number = API_MAX_RETRIES,
  baseDelay: number = API_RETRY_DELAY
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      
      // Check if error is retryable (5xx errors or network errors)
      const isRetryable = axios.isAxiosError(error) && (
        !error.response || 
        error.response.status >= 500
      );
      
      if (isLastAttempt || !isRetryable) {
        throw error;
      }
      
      // Exponential backoff: delay doubles with each attempt
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
}

/**
 * Example 4: Service class using configuration
 */
export class ExampleApiService {
  private client: AxiosInstance;
  private maxRetries: number;
  private retryDelay: number;

  constructor() {
    const config = getApiConfig();
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    this.maxRetries = config.maxRetries;
    this.retryDelay = config.retryDelay;
    
    console.log('[ExampleApiService] Initialized with:', {
      baseUrl: config.baseUrl,
      timeout: `${config.timeout}ms`,
      maxRetries: config.maxRetries,
      retryDelay: `${config.retryDelay}ms`,
    });
  }

  async getData(endpoint: string): Promise<any> {
    return retryRequest(
      () => this.client.get(endpoint),
      this.maxRetries,
      this.retryDelay
    );
  }

  async postData(endpoint: string, data: any): Promise<any> {
    return retryRequest(
      () => this.client.post(endpoint, data),
      this.maxRetries,
      this.retryDelay
    );
  }
}

/**
 * Example 5: Validating configuration before app startup
 */
export function validateConfigurationOnStartup(): void {
  try {
    const config = getApiConfig();
    console.log('✓ API configuration is valid:', {
      baseUrl: config.baseUrl,
      timeout: `${config.timeout}ms`,
      maxRetries: config.maxRetries,
      retryDelay: `${config.retryDelay}ms`,
    });
  } catch (error) {
    console.error('✗ API configuration is invalid:', error);
    // Show user-friendly error message
    alert(
      'Configuration Error: Please check your environment variables. ' +
      'See console for details.'
    );
    throw error;
  }
}

/**
 * Example 6: Using configuration in React component
 */
export function useApiConfig() {
  const config = getApiConfig();
  
  return {
    baseUrl: config.baseUrl,
    timeout: config.timeout,
    maxRetries: config.maxRetries,
    retryDelay: config.retryDelay,
  };
}

/**
 * Example 7: Conditional configuration based on environment
 */
export function getEnvironmentInfo() {
  const config = getApiConfig();
  const isDevelopment = config.baseUrl.includes('localhost');
  const isProduction = !isDevelopment;
  
  return {
    isDevelopment,
    isProduction,
    apiUrl: config.baseUrl,
    environment: isDevelopment ? 'development' : 'production',
  };
}
