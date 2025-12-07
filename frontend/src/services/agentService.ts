// frontend/src/services/agentService.ts
import axios, { AxiosInstance } from 'axios';
import { AgentState, AgentInteraction } from '../types/agent';

// Get API URL from environment variable or use default
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
// Get API timeout from environment variable or use default (30 seconds)
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10);

class AgentService {
    private client: AxiosInstance;
    private readonly AGENT_ID_STORAGE_KEY = 'continuum_agent_id';
    private readonly AGENT_INITIALIZED_KEY = 'continuum_agent_initialized';

    constructor() {
        this.client = axios.create({
            baseURL: API_URL,
            timeout: API_TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        
        console.log('[AgentService] Initialized with:', {
            apiUrl: API_URL,
            timeout: API_TIMEOUT,
        });
    }

    /**
     * Ensure agent is initialized for the user
     * Checks if agent exists, and if not, registers and initializes it
     */
    async ensureAgentInitialized(userAddress: string): Promise<void> {
        const agentId = this.getAgentId(userAddress);
        
        // Check if we've already initialized this agent in this session
        const storedAgentId = localStorage.getItem(this.AGENT_ID_STORAGE_KEY);
        const isInitialized = localStorage.getItem(this.AGENT_INITIALIZED_KEY);
        
        if (storedAgentId === agentId && isInitialized === 'true') {
            console.log('[AgentService] Agent already initialized:', agentId);
            return;
        }
        
        try {
            // Check if agent exists on backend
            const statusResponse = await this.client.get(`/api/agent/status/${agentId}`);
            
            if (statusResponse.data.success && statusResponse.data.registered) {
                console.log('[AgentService] Agent already registered:', agentId);
                // Store in local storage
                localStorage.setItem(this.AGENT_ID_STORAGE_KEY, agentId);
                localStorage.setItem(this.AGENT_INITIALIZED_KEY, 'true');
                return;
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                console.log('[AgentService] Agent not found, initializing new agent:', agentId);
            } else if (axios.isAxiosError(error) && error.response?.status === 503) {
                throw new Error('SERVICE_UNAVAILABLE');
            } else if (axios.isAxiosError(error) && error.response?.status === 504) {
                throw new Error('REQUEST_TIMEOUT');
            } else if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
                throw new Error('CONNECTION_REFUSED');
            } else {
                console.warn('[AgentService] Could not check agent status:', error);
            }
        }
        
        // Agent doesn't exist, initialize it
        try {
            console.log('[AgentService] Launching new agent:', agentId);
            const launchResponse = await this.client.post('/api/launch-agent', {
                agentName: `Continuum Agent`,
                agentTicker: 'CA',
                unibaseId: agentId,
            });
            
            if (launchResponse.data.success) {
                console.log('[AgentService] Agent launched successfully:', {
                    agentId,
                    transactionHash: launchResponse.data.transactionHash,
                    walletAddress: launchResponse.data.walletAddress,
                });
                
                // Store in local storage
                localStorage.setItem(this.AGENT_ID_STORAGE_KEY, agentId);
                localStorage.setItem(this.AGENT_INITIALIZED_KEY, 'true');
            } else {
                throw new Error('Agent launch returned unsuccessful response');
            }
        } catch (error) {
            console.error('[AgentService] Failed to initialize agent:', error);
            
            // Provide user-friendly error messages with error codes
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 409) {
                    // Agent already registered by another wallet - this is actually OK
                    console.log('[AgentService] Agent already registered, continuing...');
                    localStorage.setItem(this.AGENT_ID_STORAGE_KEY, agentId);
                    localStorage.setItem(this.AGENT_INITIALIZED_KEY, 'true');
                    return;
                } else if (error.response?.status === 402) {
                    throw new Error('INSUFFICIENT_FUNDS');
                } else if (error.response?.status === 503) {
                    throw new Error('SERVICE_UNAVAILABLE');
                } else if (error.response?.status === 504) {
                    throw new Error('REQUEST_TIMEOUT');
                } else if (error.code === 'ECONNREFUSED') {
                    throw new Error('CONNECTION_REFUSED');
                }
            }
            
            throw new Error('INITIALIZATION_FAILED');
        }
    }

    /**
     * Get agent state from backend (Membase)
     * State is stored in decentralized memory, not local storage
     */
    async getAgentState(userAddress: string): Promise<AgentState> {
        // Ensure agent is initialized before getting state
        await this.ensureAgentInitialized(userAddress);
        
        try {
            const agentId = this.getAgentId(userAddress);
            const response = await this.client.get(`/api/agent/memory/${agentId}`);
            
            if (response.data.success && response.data.state) {
                return this.mapBackendStateToAgentState(response.data.state);
            }
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                console.warn("No existing agent state found. Initializing a new one.");
            } else {
                console.error("Failed to retrieve agent state:", error);
            }
        }
        
        // Return default state if agent not found or error occurred
        return this.initializeAgentState();
    }

    /**
     * Save agent state - handled automatically by backend
     * This method is kept for backward compatibility but does nothing
     * as the backend automatically saves state after each interaction
     */
    async saveAgentState(_userAddress: string, _state: AgentState): Promise<void> {
        // State is automatically saved by backend after each query
        // This method is a no-op for backward compatibility
        console.log('State is automatically saved by backend after each interaction');
    }

    private initializeAgentState(): AgentState {
        return {
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            preferences: {},
            interactionHistory: [],
            goals: ["Find the user a suitable real estate property."],
            learnedSummary: "The agent has not learned anything about the user yet.",
        };
    }

    /**
     * Process user interaction via backend API
     * The backend handles LLM integration and state management
     */
    async processInteraction(
        userAddress: string, 
        userInput: string
    ): Promise<{ newState: AgentState; agentResponse: string }> {
        // Ensure agent is initialized before processing interaction
        await this.ensureAgentInitialized(userAddress);
        
        try {
            const agentId = this.getAgentId(userAddress);
            
            // Call backend API to process query
            const response = await this.client.post('/api/agent/query', {
                agentId,
                query: userInput,
                context: {
                    userAddress,
                    timestamp: Date.now(),
                },
            });

            if (response.data.success) {
                const newState = this.mapBackendStateToAgentState(response.data.agentState);
                const agentResponse = response.data.response;

                return { newState, agentResponse };
            } else {
                throw new Error('QUERY_FAILED');
            }
        } catch (error) {
            console.error('Failed to process interaction:', error);
            
            // Provide standardized error codes for better handling
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 503) {
                    throw new Error('SERVICE_UNAVAILABLE');
                } else if (error.response?.status === 504) {
                    throw new Error('REQUEST_TIMEOUT');
                } else if (error.response?.status === 404) {
                    throw new Error('AGENT_NOT_FOUND');
                } else if (error.response?.status === 402) {
                    throw new Error('INSUFFICIENT_FUNDS');
                } else if (error.response?.status === 409) {
                    throw new Error('AGENT_ALREADY_REGISTERED');
                } else if (error.code === 'ECONNREFUSED') {
                    throw new Error('CONNECTION_REFUSED');
                } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                    throw new Error('REQUEST_TIMEOUT');
                }
            }
            
            // Re-throw if it's already one of our error codes
            if (error instanceof Error && error.message.includes('_')) {
                throw error;
            }
            
            throw new Error('QUERY_FAILED');
        }
    }

    /**
     * Generate agent ID from user address
     * Format: continuum_agent_{userAddress}
     */
    private getAgentId(userAddress: string): string {
        return `continuum_agent_${userAddress}`;
    }

    /**
     * Map backend state format to frontend AgentState format
     */
    private mapBackendStateToAgentState(backendState: any): AgentState {
        return {
            version: backendState.version || 1,
            createdAt: backendState.createdAt || Date.now(),
            updatedAt: backendState.updatedAt || Date.now(),
            preferences: backendState.preferences || {},
            interactionHistory: this.mapInteractionHistory(backendState.interactionHistory || []),
            goals: backendState.goals || ["Find the user a suitable real estate property."],
            learnedSummary: backendState.learnedSummary || "The agent has not learned anything about the user yet.",
        };
    }

    /**
     * Map backend interaction history to frontend format
     */
    private mapInteractionHistory(backendHistory: any[]): AgentInteraction[] {
        return backendHistory.map((interaction: any) => ({
            user: interaction.user || interaction.userQuery || '',
            agent: interaction.agent || interaction.agentResponse || '',
            timestamp: interaction.timestamp || Date.now(),
        }));
    }
}

export const agentService = new AgentService();
