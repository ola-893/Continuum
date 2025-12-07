// backend/src/chainGptService.ts
import axios, { AxiosInstance } from 'axios';

const CHAINGPT_API_BASE_URL = 'https://api.chaingpt.org/v1';

export class ChainGptService {
    private apiClient: AxiosInstance;
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = process.env.CHAINGPT_API_KEY;
        if (!this.apiKey) {
            console.error("FATAL: CHAINGPT_API_KEY is not set in the environment.");
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
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error communicating with ChainGPT LLM:', error.response ? error.response.data : error.message);
            } else if (error instanceof Error) {
                console.error('Error communicating with ChainGPT LLM:', error.message);
            } else {
                console.error('An unknown error occurred:', error);
            }
            throw new Error("Failed to get response from ChainGPT LLM.");
        }
    }
}

export const chainGptService = new ChainGptService();
