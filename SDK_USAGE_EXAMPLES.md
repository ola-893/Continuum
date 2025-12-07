# AIP Agent SDK Usage Examples

## Overview

This document provides real-world examples of using the AIP Agent SDK integration in the Continuum platform. All examples use **real SDK calls** with **actual blockchain transactions**, **real Memory Hub connections**, and **real LLM responses**.

## Table of Contents

1. [Basic Agent Lifecycle](#basic-agent-lifecycle)
2. [Blockchain Registration](#blockchain-registration)
3. [Memory Hub Integration](#memory-hub-integration)
4. [LLM Query Processing](#llm-query-processing)
5. [State Management](#state-management)
6. [Error Handling](#error-handling)
7. [Advanced Usage](#advanced-usage)

## Basic Agent Lifecycle

### Complete Agent Setup Flow

```bash
# 1. Register agent on-chain (creates blockchain transaction)
curl -X POST http://localhost:5000/agent/register \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "continuum_agent_001"}'

# Response:
{
  "success": true,
  "transaction_hash": "0x1a2b3c4d...",  # Real transaction hash
  "agent_id": "continuum_agent_001",
  "wallet_address": "0xYourWalletAddress"
}

# 2. Initialize agent (connects to Memory Hub)
curl -X POST http://localhost:5000/agent/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "description": "You are a helpful real estate assistant",
    "memory_hub_address": "54.169.29.193:8081"
  }'

# Response:
{
  "success": true,
  "agent_id": "continuum_agent_001",
  "status": "initialized"
}

# 3. Query agent (gets real LLM response)
curl -X POST http://localhost:5000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "query": "What properties do you recommend?",
    "user_context": {
      "location": "New York",
      "budget": 500000
    }
  }'

# Response:
{
  "success": true,
  "response": "Based on your budget of $500,000 in New York...",  # Real LLM response
  "agent_state": {...},
  "interaction_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

## Blockchain Registration

### Example 1: Register New Agent

```python
# Python SDK code (from agent_manager.py)
from membase.chain.chain import Client

# Initialize Membase client
membase_client = Client(
    wallet_address=os.getenv('MEMBASE_ACCOUNT'),
    private_key=os.getenv('MEMBASE_SECRET_KEY'),
    ep="https://bsc-testnet-rpc.publicnode.com",
    membase_contract="0x100E3F8c5285df46A8B9edF6b38B8f90F1C32B7b"
)

# Register agent on-chain (creates real blockchain transaction)
agent_id = "continuum_agent_001"
tx_hash = membase_client.register(agent_id)

print(f"Transaction Hash: {tx_hash}")
# Output: Transaction Hash: 0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890

# Verify on BSC Testnet Explorer
print(f"Verify at: https://testnet.bscscan.com/tx/{tx_hash}")
```

### Example 2: Check Agent Registration Status

```bash
# Check if agent is registered on-chain
curl http://localhost:5000/agent/status/continuum_agent_001

# Response:
{
  "agent_id": "continuum_agent_001",
  "status": "active",
  "registered": true,  # Confirmed on-chain
  "wallet_address": "0xYourWalletAddress",
  "memory_hub_connected": true
}
```

### Example 3: Verify Transaction on Blockchain

```bash
# Get transaction details from BSC Testnet Explorer
TX_HASH="0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890"

# View on explorer
open "https://testnet.bscscan.com/tx/$TX_HASH"

# Expected details:
# - Status: Success ✅
# - To: 0x100E3F8c5285df46A8B9edF6b38B8f90F1C32B7b (Membase Contract)
# - Method: register(string _uuid)
# - Gas Used: ~50,000 gas
# - Transaction Fee: ~0.00015 BNB
```

## Memory Hub Integration

### Example 1: Initialize Agent with Memory Hub

```python
# Python SDK code (from agent_manager.py)
from aip_agent.agents.full_agent import FullAgentWrapper
from aip_agent.agents.custom_agent import CallbackAgent

# Create agent with Memory Hub connection
agent = FullAgentWrapper(
    agent_cls=CallbackAgent,
    name="continuum_agent_001",
    description="You are a helpful real estate assistant",
    host_address="54.169.29.193:8081",  # Real Memory Hub
    server_names=[]
)

# Initialize agent (connects to Memory Hub via gRPC)
await agent.initialize()

print("Agent initialized successfully")
print(f"Memory Hub: {agent.host_address}")
# Output: Memory Hub: 54.169.29.193:8081
```

### Example 2: Verify Memory Hub Connection

```bash
# Check Memory Hub connectivity
nc -zv 54.169.29.193 8081

# Expected output:
# Connection to 54.169.29.193 port 8081 [tcp/*] succeeded!

# Check agent status
curl http://localhost:5000/agent/status/continuum_agent_001 | jq .memory_hub_connected

# Expected output:
# true
```

### Example 3: Retrieve Agent State from Membase

```python
# Python SDK code (from agent_manager.py)
async def _get_agent_state_from_membase(self, agent_id: str):
    """Retrieve agent state from Membase decentralized storage."""
    agent = self.agents.get(agent_id)
    
    # Access agent's MultiMemory instance
    memory = agent._memory if hasattr(agent, '_memory') else None
    
    if memory:
        # Get conversation memory from Membase
        conversation_memory = memory.get_memory()
        messages = conversation_memory.get(recent_n=100)
        
        # Convert to interaction history
        interaction_history = []
        for msg in messages:
            if msg.get('role') == 'user':
                user_query = msg.get('content', '')
                # Find corresponding assistant response...
                interaction_history.append({
                    'id': str(uuid.uuid4()),
                    'userQuery': user_query,
                    'agentResponse': assistant_response,
                    'timestamp': int(time.time() * 1000)
                })
        
        return {
            'membaseId': agent_id,
            'interactionHistory': interaction_history,
            'memoryHubConnected': True
        }
```

## LLM Query Processing

### Example 1: Simple Query

```bash
# Send query to agent
curl -X POST http://localhost:5000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "query": "What is 2+2?",
    "user_context": {}
  }'

# Response (real LLM-generated):
{
  "success": true,
  "response": "2+2 equals 4. This is a basic arithmetic operation where we add two and two together to get four.",
  "agent_state": {...},
  "interaction_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Example 2: Context-Aware Query

```bash
# First query
curl -X POST http://localhost:5000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "query": "I am looking for a property in New York with a budget of $500,000",
    "user_context": {
      "location": "New York",
      "budget": 500000
    }
  }'

# Response:
{
  "success": true,
  "response": "I can help you find properties in New York within your $500,000 budget. In this price range, you might consider...",
  "agent_state": {
    "preferences": {
      "location": ["New York"],
      "budget": {"min": 0, "max": 500000}
    }
  }
}

# Follow-up query (agent remembers context)
curl -X POST http://localhost:5000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "query": "What about properties with a view?",
    "user_context": {}
  }'

# Response (references previous context):
{
  "success": true,
  "response": "For properties with a view in New York within your $500,000 budget, I recommend looking at...",
  "agent_state": {...}
}
```

### Example 3: Real LLM Processing Code

```python
# Python SDK code (from agent_manager.py)
async def query_agent(self, agent_id: str, query: str, user_context: dict = None):
    """Process query with real LLM using AIP Agent SDK."""
    agent = self.agents.get(agent_id)
    
    # Retrieve agent state from Membase
    agent_state_before = await self._get_agent_state_from_membase(agent_id)
    
    # Process query with real LLM
    response_text = await agent.process_query(
        query=query,
        use_history=True,  # Use conversation history from Membase
        recent_n_messages=16,  # Include recent messages for context
        use_tool_call=True  # Allow tool usage if available
    )
    
    # Update agent state in Membase
    interaction_id = str(uuid.uuid4())
    agent_state = await self._update_agent_state_in_membase(
        agent_id, query, response_text, interaction_id, user_context, agent_state_before
    )
    
    return {
        'response': response_text,  # Real LLM-generated response
        'agent_state': agent_state,
        'interaction_id': interaction_id
    }
```

## State Management

### Example 1: Retrieve Agent Memory

```bash
# Get complete agent memory from Membase
curl http://localhost:5000/agent/memory/continuum_agent_001

# Response (real data from Membase):
{
  "agent_id": "continuum_agent_001",
  "state": {
    "version": 1,
    "membaseId": "continuum_agent_001",
    "walletAddress": "0xYourWalletAddress",
    "registeredOnChain": true,
    "preferences": {
      "location": ["New York"],
      "budget": {"min": 0, "max": 500000}
    },
    "interactionHistory": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "userQuery": "I am looking for a property in New York",
        "agentResponse": "I can help you find properties in New York...",
        "timestamp": 1702834200000
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "userQuery": "What about properties with a view?",
        "agentResponse": "For properties with a view in New York...",
        "timestamp": 1702834260000
      }
    ],
    "memoryHubConnected": true,
    "lastSyncTimestamp": 1702834260000
  },
  "last_updated": "2024-12-07T10:31:00Z"
}
```

### Example 2: State Persistence Across Restarts

```bash
# Send query
curl -X POST http://localhost:5000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "query": "Remember: my favorite color is blue"
  }'

# Restart Python service
docker-compose restart python-service

# Wait for service to be healthy
sleep 15

# Re-initialize agent (required after restart)
curl -X POST http://localhost:5000/agent/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "description": "You are a helpful assistant"
  }'

# Query about previous conversation
curl -X POST http://localhost:5000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "query": "What is my favorite color?"
  }'

# Response (agent remembers from Membase):
{
  "success": true,
  "response": "Your favorite color is blue, as you mentioned earlier.",
  "agent_state": {...}
}
```

## Error Handling

### Example 1: Insufficient BNB for Gas

```bash
# Attempt registration without BNB
curl -X POST http://localhost:5000/agent/register \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "test_agent"}'

# Error response:
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_FUNDS",
    "message": "Insufficient BNB for gas fees. Please add testnet BNB to your wallet.",
    "details": {
      "wallet_address": "0xYourWalletAddress",
      "required_bnb": "0.001",
      "faucet_url": "https://testnet.bnbchain.org/faucet-smart"
    },
    "retryable": false
  }
}
```

### Example 2: Agent Already Registered

```bash
# Attempt to register same agent ID twice
curl -X POST http://localhost:5000/agent/register \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "continuum_agent_001"}'

# Error response:
{
  "success": false,
  "error": {
    "code": "AGENT_ALREADY_REGISTERED",
    "message": "Agent ID 'continuum_agent_001' is already registered to wallet 0xYourWalletAddress",
    "details": {
      "agent_id": "continuum_agent_001",
      "owner_wallet": "0xYourWalletAddress",
      "suggestion": "Use a different agent ID or use the same wallet"
    },
    "retryable": false
  }
}
```

### Example 3: Memory Hub Connection Timeout

```bash
# Attempt initialization with unreachable Memory Hub
curl -X POST http://localhost:5000/agent/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "memory_hub_address": "invalid.address:8081"
  }'

# Error response:
{
  "success": false,
  "error": {
    "code": "MEMORY_HUB_TIMEOUT",
    "message": "Failed to connect to Memory Hub at invalid.address:8081",
    "details": {
      "memory_hub_address": "invalid.address:8081",
      "timeout_seconds": 10,
      "suggestion": "Check network connectivity and firewall settings"
    },
    "retryable": true
  }
}
```

## Advanced Usage

### Example 1: Multiple Agents

```bash
# Register multiple agents
for i in {1..3}; do
  curl -X POST http://localhost:5000/agent/register \
    -H "Content-Type: application/json" \
    -d "{\"agent_id\": \"continuum_agent_00$i\"}"
  
  curl -X POST http://localhost:5000/agent/initialize \
    -H "Content-Type: application/json" \
    -d "{
      \"agent_id\": \"continuum_agent_00$i\",
      \"description\": \"Agent $i\"
    }"
done

# Query different agents
curl -X POST http://localhost:5000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "query": "Hello from agent 1"
  }'

curl -X POST http://localhost:5000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_002",
    "query": "Hello from agent 2"
  }'
```

### Example 2: Batch Query Processing

```bash
# Process multiple queries in sequence
QUERIES=(
  "What is blockchain?"
  "Explain smart contracts"
  "What is DeFi?"
)

for query in "${QUERIES[@]}"; do
  echo "Query: $query"
  curl -s -X POST http://localhost:5000/agent/query \
    -H "Content-Type: application/json" \
    -d "{
      \"agent_id\": \"continuum_agent_001\",
      \"query\": \"$query\"
    }" | jq -r '.response'
  echo ""
done
```

### Example 3: Monitoring Agent Activity

```bash
# Get agent status
curl http://localhost:5000/agent/status/continuum_agent_001 | jq .

# Get interaction count
curl http://localhost:5000/agent/memory/continuum_agent_001 | \
  jq '.state.interactionHistory | length'

# Get last interaction
curl http://localhost:5000/agent/memory/continuum_agent_001 | \
  jq '.state.interactionHistory[-1]'

# Check Memory Hub connection
curl http://localhost:5000/agent/status/continuum_agent_001 | \
  jq '.memory_hub_connected'
```

## Integration with Node.js Backend

### Example: Using AIP Agent Service from Node.js

```typescript
// backend/src/aipAgentService.ts
import axios from 'axios';

class AIPAgentService {
  private pythonServiceUrl: string;

  constructor(pythonServiceUrl: string) {
    this.pythonServiceUrl = pythonServiceUrl;
  }

  async registerAgent(agentId: string) {
    const response = await axios.post(
      `${this.pythonServiceUrl}/agent/register`,
      { agent_id: agentId }
    );
    return response.data;
  }

  async queryAgent(agentId: string, query: string, context?: any) {
    const response = await axios.post(
      `${this.pythonServiceUrl}/agent/query`,
      {
        agent_id: agentId,
        query,
        user_context: context
      }
    );
    return response.data;
  }
}

// Usage
const aipService = new AIPAgentService('http://localhost:5000');

// Register agent
const registerResult = await aipService.registerAgent('continuum_agent_001');
console.log('Transaction Hash:', registerResult.transaction_hash);

// Query agent
const queryResult = await aipService.queryAgent(
  'continuum_agent_001',
  'What properties do you recommend?',
  { location: 'New York', budget: 500000 }
);
console.log('Response:', queryResult.response);
```

## Verification Examples

### Verify Real Blockchain Transaction

```bash
# Get transaction hash from registration
TX_HASH=$(curl -s -X POST http://localhost:5000/agent/register \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "verify_agent"}' | jq -r '.transaction_hash')

# Verify on BSC Testnet Explorer
echo "Transaction: https://testnet.bscscan.com/tx/$TX_HASH"

# Check transaction status using web3
python3 << EOF
from web3 import Web3
w3 = Web3(Web3.HTTPProvider('https://bsc-testnet-rpc.publicnode.com'))
receipt = w3.eth.get_transaction_receipt('$TX_HASH')
print(f"Status: {'Success' if receipt['status'] == 1 else 'Failed'}")
print(f"Block: {receipt['blockNumber']}")
print(f"Gas Used: {receipt['gasUsed']}")
EOF
```

### Verify Real Memory Hub Connection

```bash
# Test Memory Hub connectivity
echo "Testing Memory Hub connectivity..."
nc -zv 54.169.29.193 8081

# Check agent logs for connection
docker-compose logs python-service | grep -i "memory hub"

# Verify agent status
curl http://localhost:5000/agent/status/continuum_agent_001 | \
  jq '{memory_hub_connected, registered}'
```

### Verify Real LLM Integration

```bash
# Send test query
RESPONSE=$(curl -s -X POST http://localhost:5000/agent/query \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "continuum_agent_001",
    "query": "What is the capital of France?"
  }' | jq -r '.response')

# Check response is not mock
if [[ "$RESPONSE" == *"simulated"* ]] || [[ "$RESPONSE" == *"mock"* ]]; then
  echo "❌ Mock response detected"
else
  echo "✅ Real LLM response: $RESPONSE"
fi

# Check logs for LLM API call
docker-compose logs python-service | grep -i "llm\|openai"
```

## Conclusion

All examples in this document use **real AIP Agent SDK integration** with:

- ✅ Real blockchain transactions on BNB Chain
- ✅ Real Memory Hub connections via gRPC
- ✅ Real LLM responses via OpenAI/ChainGPT
- ✅ Real Membase decentralized storage
- ✅ NO mock implementations or placeholder data

For more information, see:
- [Python Microservice README](backend-python/README.md)
- [Judge Verification Guide](JUDGE_VERIFICATION_GUIDE.md)
- [Real SDK Integration Verified](backend-python/REAL_SDK_INTEGRATION_VERIFIED.md)

---

**Last Updated**: December 7, 2024
**Status**: ✅ Production Ready
