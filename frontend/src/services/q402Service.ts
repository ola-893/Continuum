// frontend/src/services/q402Service.ts
import { ethers } from 'ethers';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

// EIP-712 domain for signing - must match the backend
const domain = {
    name: 'X402 Payment',
    version: '1',
    chainId: 97, // BSC Testnet
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
};

// EIP-712 types for the witness - must match the backend
const types = {
    Witness: [
        { name: 'owner', type: 'address' },
        { name: 'token', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'to', type: 'address' },
        { name: 'deadline', type: 'uint256' },
        { name: 'paymentId', type: 'bytes32' },
        { name: 'nonce', type: 'uint256' },
    ],
};

class Q402Service {
    private provider: ethers.BrowserProvider | null = null;

    constructor() {
        if (typeof (window as any).ethereum !== 'undefined') {
            this.provider = new ethers.BrowserProvider((window as any).ethereum);
        } else {
            console.error('MetaMask is not installed!');
        }
    }

    async sendMessageWithPayment(prompt: string): Promise<any> {
        if (!this.provider) {
            throw new Error("MetaMask is not installed.");
        }

        try {
            // First attempt: Make the request without the payment header
            return await axios.post(`${BACKEND_URL}/api/chat`, { prompt });

        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 402) {
                // The server requires payment.
                console.log("Received 402 Payment Required. Initiating payment flow.");
                const paymentDetails = error.response.data.paymentDetails['bsc-testnet'];
                
                // Get the signature
                const signer = await this.provider.getSigner();
                const owner = await signer.getAddress();
                const { signature, witness } = await this.signEIP712Witness(signer, owner, paymentDetails);

                // Construct the payment header
                const paymentHeader = this.createPaymentHeader(signature, witness);

                // Retry the request with the payment header
                console.log("Retrying request with X-PAYMENT header.");
                return await axios.post(`${BACKEND_URL}/api/chat`, { prompt }, {
                    headers: { 'X-PAYMENT': paymentHeader }
                });

            } else {
                // A different kind of error occurred
                console.error("An unexpected error occurred:", error);
                throw error;
            }
        }
    }

    private async signEIP712Witness(signer: ethers.JsonRpcSigner, owner: string, paymentDetails: any): Promise<{signature: string, witness: any}> {
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const paymentId = ethers.id(owner + Date.now().toString());
        const nonce = await this.provider!.getTransactionCount(owner, 'latest');

        const witness = {
            owner,
            token: paymentDetails.token,
            amount: paymentDetails.amount,
            to: paymentDetails.to,
            deadline,
            paymentId,
            nonce,
        };
        
        console.log("Requesting user to sign EIP-712 witness:", witness);
        const signature = await signer.signTypedData(domain, types, witness);
        return { signature, witness };
    }
    
    private createPaymentHeader(signature: string, witness: any): string {
        const payload = {
            witnessSignature: signature,
            witness: witness,
        };
        return Buffer.from(JSON.stringify(payload)).toString('base64');
    }
}

export const q402Service = new Q402Service();
