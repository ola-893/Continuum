// backend/src/bitAgentService.ts
// Real BitAgent service implementation using AIP SDK

import { AIPClient, AgentLaunchParams, AgentLaunchResult, AgentDetails, AgentStatus, AgentUpdates } from './aip-sdk-wrapper';
import { BitAgentConfig } from './config';

class BitAgentService {
    private client: AIPClient | null = null;
    private initialized: boolean = false;

    /**
     * Initialize the BitAgent service with configuration
     */
    async initialize(config: BitAgentConfig): Promise<void> {
        try {
            this.client = new AIPClient({
                apiKey: config.apiKey,
                network: config.network,
                rpcUrl: config.rpcUrl,
            });

            await this.client.initialize();
            this.initialized = true;
            
            console.log(`[BitAgent] Service initialized successfully on ${config.network}`);
        } catch (error) {
            console.error('[BitAgent] Failed to initialize:', error);
            throw error;
        }
    }

    /**
     * Launch a new agent on the BitAgent launchpad
     */
    async launchAgent(agentName: string, agentTicker: string, unibaseId: string): Promise<AgentLaunchResult> {
        if (!this.initialized || !this.client) {
            throw new Error('BitAgent service not initialized. Call initialize() first.');
        }

        console.log(`[BitAgent] Launching agent...`);
        console.log(`  Name: ${agentName}`);
        console.log(`  Ticker: ${agentTicker}`);
        console.log(`  Unibase ID: ${unibaseId}`);

        const params: AgentLaunchParams = {
            name: agentName,
            ticker: agentTicker,
            unibaseId: unibaseId,
        };

        const result = await this.client.launchAgent(params);
        
        console.log(`[BitAgent] Agent launched successfully:`);
        console.log(`  Agent ID: ${result.agentId}`);
        console.log(`  Transaction Hash: ${result.transactionHash}`);
        
        return result;
    }

    /**
     * Get agent details from BitAgent
     */
    async getAgentDetails(agentId: string): Promise<AgentDetails> {
        if (!this.initialized || !this.client) {
            throw new Error('BitAgent service not initialized. Call initialize() first.');
        }

        return await this.client.getAgentDetails(agentId);
    }

    /**
     * Update agent configuration
     */
    async updateAgent(agentId: string, updates: AgentUpdates): Promise<void> {
        if (!this.initialized || !this.client) {
            throw new Error('BitAgent service not initialized. Call initialize() first.');
        }

        await this.client.updateAgent(agentId, updates);
    }

    /**
     * Check agent status
     */
    async getAgentStatus(agentId: string): Promise<AgentStatus> {
        if (!this.initialized || !this.client) {
            throw new Error('BitAgent service not initialized. Call initialize() first.');
        }

        return await this.client.getAgentStatus(agentId);
    }

    /**
     * Check if service is initialized
     */
    isInitialized(): boolean {
        return this.initialized;
    }
}

export const bitAgentService = new BitAgentService();
