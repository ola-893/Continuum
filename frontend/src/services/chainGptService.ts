// frontend/src/services/chainGptService.ts
import axios, { AxiosInstance } from 'axios';

const CHAINGPT_API_BASE_URL = 'https://api.chaingpt.org/v1';

class ChainGptService {
    private apiClient: AxiosInstance;
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = import.meta.env.VITE_CHAINGPT_API_KEY;
        if (!this.apiKey) {
            console.error("VITE_CHAINGPT_API_KEY is not set in the environment.");
        }

        this.apiClient = axios.create({
            baseURL: CHAINGPT_API_BASE_URL,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
    }

    async getChatResponse(prompt: string, context: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error("ChainGPT API key is not configured.");
        }
        try {
            const response = await this.apiClient.post('/llm/chat', {
                prompt,
                context,
            });
            return response.data.choices[0].message.content;
        } catch (error: any) {
            console.error('Error communicating with ChainGPT LLM:', error.response ? error.response.data : error.message);
            throw new Error("Failed to get response from ChainGPT LLM.");
        }
    }
}

export const chainGptService = new ChainGptService();
