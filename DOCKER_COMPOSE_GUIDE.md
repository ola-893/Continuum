# Docker Compose Guide

This guide explains how to run the Continuum platform using Docker Compose for multi-service orchestration.

## Architecture

The docker-compose setup includes two services:

1. **python-service**: Python microservice that wraps the AIP Agent SDK
   - Handles blockchain identity and agent registration
   - Manages decentralized memory via Membase
   - Processes agent queries with LLM integration
   - Exposes REST API on port 5000

2. **nodejs-backend**: Node.js Express backend
   - Orchestrates agent operations
   - Provides API endpoints for the frontend
   - Communicates with python-service via HTTP
   - Exposes REST API on port 3001

## Prerequisites

1. **Docker and Docker Compose** installed
   - Docker: https://docs.docker.com/get-docker/
   - Docker Compose: https://docs.docker.com/compose/install/

2. **BNB Chain Wallet**
   - Create a wallet and get your address and private key
   - Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart

3. **API Keys**
   - OpenAI API key (for LLM): https://platform.openai.com/api-keys
   - OR ChainGPT API key: https://app.chaingpt.org/

## Quick Start

### 1. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.docker-compose .env
```

Edit `.env` and fill in your actual values:

```bash
# REQUIRED: Your BNB Chain wallet
MEMBASE_ACCOUNT=0xYourWalletAddress
MEMBASE_SECRET_KEY=your_private_key

# REQUIRED: Unique agent identifier
MEMBASE_ID=continuum_agent_001

# REQUIRED: LLM API key (choose one)
OPENAI_API_KEY=sk-your-openai-key
# OR
CHAINGPT_API_KEY=a32be5ca-6cb4-46b3-a11d-04f5f5cc19b2
```

### 2. Start Services

Start all services in detached mode:

```bash
docker-compose up -d
```

This will:
- Build Docker images for both services
- Start python-service on port 5000
- Start nodejs-backend on port 3001 (waits for python-service to be healthy)
- Create a Docker network for inter-service communication

### 3. View Logs

Watch logs from all services:

```bash
docker-compose logs -f
```

View logs from a specific service:

```bash
docker-compose logs -f python-service
docker-compose logs -f nodejs-backend
```

### 4. Verify Services

Check service health:

```bash
# Python service health
curl http://localhost:5000/health

# Node.js backend health
curl http://localhost:3001/health
```

Check service status:

```bash
docker-compose ps
```

### 5. Test Agent Registration

Register an agent on-chain:

```bash
curl -X POST http://localhost:5000/agent/register \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "continuum_agent_001"}'
```

Expected response:
```json
{
  "success": true,
  "transaction_hash": "0x...",
  "agent_id": "continuum_agent_001",
  "wallet_address": "0x..."
}
```

### 6. Stop Services

Stop all services:

```bash
docker-compose down
```

Stop and remove volumes (clears cached dependencies):

```bash
docker-compose down -v
```

## Service Communication

### Internal Communication (Docker Network)

Services communicate via the `continuum-network` Docker network:

- Python service: `http://python-service:5000`
- Node.js backend: `http://nodejs-backend:3001`

The Node.js backend is configured to use `PYTHON_SERVICE_URL=http://python-service:5000` for internal communication.

### External Access

From your host machine:

- Python service: `http://localhost:5000`
- Node.js backend: `http://localhost:3001`

## Development Mode

The docker-compose.yml includes volume mounts for development:

```yaml
volumes:
  - ./backend-python:/app  # Live code reload
  - ./backend:/app         # Live code reload
```

This allows you to edit code on your host machine and see changes reflected in the containers.

For production deployment, comment out these volume mounts.

## Troubleshooting

### Service Won't Start

Check logs for errors:
```bash
docker-compose logs python-service
docker-compose logs nodejs-backend
```

Common issues:
- Missing environment variables
- Invalid wallet address or private key
- Insufficient BNB for gas fees
- Port conflicts (5000 or 3001 already in use)

### Python Service Health Check Failing

The python-service has a health check that verifies the `/health` endpoint. If it fails:

1. Check if the service is running:
   ```bash
   docker-compose ps python-service
   ```

2. Check logs for startup errors:
   ```bash
   docker-compose logs python-service
   ```

3. Manually test the health endpoint:
   ```bash
   docker exec continuum-python-service curl http://localhost:5000/health
   ```

### Node.js Backend Can't Connect to Python Service

If nodejs-backend can't reach python-service:

1. Verify python-service is healthy:
   ```bash
   docker-compose ps
   ```

2. Check network connectivity:
   ```bash
   docker exec continuum-nodejs-backend ping python-service
   ```

3. Verify PYTHON_SERVICE_URL is set correctly:
   ```bash
   docker exec continuum-nodejs-backend env | grep PYTHON_SERVICE_URL
   ```

### Port Conflicts

If ports 5000 or 3001 are already in use, modify docker-compose.yml:

```yaml
services:
  python-service:
    ports:
      - "5001:5000"  # Change host port to 5001
  
  nodejs-backend:
    ports:
      - "3002:3001"  # Change host port to 3002
```

### Rebuild After Code Changes

If you've made significant changes to dependencies or Dockerfiles:

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Production Deployment

For production:

1. **Remove development volume mounts** in docker-compose.yml
2. **Set NODE_ENV=production** and **FLASK_ENV=production**
3. **Use secrets management** for sensitive values (not .env files)
4. **Enable HTTPS** with a reverse proxy (nginx, traefik)
5. **Configure proper logging** and monitoring
6. **Set resource limits** for containers
7. **Use docker-compose.prod.yml** for production-specific configuration

Example production override:

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  python-service:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
    # Remove volume mounts
    volumes: []
  
  nodejs-backend:
    restart: always
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    # Remove volume mounts
    volumes: []
```

Run with production config:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Useful Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a specific service
docker-compose restart python-service

# View logs
docker-compose logs -f

# Execute command in container
docker exec -it continuum-python-service bash
docker exec -it continuum-nodejs-backend sh

# Check service status
docker-compose ps

# View resource usage
docker stats

# Remove all containers and volumes
docker-compose down -v

# Rebuild images
docker-compose build --no-cache

# Pull latest images
docker-compose pull
```

## Environment Variables Reference

### Python Service

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| MEMBASE_ACCOUNT | Yes | - | BNB Chain wallet address |
| MEMBASE_SECRET_KEY | Yes | - | Wallet private key |
| MEMBASE_ID | Yes | - | Unique agent identifier |
| MEMBASE_NETWORK | No | bsc-testnet | Network (bsc-testnet/bsc-mainnet) |
| MEMORY_HUB_ADDRESS | No | 54.169.29.193:8081 | Memory Hub gRPC address |
| OPENAI_API_KEY | Yes* | - | OpenAI API key |
| CHAINGPT_API_KEY | Yes* | - | ChainGPT API key |
| FLASK_ENV | No | development | Flask environment |
| LOG_LEVEL | No | INFO | Logging level |

*Either OPENAI_API_KEY or CHAINGPT_API_KEY is required

### Node.js Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PYTHON_SERVICE_URL | Yes | http://python-service:5000 | Python service URL |
| AIP_TIMEOUT | No | 30000 | Request timeout (ms) |
| AIP_MAX_RETRIES | No | 3 | Max retry attempts |
| BSC_TESTNET_RPC_URL | No | https://bsc-testnet.publicnode.com | BSC RPC endpoint |
| NODE_ENV | No | production | Node environment |

## Next Steps

After starting services with docker-compose:

1. **Test agent registration** (see Quick Start section)
2. **Initialize an agent** via POST /agent/initialize
3. **Send queries** via POST /agent/query
4. **Connect frontend** to http://localhost:3001

For detailed API documentation, see:
- Python service: `backend-python/README.md`
- Node.js backend: `backend/SETUP.md`
