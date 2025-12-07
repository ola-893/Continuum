# Continuum - The AI-Powered Web3 Copilot

Continuum is a sophisticated, chat-based Web3 copilot on BNB Chain that acts as an intelligent, evolving agent to securely manage on-chain activities.

Through a natural language interface, Continuum can research protocols, audit smart contracts, execute transactions, and learn from user interactions, all while being protected by a real sign-to-pay mechanism and server-enforced safety controls.

This project was built to meet the rigorous requirements of both the ChainGPT Super Web3 Agent Bounty and the Unibase On-Chain Immortal AI Agent Challenge.

## ⛓️ ChainGPT Bounty Compliance

Continuum is a fully compliant Super Web3 Agent that uses ChainGPT's powerful AI infrastructure to create a seamless and secure user experience.

*   ✅ **Dual API Integration**: Continuum uses two ChainGPT APIs:
    1.  **Web3 LLM**: Powers the agent's core conversational and reasoning abilities.
    2.  **Smart Contract Auditor**: Provides on-demand, dynamic security analysis of user-provided smart contracts.
*   ✅ **Real x402 Sign-to-Pay Flow**: Every interaction with the AI is authorized by the Quack x402 protocol. A backend server issues a 402 Payment Required challenge, and the user must sign an EIP-712 message to generate a valid X-PAYMENT header, creating a real, verifiable sign-to-pay transaction.
*   ✅ **Multiple On-Chain Actions**: The agent can execute multiple distinct on-chain actions, including Contract Calls (to create yield streams) and Token Transfers (of any ERC20 token).
*   ✅ **Robust Safety Controls**:
    *   **Server-Enforced Spend Caps**: Users can set a spend limit that is enforced by the backend, preventing the agent from initiating transactions that exceed their risk tolerance.
    *   **On-Chain Whitelist**: A smart contract-level access control list, managed by the admin, ensures only authorized users can perform sensitive actions.
    *   **Human-Readable Transaction Previews**: Before any transaction is sent, a clear modal displays all parameters and includes an explicit risk acknowledgment checkbox.
    *   **Persistent Activity Log**: A server-side log records every on-chain action the agent takes, providing a durable and auditable history.
*   ✅ **Network Toggle**: A UI toggle allows users to seamlessly switch between BSC Mainnet and BSC Testnet.

## 🧠 Unibase Bounty Compliance

Continuum is an "Immortal AI Agent" that uses Unibase to achieve a persistent, evolving, and platform-agnostic existence.

*   ✅ **Immortal Agent & Sovereign Memory**: The agent's "mind" is a structured AgentState object containing its preferences, goals, interaction history, and a learned summary of its identity. This entire state is stored as a single object on Unibase's decentralized memory layer.
*   ✅ **Agent Evolution**: After every interaction, the agent's state is passed to the LLM, which is prompted to update the state based on the new information. The updated state is then saved back to Unibase, allowing the agent to continuously learn and evolve. A debug view in the UI makes this evolution transparent.
*   ✅ **Simulated BitAgent Integration**: The project includes a simulated integration with the BitAgent launchpad, demonstrating the architectural pattern for launching an on-chain agent via a dedicated backend service.
*   ✅ **Cross-Platform Interoperability**: To prove the agent's mind is not tied to the web UI, a standalone CLI application is provided. This CLI can connect to the same Unibase memory, retrieve the agent's state, and interact with it, demonstrating true cross-platform knowledge sharing.

## 🏗️ Technical Stack

*   **Blockchain**: BNB Chain (EVM)
*   **Frontend**: React, TypeScript, Vite, ethers.js, wagmi
*   **Backend**: Node.js, Express.js (for Q402, spend caps, logging)
*   **Smart Contracts**: Solidity, Hardhat
*   **AI & Memory**: ChainGPT, Unibase
*   **CLI**: Node.js, inquirer

## 🔮 Future Vision

Continuum is more than a hackathon project; it is a blueprint for the future of human-AI collaboration in Web3. By combining a powerful AI, decentralized memory, and robust security, we can create agents that act as true partners, securely managing the complexities of the decentralized world on our behalf.
