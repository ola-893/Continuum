import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { ContinuumService } from '../services/continuumService';

export const useContinuum = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { address } = useAccount();

    const createYieldStream = async (
        _tokenAddress: string, // Unused in EVM as token is created in same tx
        totalYield: number,
        durationInSeconds: number,
        assetType: number,
        metadataUri: string
    ) => {
        if (!address) {
            setError("Wallet not connected");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const yieldInWei = ethers.parseUnits(totalYield.toString(), 18);
            const tx = await ContinuumService.createAssetStream(
                address,
                assetType,
                metadataUri,
                yieldInWei,
                durationInSeconds
            );
            await tx.wait();
        } catch (err: any) {
            console.error("Error creating asset stream:", err);
            setError(err.message || "An unexpected error occurred.");
            throw err; 
        } finally {
            setLoading(false);
        }
    };

    const claimYield = async (streamId: number) => {
        if (!address) {
            setError("Wallet not connected");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const tx = await ContinuumService.claimYield(streamId);
            await tx.wait();
        } catch (err: any) {
            console.error("Error claiming yield:", err);
            setError(err.message || "An unexpected error occurred.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const flashAdvance = async (_streamId: number, _amountRequested: number) => { // Commented out unused params
        if (!address) {
            setError("Wallet not connected");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // const amountInWei = ethers.parseUnits(amountRequested.toString(), 18); // Commented out unused variable
            console.warn("Flash Advance is a placeholder function for EVM. Not yet implemented in RWAHub.");
            // const tx = await ContinuumService.flashAdvance(streamId, amountInWei);
            // await tx.wait();
        } catch (err: any) {
            console.error("Error performing flash advance:", err);
            setError(err.message || "An unexpected error occurred.");
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createYieldStream,
        claimYield,
        flashAdvance,
        loading,
        error,
        complianceStatus: { hasKYC: true, isAdmin: false, canTradeRealEstate: true }, 
    };
};
