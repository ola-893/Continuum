import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { CONTRACT_CONFIG } from "../config/contracts";

const config = new AptosConfig({
    network: Network.TESTNET,
    clientConfig: {
        HEADERS: {
            "Authorization": "Bearer AG-74SF1GVWQ8QFNVQAFRMTTNCJYDPCSBW52"
        }
    }
});
export const aptosClient = new Aptos(config);

/**
 * Helper function to build fully qualified function IDs
 */
export const buildFunctionId = (moduleName: string, functionName: string): `${string}::${string}::${string}` => {
    return `${CONTRACT_CONFIG.MODULE_ADDRESS}::${moduleName}::${functionName}` as `${string}::${string}::${string}`;
};

/**
 * Format octas to APT
 */
export const octasToAPT = (octas: number): number => {
    return octas / CONTRACT_CONFIG.ONE_APT;
};

/**
 * Format APT to octas
 */
export const aptToOctas = (apt: number): number => {
    return Math.floor(apt * CONTRACT_CONFIG.ONE_APT);
};
