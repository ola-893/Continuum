# Frontend Environment Configuration

## Overview

This document describes the environment variables used by the Continuum frontend application.

## Environment Variables

### Required Variables

#### `VITE_API_URL`
- **Description**: URL of the Node.js backend service
- **Default**: `http://localhost:3001`
- **Example**: `http://localhost:3001` (local) or `https://api.continuum.example.com` (production)
- **Purpose**: The frontend communicates with the Node.js backend via REST API. The backend handles all AIP Agent operations via the Python microservice.

#### `VITE_APTOS_NETWORK`
- **Description**: Aptos blockchain network
- **Default**: `testnet`
- **Options**: `testnet`, `devnet`, `mainnet`
- **Purpose**: Specifies which Aptos network to connect to for blockchain operations.

### Optional Variables

#### `VITE_API_TIMEOUT`
- **Description**: Backend request timeout in milliseconds
- **Default**: `30000` (30 seconds)
- **Example**: `30000`, `60000`
- **Purpose**: Maximum time to wait for backend API responses. Increase if backend operations take longer (e.g., blockchain transactions).

#### `VITE_PINATA_JWT`
- **Description**: Pinata API JWT for IPFS uploads
- **Default**: None
- **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Purpose**: Only required if using IPFS metadata uploads. Get from: https://app.pinata.cloud/developers/api-keys

#### `VITE_IPFS_GATEWAY`
- **Description**: Public IPFS gateway URL
- **Default**: `https://ipfs.io/ipfs/`
- **Example**: `https://ipfs.io/ipfs/`, `https://gateway.pinata.cloud/ipfs/`
- **Purpose**: Used to fetch and display IPFS metadata.

## Configuration Files

### `.env`
The actual environment variables file used by the application. This file contains your specific configuration values.

**Location**: `frontend/.env`

**Example**:
```bash
VITE_API_URL=http://localhost:3001
VITE_API_TIMEOUT=30000
VITE_APTOS_NETWORK=testnet
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/
```

### `.env.example`
Template file showing all available environment variables with documentation. Copy this file to `.env` and update with your values.

**Location**: `frontend/.env.example`

## Important Notes

### No Unibase SDK API Keys Required
- The frontend does **NOT** require any Unibase SDK API keys
- Authentication is wallet-based (MEMBASE_ACCOUNT + MEMBASE_SECRET_KEY)
- Wallet credentials are configured in the backend services, not the frontend
- The frontend only needs the backend API URL

### Backend Communication
- The frontend communicates with the Node.js backend via REST API
- The Node.js backend handles all AIP Agent operations via the Python microservice
- All blockchain operations are handled by the backend services

### Environment Variable Access
Environment variables are accessed in the code using Vite's `import.meta.env` API:

```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);
```

## Setup Instructions

1. **Copy the example file**:
   ```bash
   cd frontend
   cp .env.example .env
   ```

2. **Update the values** in `.env`:
   - Set `VITE_API_URL` to your backend URL (default: `http://localhost:3001`)
   - Optionally adjust `VITE_API_TIMEOUT` if needed
   - Configure other variables as needed

3. **Restart the development server** if it's running:
   ```bash
   npm run dev
   ```

## Troubleshooting

### Backend Connection Issues
If you see "Cannot connect to backend service" errors:
1. Verify `VITE_API_URL` is correct
2. Ensure the Node.js backend is running on the specified URL
3. Check that the Python microservice is running (backend depends on it)

### Timeout Errors
If you see "Request timed out" errors:
1. Increase `VITE_API_TIMEOUT` to a higher value (e.g., `60000` for 60 seconds)
2. Check backend logs for slow operations
3. Verify blockchain RPC endpoints are responsive

### Environment Variables Not Loading
If environment variables aren't being read:
1. Ensure the `.env` file exists in the `frontend/` directory
2. Restart the development server after changing `.env`
3. Verify variable names start with `VITE_` prefix (required by Vite)

## Related Documentation

- [Agent Service Migration](./AGENT_SERVICE_MIGRATION.md) - How the frontend uses the backend API
- [Backend Setup](../backend/SETUP.md) - Node.js backend configuration
- [Python Microservice](../backend-python/README.md) - Python service configuration
- [Docker Compose Guide](../DOCKER_COMPOSE_GUIDE.md) - Running all services together
