# Continuum AI Agent Frontend

This is the frontend application for the Continuum AI Agent platform, featuring real-time AI agents with blockchain identity and decentralized memory powered by AIP Agent (Agent Interoperability Protocol) and Unibase's Membase on BNB Chain.

## 🏗️ Architecture Overview

The frontend is part of a three-tier architecture:

```
Frontend (React + TypeScript)
    ↓ HTTP REST API
Node.js Backend (Express)
    ↓ HTTP REST API
Python Microservice (Flask)
    ↓
AIP Agent SDK + Membase (Decentralized Memory)
    ↓
BNB Chain (Blockchain Identity)
```

### Key Features

- **Real AI Agents**: Powered by OpenAI/ChainGPT with persistent memory
- **Blockchain Identity**: Each agent is registered on-chain with a unique wallet address
- **Decentralized Memory**: Agent state stored in Membase (tamper-proof, persistent)
- **Cross-Platform**: Agents accessible from any platform using their blockchain ID
- **Real-time Chat**: Interactive chat interface with intelligent responses
- **Transaction Verification**: All blockchain operations verifiable on BSC Testnet Explorer

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Backend services running (Node.js backend + Python microservice)
- BNB Chain testnet wallet with small amount of BNB for gas fees

### Installation

1. **Install dependencies**:
```bash
cd frontend
npm install
```

2. **Configure environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and set:
```bash
VITE_API_URL=http://localhost:3001  # Node.js backend URL
VITE_API_TIMEOUT=30000              # Request timeout (30 seconds)
```

3. **Start development server**:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## 🔧 Configuration

### Environment Variables

All environment variables are prefixed with `VITE_` (required by Vite).

#### Required Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_API_URL` | Node.js backend URL | `http://localhost:3001` | `https://api.continuum.example.com` |

#### Optional Variables

| Variable | Description | Default | Range |
|----------|-------------|---------|-------|
| `VITE_API_TIMEOUT` | Request timeout (ms) | `30000` | 1000-300000 |
| `VITE_API_MAX_RETRIES` | Max retry attempts | `3` | 0-10 |
| `VITE_API_RETRY_DELAY` | Retry delay (ms) | `1000` | 100-10000 |

### Configuration Module

The frontend uses a centralized configuration module at `src/config/api.ts`:

```typescript
import { getApiConfig, API_BASE_URL, API_TIMEOUT } from './config/api';

// Get full configuration
const config = getApiConfig();

// Or use individual exports
console.log(API_BASE_URL);  // "http://localhost:3001"
console.log(API_TIMEOUT);   // 30000
```

See [src/config/README.md](./src/config/README.md) for detailed documentation.

## 📡 Backend Integration

### API Endpoints

The frontend communicates with the Node.js backend via REST API:

#### 1. Launch Agent
```typescript
POST /api/launch-agent
Body: {
  agentName: string,
  agentTicker: string,
  unibaseId: string  // Format: continuum_agent_{walletAddress}_{timestamp}
}
Response: {
  success: boolean,
  transactionHash: string,      // Verifiable on BSC Testnet Explorer
  walletAddress: string,        // BNB Chain address that owns the agent
  status: string,
  message: string
}
```

#### 2. Query Agent
```typescript
POST /api/agent/query
Body: {
  agentId: string,
  query: string,
  context?: object
}
Response: {
  success: boolean,
  response: string,             // Real LLM-generated response
  agentState: object,           // Updated agent state from Membase
  interactionId: string
}
```

#### 3. Get Agent Status
```typescript
GET /api/agent/status/:agentId
Response: {
  agentId: string,
  status: string,               // "active", "inactive", "initializing"
  registered: boolean,          // On-chain registration status
  walletAddress: string,
  memoryHubConnected: boolean   // Decentralized memory connection
}
```

#### 4. Get Agent Memory
```typescript
GET /api/agent/memory/:agentId
Response: {
  agentId: string,
  state: {
    preferences: object,
    interactionHistory: array,
    learnedSummary: string,
    goals: array
  },
  lastUpdated: string
}
```

### Agent Service

The `agentService.ts` module handles all backend communication:

```typescript
import { agentService } from './services/agentService';

// Get agent state from Membase
const state = await agentService.getAgentState(userAddress);

// Process user query
const result = await agentService.processInteraction(userAddress, query);

// Initialize agent automatically if not found
await agentService.ensureAgentInitialized(userAddress);
```

See [AGENT_SERVICE_MIGRATION.md](./AGENT_SERVICE_MIGRATION.md) for migration details.

## 🎨 Features

### 1. Launch Agent Page (`/launch-agent`)

Create a new AI agent with blockchain identity:

- **Input**: Agent name and ticker symbol
- **Process**: 
  1. Generates unique agent ID: `continuum_agent_{walletAddress}_{timestamp}`
  2. Registers agent on-chain via Membase smart contract
  3. Initializes agent with Memory Hub connection
  4. Returns transaction hash and wallet address
- **Output**: Transaction hash verifiable on [BSC Testnet Explorer](https://testnet.bscscan.com)

**Features**:
- Real blockchain transactions (not simulated)
- Transaction verification links
- Comprehensive error handling
- Loading states with progress indicators
- Wallet integration

See [LAUNCH_AGENT_INTEGRATION.md](./LAUNCH_AGENT_INTEGRATION.md) for details.

### 2. Chat Interface (`/chat`)

Interactive chat with your AI agent:

- **Real-time Responses**: Powered by OpenAI/ChainGPT
- **Persistent Memory**: Agent remembers conversation history via Membase
- **Automatic Initialization**: Creates agent if not found
- **Error Recovery**: Automatic retry with exponential backoff
- **Connection Status**: Real-time backend connectivity indicator

**Features**:
- Message history with timestamps
- Loading indicators during processing
- Error messages with retry buttons
- Connection status (connected/disconnected)
- Agent memory viewer

See [CHAT_INTERFACE_INTEGRATION.md](./CHAT_INTERFACE_INTEGRATION.md) for details.

### 3. Agent Memory Display

View your agent's decentralized memory:

- **Preferences**: Learned user preferences
- **Interaction History**: Complete conversation log
- **Goals**: Agent's current objectives
- **Learned Summary**: AI-generated summary of knowledge

**Access**: Click "View Memory" button in chat interface

See [AGENT_MEMORY_DISPLAY_IMPLEMENTATION.md](./AGENT_MEMORY_DISPLAY_IMPLEMENTATION.md) for details.

### 4. Connection Status Indicator

Real-time backend connectivity monitoring:

- **Connected** (Green): Backend is reachable
- **Disconnected** (Red): Backend unavailable
- **Checking** (Yellow): Connection test in progress

**Location**: Top-right corner of chat interface

See [CONNECTION_STATUS_IMPLEMENTATION.md](./CONNECTION_STATUS_IMPLEMENTATION.md) for details.

## 🛠️ Error Handling

The frontend implements comprehensive error handling for all backend scenarios:

### Error Types

| Error Code | Description | User Message | Retryable | Action |
|------------|-------------|--------------|-----------|--------|
| 503 | Service Unavailable | Backend service temporarily unavailable | Yes | Auto-retry |
| 504 | Gateway Timeout | Request timed out | Yes | Auto-retry |
| ECONNREFUSED | Connection Refused | Cannot connect to backend | Yes | Auto-retry |
| 404 | Agent Not Found | Agent hasn't been initialized | No | Launch Agent |
| 402 | Payment Required | Insufficient BNB for gas fees | No | Get Testnet BNB |
| 409 | Conflict | Agent already registered | No | Contact Support |

### Retry Logic

- **Automatic Retry**: For transient errors (503, 504, connection errors)
- **Exponential Backoff**: 1s, 2s, 4s delays
- **Max Retries**: 3 attempts
- **Manual Retry**: Retry button for failed requests

### Error Messages

All error messages are user-friendly with actionable guidance:

```typescript
// Example: Insufficient funds
"Insufficient funds for gas fees. Please ensure your wallet has enough BNB 
(approximately 0.0002 BNB) to cover blockchain transaction costs."

// Action: Link to BNB Chain testnet faucet
```

See [ERROR_HANDLING_IMPLEMENTATION.md](./ERROR_HANDLING_IMPLEMENTATION.md) for details.

## 🧪 Testing

### Manual Testing

1. **Test Agent Launch**:
```bash
# Ensure backend is running
curl http://localhost:3001/

# Launch agent via UI
# Verify transaction on: https://testnet.bscscan.com/tx/{transactionHash}
```

2. **Test Chat Interaction**:
```bash
# Send message in chat interface
# Verify real LLM response (not templated)
# Check agent memory updates
```

3. **Test Error Handling**:
```bash
# Stop backend service
npm run dev  # In backend directory

# Send message in chat
# Verify automatic retry occurs
# Verify error message is user-friendly
```

### Browser Console Testing

```javascript
// Test backend connection
fetch('http://localhost:3001/')
  .then(r => r.text())
  .then(console.log);

// Test agent launch
fetch('http://localhost:3001/api/launch-agent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentName: 'Test Agent',
    agentTicker: 'TEST',
    unibaseId: 'continuum_agent_test_001'
  })
}).then(r => r.json()).then(console.log);
```

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend service"

**Symptoms**: Error message in chat interface, red connection status

**Solutions**:
1. Verify backend is running:
   ```bash
   curl http://localhost:3001/
   ```
2. Check `VITE_API_URL` in `.env`
3. Ensure Python microservice is running (backend depends on it)
4. Check backend logs for errors

### Issue: "Request timed out"

**Symptoms**: Timeout error after 30 seconds

**Solutions**:
1. Increase `VITE_API_TIMEOUT` in `.env`:
   ```bash
   VITE_API_TIMEOUT=60000  # 60 seconds
   ```
2. Check backend logs for slow operations
3. Verify blockchain RPC endpoints are responsive
4. Check Memory Hub connection (54.169.29.193:8081)

### Issue: "Agent not found"

**Symptoms**: 404 error when sending chat message

**Solutions**:
1. Launch an agent first via `/launch-agent` page
2. Ensure wallet is connected
3. Check agent ID format: `continuum_agent_{walletAddress}_{timestamp}`
4. Verify agent registration on blockchain

### Issue: "Insufficient funds for gas fees"

**Symptoms**: 402 error when launching agent

**Solutions**:
1. Get testnet BNB from faucet: https://testnet.bnbchain.org/faucet-smart
2. Ensure wallet has at least 0.0002 BNB
3. Wait 1-2 minutes for faucet transaction to confirm
4. Retry agent launch

### Issue: Environment variables not loading

**Symptoms**: Configuration errors, default values used

**Solutions**:
1. Ensure `.env` file exists in `frontend/` directory
2. Restart development server after changing `.env`
3. Verify variable names start with `VITE_` prefix
4. Check for syntax errors in `.env` file

### Issue: Backend returns 500 errors

**Symptoms**: Internal server errors from backend

**Solutions**:
1. Check backend logs: `cd backend && npm run dev`
2. Check Python service logs: `cd backend-python && python app.py`
3. Verify environment variables in backend services
4. Check blockchain RPC endpoint connectivity
5. Verify Memory Hub is accessible

## 📚 Documentation

### Implementation Guides

- [Agent Service Migration](./AGENT_SERVICE_MIGRATION.md) - Backend API integration
- [Environment Configuration](./ENVIRONMENT_CONFIGURATION.md) - Environment variables
- [API Configuration](./API_CONFIG_IMPLEMENTATION.md) - Configuration module
- [Error Handling](./ERROR_HANDLING_IMPLEMENTATION.md) - Error handling system
- [Launch Agent Integration](./LAUNCH_AGENT_INTEGRATION.md) - Agent launch page
- [Chat Interface Integration](./CHAT_INTERFACE_INTEGRATION.md) - Chat interface
- [Agent Memory Display](./AGENT_MEMORY_DISPLAY_IMPLEMENTATION.md) - Memory viewer
- [Connection Status](./CONNECTION_STATUS_IMPLEMENTATION.md) - Status indicator
- [Loading States](./LOADING_STATES_IMPLEMENTATION.md) - Loading indicators
- [Toast Notifications](./TOAST_USAGE_GUIDE.md) - Toast system

### Backend Documentation

- [Backend Setup](../backend/SETUP.md) - Node.js backend configuration
- [Python Microservice](../backend-python/README.md) - Python service setup
- [Docker Compose Guide](../DOCKER_COMPOSE_GUIDE.md) - Multi-service orchestration
- [Judge Verification Guide](../JUDGE_VERIFICATION_GUIDE.md) - Verification checklist

### API Examples

See [SDK Usage Examples](../SDK_USAGE_EXAMPLES.md) for complete API examples.

## 🔗 Related Resources

### Blockchain

- **BNB Chain Testnet Explorer**: https://testnet.bscscan.com
- **Membase Contract**: `0x100E3F8c5285df46A8B9edF6b38B8f90F1C32B7b`
- **Testnet Faucet**: https://testnet.bnbchain.org/faucet-smart
- **RPC Endpoint**: https://bsc-testnet-rpc.publicnode.com

### AIP Agent & Membase

- **AIP Agent SDK**: https://github.com/unibaseio/aip-agent
- **Membase Documentation**: https://docs.unibase.io
- **Memory Hub**: 54.169.29.193:8081 (gRPC)

### Development

- **React**: https://react.dev
- **TypeScript**: https://www.typescriptlang.org
- **Vite**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com

## 🤝 Contributing

### Development Workflow

1. Create feature branch from `main`
2. Make changes and test locally
3. Ensure all TypeScript types are correct
4. Test with real backend services
5. Update documentation if needed
6. Submit pull request

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting
- Add JSDoc comments for public functions
- Use meaningful variable names
- Keep functions small and focused

### Testing Requirements

- Test with backend running
- Test with backend stopped (error handling)
- Test all user flows end-to-end
- Verify blockchain transactions
- Check browser console for errors

## 📄 License

This project is part of the Continuum AI Agent platform.

## 🆘 Support

For issues or questions:

1. Check [Troubleshooting](#-troubleshooting) section
2. Review [Documentation](#-documentation)
3. Check backend logs for errors
4. Verify environment configuration
5. Test backend endpoints directly

## 🎯 Next Steps

After setting up the frontend:

1. ✅ Configure environment variables
2. ✅ Start backend services (Node.js + Python)
3. ✅ Launch the frontend development server
4. ✅ Connect your wallet
5. ✅ Launch an agent via `/launch-agent`
6. ✅ Chat with your agent via `/chat`
7. ✅ Verify transactions on BSC Testnet Explorer
8. ✅ View agent memory and state

Happy building! 🚀
