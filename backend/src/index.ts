import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { q402Middleware } from './q402';
import { ChainGPTService } from './chainGptService';
import { bitAgentService } from './bitAgentService';
import { createAIPAgentService, AIPAgentService } from './aipAgentService';
import { store } from './store';
import { getConfig, logConfig, AppConfig } from './config';

dotenv.config();

// Validate and load configuration
let config: AppConfig;
try {
    config = getConfig();
    logConfig(config);
} catch (error) {
    console.error('[Config] Configuration validation failed:');
    console.error(error instanceof Error ? error.message : error);
    console.error('\nPlease check your .env file and ensure all required variables are set.');
    process.exit(1);
}

const app = express();
const port = config.port;

// Initialize AIP Agent service
let aipAgentService: AIPAgentService;
try {
    aipAgentService = createAIPAgentService(
        config.aipAgent.pythonServiceUrl,
        config.aipAgent.timeout,
        config.aipAgent.maxRetries
    );
    console.log('[AIPAgent] Service initialized');
} catch (error) {
    console.error('[AIPAgent] Failed to initialize service:', error);
    console.error('The application will continue, but AIP Agent features will not be available.');
}

// Initialize ChainGPT service (optional)
let chainGptService: ChainGPTService | null = null;
try {
    const chainGptApiKey = process.env.CHAINGPT_API_KEY;
    if (chainGptApiKey) {
        chainGptService = new ChainGPTService(chainGptApiKey);
        console.log('[ChainGPT] Service initialized');
    } else {
        console.log('[ChainGPT] API key not configured, service disabled');
    }
} catch (error) {
    console.error('[ChainGPT] Failed to initialize service:', error);
    console.error('The application will continue, but ChainGPT features will not be available.');
}

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Continuum AI Agent Backend is running!');
});

app.post('/api/chat', q402Middleware, async (req, res) => {
    try {
        const { prompt, userAddress } = req.body;
        
        if (!chainGptService) {
            return res.status(503).json({ 
                error: 'ChainGPT service not available',
                message: 'ChainGPT API key not configured'
            });
        }
        
        if (prompt.toLowerCase().startsWith('transfer')) {
            const spendCap = store.spendCaps[userAddress] || Infinity;
            const amount = parseFloat(prompt.split(' ')[1]);
            if (amount > spendCap) {
                return res.status(403).json({ error: `Transaction amount exceeds your spend cap of ${spendCap}.` });
            }
        }

        const result = await chainGptService.chatCompletion({
            question: prompt,
            contextInjection: {
                purpose: `User Address: ${userAddress}`,
            }
        });
        
        res.json({ message: result.message });

    } catch (error) {
        console.error('[API] Chat request failed:', error);
        res.status(500).json({ error: 'Failed to process your request.' });
    }
});

app.post('/api/launch-agent', async (req, res) => {
    try {
        const { agentName, agentTicker, unibaseId } = req.body;
        
        if (!agentName || !agentTicker || !unibaseId) {
            return res.status(400).json({ 
                error: 'Missing required parameters: agentName, agentTicker, and unibaseId are required' 
            });
        }
        
        // Use AIP Agent service if available, otherwise fall back to BitAgent
        if (aipAgentService) {
            console.log('[API] Launching agent via AIP Agent service');
            
            try {
                // Step 1: Register agent on-chain
                console.log('[API] Step 1: Registering agent on-chain');
                const registerResult = await aipAgentService.registerAgent(unibaseId);
                
                // Step 2: Initialize agent with Memory Hub
                console.log('[API] Step 2: Initializing agent with Memory Hub');
                const initializeResult = await aipAgentService.initializeAgent({
                    agent_id: unibaseId,
                    description: `You are ${agentName}, a helpful AI assistant for real estate and property management.`,
                });
                
                // Return combined result
                res.json({
                    success: true,
                    agentName,
                    agentTicker,
                    unibaseId,
                    transactionHash: registerResult.transaction_hash,
                    walletAddress: registerResult.wallet_address,
                    status: initializeResult.status,
                    message: 'Agent launched successfully with blockchain identity and decentralized memory'
                });
            } catch (error) {
                console.error('[API] AIP Agent launch failed:', error);
                
                // Check if it's a Python service unavailable error
                if (error instanceof Error && error.message.includes('Cannot connect to Python service')) {
                    return res.status(503).json({
                        error: 'Python microservice unavailable',
                        message: error.message,
                        retryable: true
                    });
                }
                
                // Check if it's a timeout error
                if (error instanceof Error && error.message.includes('timeout')) {
                    return res.status(504).json({
                        error: 'Request timeout',
                        message: error.message,
                        retryable: true
                    });
                }
                
                throw error;
            }
        } else {
            // Fall back to BitAgent service
            console.log('[API] Launching agent via BitAgent service (AIP Agent not available)');
            const result = await bitAgentService.launchAgent(agentName, agentTicker, unibaseId);
            res.json(result);
        }
    } catch (error) {
        console.error('[API] Failed to launch agent:', error);
        res.status(500).json({ 
            error: error instanceof Error ? error.message : 'Failed to launch agent.' 
        });
    }
});

// POST /api/agent/query - Send query to agent
app.post('/api/agent/query', async (req, res) => {
    try {
        const { agentId, query, context } = req.body;
        
        if (!agentId || !query) {
            return res.status(400).json({
                error: 'Missing required parameters: agentId and query are required'
            });
        }
        
        if (!aipAgentService) {
            return res.status(503).json({
                error: 'AIP Agent service not available',
                message: 'Python microservice is not configured or unavailable'
            });
        }
        
        console.log('[API] Processing agent query');
        console.log(`  - Agent ID: ${agentId}`);
        console.log(`  - Query: ${query}`);
        
        try {
            const result = await aipAgentService.queryAgent(agentId, query, context);
            
            res.json({
                success: true,
                response: result.response,
                agentState: result.agent_state,
                interactionId: result.interaction_id
            });
        } catch (error) {
            console.error('[API] Agent query failed:', error);
            
            // Check if it's a Python service unavailable error
            if (error instanceof Error && error.message.includes('Cannot connect to Python service')) {
                return res.status(503).json({
                    error: 'Python microservice unavailable',
                    message: error.message,
                    retryable: true
                });
            }
            
            // Check if it's a timeout error
            if (error instanceof Error && error.message.includes('timeout')) {
                return res.status(504).json({
                    error: 'Request timeout',
                    message: error.message,
                    retryable: true
                });
            }
            
            throw error;
        }
    } catch (error) {
        console.error('[API] Failed to process agent query:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to process agent query'
        });
    }
});

// GET /api/agent/status/:id - Get agent status
app.get('/api/agent/status/:id', async (req, res) => {
    try {
        const agentId = req.params.id;
        
        if (!agentId) {
            return res.status(400).json({
                error: 'Missing required parameter: agentId'
            });
        }
        
        if (!aipAgentService) {
            return res.status(503).json({
                error: 'AIP Agent service not available',
                message: 'Python microservice is not configured or unavailable'
            });
        }
        
        console.log('[API] Getting agent status');
        console.log(`  - Agent ID: ${agentId}`);
        
        try {
            const status = await aipAgentService.getAgentStatus(agentId);
            
            res.json({
                success: true,
                agentId: status.agent_id,
                status: status.status,
                registered: status.registered,
                walletAddress: status.wallet_address,
                memoryHubConnected: status.memory_hub_connected
            });
        } catch (error) {
            console.error('[API] Get agent status failed:', error);
            
            // Check if it's a Python service unavailable error
            if (error instanceof Error && error.message.includes('Cannot connect to Python service')) {
                return res.status(503).json({
                    error: 'Python microservice unavailable',
                    message: error.message,
                    retryable: true
                });
            }
            
            // Check if it's a timeout error
            if (error instanceof Error && error.message.includes('timeout')) {
                return res.status(504).json({
                    error: 'Request timeout',
                    message: error.message,
                    retryable: true
                });
            }
            
            throw error;
        }
    } catch (error) {
        console.error('[API] Failed to get agent status:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to get agent status'
        });
    }
});

// GET /api/agent/memory/:id - Get agent memory
app.get('/api/agent/memory/:id', async (req, res) => {
    try {
        const agentId = req.params.id;
        
        if (!agentId) {
            return res.status(400).json({
                error: 'Missing required parameter: agentId'
            });
        }
        
        if (!aipAgentService) {
            return res.status(503).json({
                error: 'AIP Agent service not available',
                message: 'Python microservice is not configured or unavailable'
            });
        }
        
        console.log('[API] Getting agent memory');
        console.log(`  - Agent ID: ${agentId}`);
        
        try {
            const memory = await aipAgentService.getAgentMemory(agentId);
            
            res.json({
                success: true,
                agentId: memory.agent_id,
                state: memory.state,
                lastUpdated: memory.last_updated
            });
        } catch (error) {
            console.error('[API] Get agent memory failed:', error);
            
            // Check if it's a Python service unavailable error
            if (error instanceof Error && error.message.includes('Cannot connect to Python service')) {
                return res.status(503).json({
                    error: 'Python microservice unavailable',
                    message: error.message,
                    retryable: true
                });
            }
            
            // Check if it's a timeout error
            if (error instanceof Error && error.message.includes('timeout')) {
                return res.status(504).json({
                    error: 'Request timeout',
                    message: error.message,
                    retryable: true
                });
            }
            
            throw error;
        }
    } catch (error) {
        console.error('[API] Failed to get agent memory:', error);
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Failed to get agent memory'
        });
    }
});

// GET /api/health - Health check endpoint for frontend
app.get('/api/health', async (req, res) => {
    try {
        const health = {
            backend: 'connected',
            pythonService: 'disconnected',
            memoryHub: 'disconnected',
            timestamp: new Date().toISOString()
        };

        // Check Python service if available
        if (aipAgentService) {
            try {
                const isHealthy = await aipAgentService.healthCheck();
                health.pythonService = isHealthy ? 'connected' : 'disconnected';
                // If Python service is up, assume Memory Hub is managed there
                health.memoryHub = isHealthy ? 'connected' : 'disconnected';
            } catch (error) {
                console.error('[API] Python service health check failed:', error);
            }
        }

        res.json(health);
    } catch (error) {
        console.error('[API] Health check failed:', error);
        res.status(500).json({
            error: 'Health check failed',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Activity Log & Spend Cap Endpoints...
// ... (endpoints remain the same)

// Initialize BitAgent service before starting server
async function startServer() {
    try {
        // Initialize BitAgent service
        await bitAgentService.initialize(config.bitAgent);
        console.log('[BitAgent] Service ready');
        
        // Start Express server
        app.listen(port, () => {
            console.log(`[Server] Backend listening at http://localhost:${port}`);
        });
    } catch (error) {
        console.error('[Server] Failed to start:', error);
        process.exit(1);
    }
}

startServer();