// cli/src/index.ts
import { Unibase } from 'unibaseio';
import axios, { AxiosInstance } from 'axios';
import dotenv from 'dotenv';
import inquirer from 'inquirer';

dotenv.config();

// --- Re-implementing AgentState and services for the CLI ---

interface AgentInteraction {
    user: string;
    agent: string;
    timestamp: number;
}

interface AgentState {
    version: number;
    createdAt: number;
    updatedAt: number;
    preferences: Record<string, any>;
    interactionHistory: AgentInteraction[];
    goals: string[];
    learnedSummary: string;
}

const AGENT_STATE_KEY = 'continuum-agent-state';

// --- Unibase Service ---
const unibase = new Unibase();

async function getAgentState(userAddress: string): Promise<AgentState> {
    try {
        const state = await unibase.retrieve(`${AGENT_STATE_KEY}-${userAddress}`);
        if (state && state.version) return state as AgentState;
    } catch (e) {}
    return {
        version: 1, createdAt: Date.now(), updatedAt: Date.now(),
        preferences: {}, interactionHistory: [], goals: ["Find the user a suitable property."],
        learnedSummary: "The agent has not learned anything yet.",
    };
}

async function saveAgentState(userAddress: string, state: AgentState): Promise<void> {
    state.updatedAt = Date.now();
    await unibase.store(`${AGENT_STATE_KEY}-${userAddress}`, state);
}


// --- ChainGPT Service ---
const apiClient: AxiosInstance = axios.create({
    baseURL: 'https://api.chaingpt.org/v1',
    headers: {
        'Authorization': `Bearer ${process.env.CHAINGPT_API_KEY}`,
        'Content-Type': 'application/json',
    },
});

async function getChatResponse(prompt: string, context: string): Promise<string> {
    const response = await apiClient.post('/llm/chat', { prompt, context });
    return response.data.choices[0].message.content;
}

// --- Main CLI Logic ---

async function main() {
    console.log("--- Continuum Agent CLI ---");

    const { userAddress } = await inquirer.prompt([
        { type: 'input', name: 'userAddress', message: 'Enter your wallet address:' }
    ]);

    if (!userAddress) {
        console.error("User address is required.");
        return;
    }

    let agentState = await getAgentState(userAddress);

    console.log("\n--- Current Agent State ---");
    console.log(JSON.stringify(agentState, null, 2));

    while (true) {
        const { userInput } = await inquirer.prompt([
            { type: 'input', name: 'userInput', message: '\nEnter your message (or "exit"):' }
        ]);

        if (userInput.toLowerCase() === 'exit') break;

        const context = `Agent State: ${JSON.stringify(agentState)}\n\nUser Input: ${userInput}`;
        const agentResponse = await getChatResponse(userInput, context);

        console.log(`\nAgent: ${agentResponse}`);

        agentState.interactionHistory.push({ user: userInput, agent: agentResponse, timestamp: Date.now() });
        // In a real app, you would parse the LLM response for state updates.
        // For this demo, we'll just save the history.

        await saveAgentState(userAddress, agentState);
        console.log("(Agent state has been updated and saved to Unibase)");
    }

    console.log("\nExiting CLI. Goodbye!");
}

main().catch(console.error);
