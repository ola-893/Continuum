// frontend/src/config/api.ts
/**
 * API Configuration Module
 * 
 * Centralizes all API-related configuration including:
 * - Backend URL
 * - Timeout settings
 * - Retry configuration
 * - Environment variable validation
 * 
 * Requirements: 3.1, 5.1
 */

/**
 * API Configuration Interface
 */
export interface ApiConfig {
  /** Backend API base URL */
  baseUrl: string;
  /** Request timeout in milliseconds */
  timeout: number;
  /** Maximum number of retry attempts for failed requests */
  maxRetries: number;
  /** Base delay for exponential backoff (in milliseconds) */
  retryDelay: number;
}

/**
 * Configuration Validation Error
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Validate that a required environment variable is set
 */
function validateRequired(name: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new ConfigurationError(
      `Required environment variable ${name} is not set. ` +
      `Please check your .env file and ensure ${name} is configured.`
    );
  }
  return value.trim();
}

/**
 * Validate URL format
 */
function validateUrl(name: string, value: string): string {
  try {
    const url = new URL(value);
    // Ensure it's http or https
    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Invalid protocol');
    }
    return value;
  } catch (error) {
    throw new ConfigurationError(
      `Environment variable ${name} must be a valid HTTP/HTTPS URL. ` +
      `Got: "${value}"`
    );
  }
}

/**
 * Parse and validate a numeric environment variable
 */
function parseNumber(
  name: string,
  value: string | undefined,
  defaultValue: number,
  min?: number,
  max?: number
): number {
  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  
  if (isNaN(parsed)) {
    throw new ConfigurationError(
      `Environment variable ${name} must be a valid number. Got: "${value}"`
    );
  }

  if (min !== undefined && parsed < min) {
    throw new ConfigurationError(
      `Environment variable ${name} must be at least ${min}. Got: ${parsed}`
    );
  }

  if (max !== undefined && parsed > max) {
    throw new ConfigurationError(
      `Environment variable ${name} must be at most ${max}. Got: ${parsed}`
    );
  }

  return parsed;
}

/**
 * Load and validate API configuration from environment variables
 */
function loadApiConfig(): ApiConfig {
  // Validate required environment variables
  const baseUrl = validateRequired('VITE_API_URL', import.meta.env.VITE_API_URL);
  const validatedUrl = validateUrl('VITE_API_URL', baseUrl);

  // Parse optional configuration with defaults
  const timeout = parseNumber(
    'VITE_API_TIMEOUT',
    import.meta.env.VITE_API_TIMEOUT,
    30000, // Default: 30 seconds
    1000,  // Min: 1 second
    300000 // Max: 5 minutes
  );

  const maxRetries = parseNumber(
    'VITE_API_MAX_RETRIES',
    import.meta.env.VITE_API_MAX_RETRIES,
    3, // Default: 3 retries
    0, // Min: 0 (no retries)
    10 // Max: 10 retries
  );

  const retryDelay = parseNumber(
    'VITE_API_RETRY_DELAY',
    import.meta.env.VITE_API_RETRY_DELAY,
    1000, // Default: 1 second
    100,  // Min: 100ms
    10000 // Max: 10 seconds
  );

  return {
    baseUrl: validatedUrl,
    timeout,
    maxRetries,
    retryDelay,
  };
}

/**
 * Singleton API configuration instance
 * Validates configuration on first access
 */
let apiConfigInstance: ApiConfig | null = null;

/**
 * Get the validated API configuration
 * Throws ConfigurationError if validation fails
 */
export function getApiConfig(): ApiConfig {
  if (!apiConfigInstance) {
    try {
      apiConfigInstance = loadApiConfig();
      
      // Log configuration (for debugging)
      console.log('[API Config] Loaded configuration:', {
        baseUrl: apiConfigInstance.baseUrl,
        timeout: `${apiConfigInstance.timeout}ms`,
        maxRetries: apiConfigInstance.maxRetries,
        retryDelay: `${apiConfigInstance.retryDelay}ms`,
      });
    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.error('[API Config] Configuration validation failed:', error.message);
        throw error;
      }
      throw new ConfigurationError(
        `Failed to load API configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
  
  return apiConfigInstance;
}

/**
 * Export individual configuration values for convenience
 */
export const API_BASE_URL = getApiConfig().baseUrl;
export const API_TIMEOUT = getApiConfig().timeout;
export const API_MAX_RETRIES = getApiConfig().maxRetries;
export const API_RETRY_DELAY = getApiConfig().retryDelay;

/**
 * Reset configuration (useful for testing)
 */
export function resetApiConfig(): void {
  apiConfigInstance = null;
}

/**
 * Check if API configuration is valid without throwing
 * Returns true if valid, false otherwise
 */
export function isApiConfigValid(): boolean {
  try {
    getApiConfig();
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get configuration validation errors without throwing
 * Returns array of error messages, empty if valid
 */
export function getConfigValidationErrors(): string[] {
  const errors: string[] = [];

  try {
    validateRequired('VITE_API_URL', import.meta.env.VITE_API_URL);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      errors.push(error.message);
    }
  }

  try {
    const url = import.meta.env.VITE_API_URL;
    if (url) {
      validateUrl('VITE_API_URL', url);
    }
  } catch (error) {
    if (error instanceof ConfigurationError) {
      errors.push(error.message);
    }
  }

  try {
    parseNumber('VITE_API_TIMEOUT', import.meta.env.VITE_API_TIMEOUT, 30000, 1000, 300000);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      errors.push(error.message);
    }
  }

  try {
    parseNumber('VITE_API_MAX_RETRIES', import.meta.env.VITE_API_MAX_RETRIES, 3, 0, 10);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      errors.push(error.message);
    }
  }

  try {
    parseNumber('VITE_API_RETRY_DELAY', import.meta.env.VITE_API_RETRY_DELAY, 1000, 100, 10000);
  } catch (error) {
    if (error instanceof ConfigurationError) {
      errors.push(error.message);
    }
  }

  return errors;
}
