import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useState, useEffect } from "react";
import { ContinuumService } from "../services/continuumService";

/**
 * Hook for interacting with Continuum smart contracts
 */
export function useContinuum() {
    const { account, signAndSubmitTransaction } = useWallet();
    const [complianceStatus, setComplianceStatus] = useState({
        isAdmin: false,
        hasKYC: false,
        canTradeRealEstate: false,
    });
    const [loading, setLoading] = useState(false);

    // Load user compliance status when wallet connects
    useEffect(() => {
        if (account?.address) {
            ContinuumService.getUserComplianceStatus(account.address).then(
                setComplianceStatus
            );
        } else {
            setComplianceStatus({
                isAdmin: false,
                hasKYC: false,
                canTradeRealEstate: false,
            });
        }
    }, [account?.address]);

    // Create a yield stream
    const createYieldStream = async (
        tokenAddress: string,
        totalYield: number,
        durationInSeconds: number,
        assetType: number = 0 // 0=Real Estate, 1=Vehicle, 2=Commodities (default to Real Estate)
    ) => {
        if (!account) throw new Error("Wallet not connected");

        setLoading(true);
        try {
            const transaction = ContinuumService.createAssetStream(
                tokenAddress,
                totalYield,
                durationInSeconds,
                assetType // Pass the asset type!
            );

            const response = await signAndSubmitTransaction(transaction);
            console.log("Stream created:", response);
            return response;
        } catch (error) {
            console.error("Error creating stream:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Claim yield
    const claimYield = async (tokenAddress: string) => {
        if (!account) throw new Error("Wallet not connected");

        setLoading(true);
        try {
            const transaction = ContinuumService.claimYield(tokenAddress);
            const response = await signAndSubmitTransaction(transaction);
            console.log("Yield claimed:", response);
            return response;
        } catch (error) {
            console.error("Error claiming yield:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Flash advance
    const flashAdvance = async (tokenAddress: string, amount: number) => {
        if (!account) throw new Error("Wallet not connected");

        setLoading(true);
        try {
            const transaction = ContinuumService.flashAdvance(tokenAddress, amount);
            const response = await signAndSubmitTransaction(transaction);
            console.log("Flash advance executed:", response);
            return response;
        } catch (error) {
            console.error("Error executing flash advance:", error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        account,
        complianceStatus,
        loading,
        createYieldStream,
        claimYield,
        flashAdvance,
    };
}
