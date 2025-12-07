// frontend/src/types/agent.ts

export interface AgentInteraction {
    user: string;
    agent: string;
    timestamp: number;
}

export interface AgentState {
    version: number;
    createdAt: number;
    updatedAt: number;
    preferences: Record<string, any>;
    interactionHistory: AgentInteraction[];
    goals: string[];
    learnedSummary: string;
}
