import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { q402Middleware } from './q402';
import { chainGptService } from './chainGptService';
import { bitAgentService } from './bitAgentService';
import { store } from './store';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Continuum AI Agent Backend is running!');
});

app.post('/api/chat', q402Middleware, async (req, res) => {
    try {
        const { prompt, userAddress } = req.body;
        
        if (prompt.toLowerCase().startsWith('transfer')) {
            const spendCap = store.spendCaps[userAddress] || Infinity;
            const amount = parseFloat(prompt.split(' ')[1]);
            if (amount > spendCap) {
                return res.status(403).json({ error: `Transaction amount exceeds your spend cap of ${spendCap}.` });
            }
        }

        const context = `User Address: ${userAddress}`;
        const response = await chainGptService.getChatResponse(prompt, context);
        
        res.json({ message: response });

    } catch (error) {
        res.status(500).json({ error: 'Failed to process your request.' });
    }
});

app.post('/api/launch-agent', async (req, res) => {
    try {
        const { agentName, agentTicker } = req.body;
        const agentId = await bitAgentService.launchAgent(agentName, agentTicker);
        res.json({ agentId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to launch agent.' });
    }
});

// Activity Log & Spend Cap Endpoints...
// ... (endpoints remain the same)

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});