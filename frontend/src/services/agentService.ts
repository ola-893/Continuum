// frontend/src/services/agentService.ts
// @ts-ignore
import { Unibase } from 'unibaseio';
import { AgentState } from '../types/agent';
import { chainGptService } from './chainGptService'; // Assuming a frontend chainGptService for summarization

const AGENT_STATE_KEY = 'continuum-agent-state';

class AgentService {
    private unibase: Unibase;

    constructor() {
        this.unibase = new Unibase();
    }

    async getAgentState(userAddress: string): Promise<AgentState> {
        try {
            const state = await this.unibase.retrieve(`${AGENT_STATE_KEY}-${userAddress}`);
            if (state && state.version) {
                return state as AgentState;
            }
        } catch (error) {
            console.warn("No existing agent state found. Initializing a new one.");
        }
        return this.initializeAgentState();
    }

    async saveAgentState(userAddress: string, state: AgentState): Promise<void> {
        state.updatedAt = Date.now();
        await this.unibase.store(`${AGENT_STATE_KEY}-${userAddress}`, state);
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

    async processInteraction(userAddress: string, userInput: string): Promise<{newState: AgentState, agentResponse: string}> {
        const currentState = await this.getAgentState(userAddress);
        
        // Prepare the context for the LLM
        const context = `
            Current Agent State:
            - Preferences: ${JSON.stringify(currentState.preferences)}
            - Interaction History: ${currentState.interactionHistory.slice(-5).map(i => `User: "${i.user}" -> Agent: "${i.agent}"`).join('\n')}
            - Goals: ${currentState.goals.join(', ')}
            - Learned Summary: ${currentState.learnedSummary}

            New user input: "${userInput}"

            Based on this, provide a conversational response and an updated JSON object for the agent's state.
            The JSON object should be enclosed in a markdown code block.
        `;

        // For now, we'll use the frontend chatService. This will be replaced by BitAgent.
        const llmResponse = await chainGptService.getChatResponse(userInput, context);
        
        // Parse the LLM response to extract the new state and the conversational response
        // This is a simplified parsing logic.
        const newStateJson = llmResponse.match(/```json\n([\s\S]*?)\n```/);
        const conversationalResponse = llmResponse.replace(/```json\n([\s\S]*?)\n```/, '').trim();

        let newState = currentState;
        if (newStateJson && newStateJson[1]) {
            try {
                newState = JSON.parse(newStateJson[1]);
            } catch (error) {
                console.error("Failed to parse new agent state from LLM response:", error);
            }
        }

        // Add the new interaction to the history
        newState.interactionHistory.push({ user: userInput, agent: conversationalResponse, timestamp: Date.now() });

        await this.saveAgentState(userAddress, newState);

        return { newState, agentResponse: conversationalResponse };
    }
}

export const agentService = new AgentService();
