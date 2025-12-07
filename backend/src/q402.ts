// backend/src/q402.ts
import { Request, Response, NextFunction } from 'express';
import { ethers } from 'ethers';

const PAYMENT_DETAILS = {
    'bsc-testnet': {
        token: '0x0000000000000000000000000000000000000000', // BNB on BSC Testnet
        amount: '1000000000000000', // 0.001 BNB
        to: process.env.RECIPIENT_ADDRESS || '0x..._REPLACE_ME_...',
    },
};

// EIP-712 domain for signing
const domain = {
    name: 'X402 Payment',
    version: '1',
    chainId: 97, // BSC Testnet
    verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
};

// EIP-712 types for the witness
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

export const q402Middleware = async (req: Request, res: Response, next: NextFunction) => {
    const paymentHeader = req.headers['x-payment'] as string;

    if (!paymentHeader) {
        console.log("No X-PAYMENT header found. Sending 402 Payment Required.");
        return res.status(402).json({ paymentDetails: PAYMENT_DETAILS });
    }

    try {
        const payload = JSON.parse(Buffer.from(paymentHeader, 'base64').toString('utf-8'));
        const { witnessSignature, witness } = payload;

        const recoveredAddress = ethers.verifyTypedData(domain, types, witness, witnessSignature);

        if (recoveredAddress.toLowerCase() !== witness.owner.toLowerCase()) {
            throw new Error("Invalid signature");
        }
        
        // You could also check the deadline, nonce, etc. here

        console.log(`Successfully verified payment signature from ${recoveredAddress}`);
        next(); // Signature is valid, proceed to the actual route handler

    } catch (error) {
        if (error instanceof Error) {
            console.error("Q402 Verification Error:", error.message);
        } else {
            console.error("An unknown Q402 Verification Error occurred:", error);
        }
        return res.status(401).json({ error: 'Invalid payment signature.' });
    }
};
