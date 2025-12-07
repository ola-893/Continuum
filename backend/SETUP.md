# Backend Setup Guide

## Overview

This Node.js Express backend serves as an API gateway that orchestrates agent operations by communicating with the Python microservice. It provides REST endpoints for the frontend and handles retry logic, error handling, and request/response translation.

## Architecture

The backend integrates with two agent systems:

1. **AIP Agent Integration (Primary)**: Real on-chain AI agents with decentralized memory
   - Communicates with Python microservice via HTTP
   - Provides blockchain-based agent identity
   - Uses Membase for decentralized memory storage

2. **BitAgent Integration (Legacy)**: Original agent launchpad integration
   - Kept for backward compatibility
   - Can be removed if not needed

## Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure the services:

### AIP Agent Configuration (Required)

```bash
# Python Microservice URL
PYTHON_SERVICE_URL=http://localhost:5000

# Request timeout (milliseconds)
AIP_TIMEOUT=30000

# Maximum retry attempts
AIP_MAX_RETRIES=3

# Base delay for exponential backoff (milliseconds)
AIP_RETRY_BASE_DELAY=1000
```

### Legacy BitAgent Configuration (Optional)

```bash
# BitAgent API key (if using BitAgent)
BITAGENT_API_KEY=your_actual_bitagent_api_key
BITAGENT_NETWORK=bnb-testnet

# Unibase API key (if required)
UNIBASE_API_KEY=your_unibase_api_key
```

### Server Configuration

```bash
# Server port
PORT=3001

# Node environment
NODE_ENV=development

# Blockchain RPC
BSC_TESTNET_RPC_URL=https://bsc-testnet.publicnode.com
```

## Required Environment Variables

### For AIP Agent Integration

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `PYTHON_SERVICE_URL` | Yes | URL of Python microservice | `http://localhost:5000` |
| `AIP_TIMEOUT` | No | Request timeout in ms | `30000` |
| `AIP_MAX_RETRIES` | No | Max retry attempts | `3` |
| `AIP_RETRY_BASE_DELAY` | No | Base delay for retries in ms | `1000` |
| `PORT` | No | Server port | `3001` |

### For Legacy BitAgent Integration

| Variable | Required | Description |
|----------|----------|-------------|
| `BITAGENT_API_KEY` | No | BitAgent API key |
| `BITAGENT_NETWORK` | No | Network (bnb-testnet/bnb-mainnet) |
| `UNIBASE_API_KEY` | No | Unibase API key |
| `BSC_TESTNET_RPC_URL` | No | BSC RPC endpoint |

## AIP SDK Note

The `@bitagent/aip-sdk` package is not yet publicly available on npm. We've created a wrapper (`src/aip-sdk-wrapper.ts`) that provides the interface structure. When the real SDK becomes available, simply:

1. Install it: `npm install @bitagent/aip-sdk`
2. Update the wrapper to use the real SDK implementation

## Running the Backend

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Run tests
npm test
```

## Configuration Validation

The backend validates all required configuration on startup. If any required environment variables are missing, it will:
1. Display clear error messages indicating which variables are needed
2. Exit with an error code
3. Prevent the server from starting with invalid configuration

## Testing

Property-based tests are included to verify:
- Environment variable usage (Property 16)
- Configuration validation
- BitAgent service initialization

Run tests with:
```bash
npm test
```

## API Endpoints

### AIP Agent Endpoints

#### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "continuum-backend",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### POST /api/launch-agent
Launch a new AI agent with blockchain identity.

This endpoint performs two operations:
1. Registers the agent on-chain via Membase contract
2. Initializes the agent with Memory Hub connection

**Request Body:**
```json
{
  "agentId": "continuum_agent_001",
  "description": "You are a helpful real estate assistant",
  "memoryHubAddress": "54.169.29.193:8081"
}
```

**Response (Success):**
```json
{
  "success": true,
  "agentId": "continuum_agent_001",
  "transactionHash": "0x1234567890abcdef...",
  "walletAddress": "0xabcdef1234567890...",
  "status": "initialized",
  "memoryHubConnected": true
}
```

**Response (Error):**
```json
{
  "error": "Agent launch failed",
  "code": "AGENT_REGISTRATION_FAILED",
  "message": "Agent already registered by another wallet",
  "retryable": false,
  "details": {
    "agentId": "continuum_agent_001",
    "suggestion": "Use a different agent ID or the original wallet"
  }
}
```

#### POST /api/agent/query
Send a query to an AI agent and get an intelligent response.

**Request Body:**
```json
{
  "agentId": "continuum_agent_001",
  "query": "What properties do you recommend in New York?",
  "context": {
    "location": "New York",
    "budget": 500000,
    "propertyType": "apartment"
  }
}
```

**Response:**
```json
{
  "success": true,
  "response": "Based on your preferences for New York apartments with a $500,000 budget, I recommend...",
  "agentState": {
    "preferences": {
      "location": ["New York"],
      "budget": 500000,
      "propertyType": ["apartment"]
    },
    "interactionHistory": [
      {
        "id": "uuid-1234",
        "userQuery": "What properties do you recommend in New York?",
        "agentResponse": "Based on your preferences...",
        "timestamp": 1705315800000
      }
    ]
  },
  "interactionId": "uuid-1234"
}
```

#### GET /api/agent/status/:agentId
Get the current status of an AI agent.

**URL Parameters:**
- `agentId`: The unique identifier of the agent

**Response:**
```json
{
  "agentId": "continuum_agent_001",
  "status": "active",
  "registered": true,
  "walletAddress": "0xabcdef1234567890...",
  "memoryHubConnected": true,
  "lastActivity": "2024-01-15T10:30:00Z"
}
```

**Status Values:**
- `active`: Agent is initialized and ready
- `inactive`: Agent is registered but not initialized
- `initializing`: Agent is being set up
- `error`: Agent encountered an error

#### GET /api/agent/memory/:agentId
Retrieve an agent's decentralized memory state.

**URL Parameters:**
- `agentId`: The unique identifier of the agent

**Response:**
```json
{
  "agentId": "continuum_agent_001",
  "state": {
    "version": 1,
    "createdAt": 1705315800000,
    "updatedAt": 1705315900000,
    "membaseId": "continuum_agent_001",
    "walletAddress": "0xabcdef1234567890...",
    "registeredOnChain": true,
    "preferences": {
      "propertyType": ["apartment", "condo"],
      "location": ["New York", "San Francisco"],
      "priceRange": {
        "min": 300000,
        "max": 800000
      },
      "amenities": ["gym", "parking", "pool"]
    },
    "interactionHistory": [
      {
        "id": "uuid-1234",
        "userQuery": "What properties do you recommend?",
        "agentResponse": "Based on your preferences...",
        "timestamp": 1705315800000,
        "context": {
          "location": "New York"
        }
      }
    ],
    "goals": [
      "Help user find ideal property",
      "Learn user preferences over time"
    ],
    "learnedSummary": "User prefers apartments in urban areas with modern amenities...",
    "memoryHubConnected": true,
    "lastSyncTimestamp": 1705315900000
  },
  "lastUpdated": "2024-01-15T10:31:40Z"
}
```

### Legacy BitAgent Endpoints

#### POST /api/launch-agent (Legacy)
Launch a new agent on BitAgent launchpad.

**Request Body:**
```json
{
  "agentName": "My Agent",
  "agentTicker": "MYAGT",
  "unibaseId": "unibase-storage-key"
}
```

**Response:**
```json
{
  "agentId": "bitagent-123456",
  "transactionHash": "0x...",
  "unibaseId": "unibase-storage-key"
}
```

## Error Handling

The backend implements comprehensive error handling with retry logic:

### Error Response Format

```json
{
  "error": "Operation failed",
  "code": "ERROR_CODE",
  "message": "Detailed error message",
  "retryable": true,
  "details": {
    "additionalInfo": "..."
  }
}
```

### Error Codes

| Code | Description | HTTP Status | Retryable |
|------|-------------|-------------|-----------|
| `PYTHON_SERVICE_UNAVAILABLE` | Python service is down | 503 | Yes |
| `PYTHON_SERVICE_TIMEOUT` | Request to Python service timed out | 504 | Yes |
| `AGENT_REGISTRATION_FAILED` | Agent registration failed | 400 | No |
| `AGENT_NOT_FOUND` | Agent doesn't exist | 404 | No |
| `AGENT_ALREADY_REGISTERED` | Agent ID already claimed | 409 | No |
| `INVALID_REQUEST` | Invalid request parameters | 400 | No |
| `INTERNAL_SERVER_ERROR` | Unexpected server error | 500 | Yes |

### Retry Logic

The backend implements exponential backoff retry logic:

- **Retryable Errors**: 5xx status codes, timeouts
- **Non-Retryable Errors**: 4xx status codes (client errors)
- **Max Retries**: Configurable via `AIP_MAX_RETRIES` (default: 3)
- **Backoff Strategy**: `delay = baseDelay * 2^attempt`
  - Attempt 1: 1 second
  - Attempt 2: 2 seconds
  - Attempt 3: 4 seconds

## Request Flow

```
Frontend Request
      ↓
Node.js Backend (Express)
      ↓
aipAgentService.ts (HTTP Client)
      ↓
Retry Logic (if needed)
      ↓
Python Microservice
      ↓
AIP Agent SDK
      ↓
Blockchain / Memory Hub
```

## Architecture

### File Structure

```
backend/
├── src/
│   ├── index.ts                    # Express server entry point
│   ├── config.ts                   # Configuration validation
│   ├── aipAgentService.ts          # AIP Agent HTTP client
│   ├── bitAgentService.ts          # Legacy BitAgent service
│   ├── aip-sdk-wrapper.ts          # SDK interface wrapper
│   └── __tests__/
│       ├── config.test.ts          # Configuration tests
│       ├── aipAgentService.test.ts # AIP Agent service tests
│       └── bitAgentService.test.ts # BitAgent service tests
├── package.json
├── tsconfig.json
├── .env.example
└── .env (not in git)
```

### Key Components

- **`config.ts`**: Validates environment variables and provides typed configuration
- **`aipAgentService.ts`**: HTTP client for Python microservice with retry logic
- **`index.ts`**: Express server with API routes and error handling
- **`bitAgentService.ts`**: Legacy BitAgent integration (optional)

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test Suite

```bash
npm test -- aipAgentService.test.ts
```

### Run with Coverage

```bash
npm test -- --coverage
```

### Test Categories

1. **Unit Tests**: Test individual functions and classes
2. **Integration Tests**: Test API endpoints with mock Python service
3. **Property-Based Tests**: Test properties that should hold for all inputs

## Development

### Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3001` with hot-reload enabled.

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## Troubleshooting

### Python Service Connection Issues

**Error**: `ECONNREFUSED` when calling Python service
- **Cause**: Python service is not running
- **Solution**: Start Python service: `cd backend-python && python app.py`

**Error**: `ETIMEDOUT` when calling Python service
- **Cause**: Request timeout
- **Solutions**:
  1. Increase `AIP_TIMEOUT` in `.env`
  2. Check Python service logs for slow operations
  3. Verify network connectivity

### Configuration Issues

**Error**: `PYTHON_SERVICE_URL is required`
- **Cause**: Missing environment variable
- **Solution**: Add `PYTHON_SERVICE_URL=http://localhost:5000` to `.env`

**Error**: `Configuration validation failed`
- **Cause**: Invalid or missing environment variables
- **Solution**: Check error message for specific missing variables

### Port Conflicts

**Error**: `EADDRINUSE: address already in use`
- **Cause**: Port 3001 is already in use
- **Solutions**:
  1. Change `PORT=3002` in `.env`
  2. Kill existing process: `lsof -ti:3001 | xargs kill -9`

### Testing Issues

**Error**: Tests fail with connection errors
- **Cause**: Tests trying to connect to real Python service
- **Solution**: Tests should mock HTTP calls (check test setup)

## Monitoring

### Health Check

```bash
curl http://localhost:3001/api/health
```

### Check Python Service Connection

```bash
curl http://localhost:3001/api/agent/status/test_agent
```

### View Logs

Development mode logs to console. For production, configure logging:

```typescript
// Add to index.ts
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## Deployment

### Docker Deployment

```bash
# Build image
docker build -t continuum-backend .

# Run container
docker run -p 3001:3001 --env-file .env continuum-backend
```

### Docker Compose

See `docker-compose.yml` in project root for multi-service deployment.

### Environment Variables for Production

```bash
NODE_ENV=production
PYTHON_SERVICE_URL=https://your-python-service.com
AIP_TIMEOUT=60000
AIP_MAX_RETRIES=5
PORT=3001
```

## Security Considerations

- **API Keys**: Never commit `.env` files to git
- **CORS**: Configure CORS properly for production
- **Rate Limiting**: Implement rate limiting for public APIs
- **Input Validation**: All inputs are validated before forwarding
- **Error Messages**: Don't expose sensitive information in error messages
- **HTTPS**: Use HTTPS in production
- **Authentication**: Implement authentication for production APIs

## Resources

- [Express Documentation](https://expressjs.com/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Axios Documentation](https://axios-http.com/)
- [Jest Documentation](https://jestjs.io/)
- [Python Microservice README](../backend-python/README.md)
