# Frontend Configuration Module

This directory contains configuration modules for the Continuum frontend application.

## API Configuration (`api.ts`)

The `api.ts` module provides centralized API configuration with validation.

### Features

- **Environment Variable Validation**: Validates required environment variables on startup
- **Type-Safe Configuration**: Provides TypeScript interfaces for all configuration
- **Sensible Defaults**: Uses default values for optional configuration
- **Range Validation**: Ensures numeric values are within acceptable ranges
- **URL Validation**: Validates that API URLs are properly formatted
- **Error Handling**: Provides clear error messages for configuration issues

### Usage

#### Basic Usage

```typescript
import { getApiConfig, API_BASE_URL, API_TIMEOUT } from '../config/api';

// Get the full configuration object
const config = getApiConfig();
console.log(config.baseUrl);    // "http://localhost:3001"
console.log(config.timeout);    // 30000
console.log(config.maxRetries); // 3
console.log(config.retryDelay); // 1000

// Or use individual exports
console.log(API_BASE_URL);      // "http://localhost:3001"
console.log(API_TIMEOUT);       // 30000
```

#### Using with Axios

```typescript
import axios from 'axios';
import { getApiConfig } from '../config/api';

const config = getApiConfig();

const client = axios.create({
  baseURL: config.baseUrl,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

#### Validation Checking

```typescript
import { isApiConfigValid, getConfigValidationErrors } from '../config/api';

// Check if configuration is valid
if (!isApiConfigValid()) {
  const errors = getConfigValidationErrors();
  console.error('Configuration errors:', errors);
}
```

### Environment Variables

#### Required

- **`VITE_API_URL`**: Backend API base URL
  - Must be a valid HTTP/HTTPS URL
  - Example: `http://localhost:3001`

#### Optional

- **`VITE_API_TIMEOUT`**: Request timeout in milliseconds
  - Default: `30000` (30 seconds)
  - Range: `1000` - `300000` (1 second to 5 minutes)

- **`VITE_API_MAX_RETRIES`**: Maximum retry attempts for failed requests
  - Default: `3`
  - Range: `0` - `10`

- **`VITE_API_RETRY_DELAY`**: Base delay for exponential backoff in milliseconds
  - Default: `1000` (1 second)
  - Range: `100` - `10000` (100ms to 10 seconds)
  - Note: Actual delay doubles with each retry attempt

### Configuration Interface

```typescript
interface ApiConfig {
  baseUrl: string;      // Backend API base URL
  timeout: number;      // Request timeout in milliseconds
  maxRetries: number;   // Maximum number of retry attempts
  retryDelay: number;   // Base delay for exponential backoff
}
```

### Error Handling

The module throws `ConfigurationError` when validation fails:

```typescript
import { getApiConfig, ConfigurationError } from '../config/api';

try {
  const config = getApiConfig();
  // Use config...
} catch (error) {
  if (error instanceof ConfigurationError) {
    console.error('Configuration error:', error.message);
    // Show user-friendly error message
  }
}
```

### Example `.env` File

```bash
# Required
VITE_API_URL=http://localhost:3001

# Optional (with defaults shown)
VITE_API_TIMEOUT=30000
VITE_API_MAX_RETRIES=3
VITE_API_RETRY_DELAY=1000
```

### Testing

For testing purposes, you can reset the configuration singleton:

```typescript
import { resetApiConfig } from '../config/api';

// Reset configuration (useful in tests)
resetApiConfig();
```

## Other Configuration Files

- **`constants.ts`**: Application-wide constants
- **`contracts.ts`**: Smart contract addresses and ABIs

## Best Practices

1. **Always validate configuration on startup**: Call `getApiConfig()` early in your application lifecycle
2. **Use the singleton pattern**: The configuration is loaded once and cached
3. **Handle configuration errors gracefully**: Show user-friendly error messages
4. **Don't hardcode values**: Always use environment variables for configuration
5. **Document environment variables**: Keep `.env.example` up to date

## Requirements Satisfied

- **Requirement 3.1**: Backend API configuration and validation
- **Requirement 5.1**: Configuration validation and error handling
