import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import axios from 'axios';

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS';

/**
 * Service for minting NFTs using Aptos Token V2 (Digital Asset standard)
 */
export class NFTMintingService {
    /**
     * Mint a new NFT/Token Object
     * Returns the transaction data to mint an NFT
     */
    static mintNFT(
        collectionName: string,
        tokenName: string,
        tokenDescription: string,
        tokenUri: string
    ): InputTransactionData {
        return {
            data: {
                function: "0x4::aptos_token::mint" as `${string}::${string}::${string}`,
                functionArguments: [
                    collectionName,
                    tokenDescription,
                    tokenName,
                    tokenUri,
                    [], // property_keys
                    [], // property_types
                    [], // property_values
                ],
            },
        };
    }

    /**
   * Create a collection (required before minting tokens)
   * This calls 0x4::aptos_token::create_collection
   */
    static createCollection(
        collectionName: string,
        description: string,
        uri: string,
        maxSupply: number = 10000
    ): InputTransactionData {
        return {
            data: {
                function: "0x4::aptos_token::create_collection",
                functionArguments: [
                    description,          // collection description
                    maxSupply,            // max supply
                    collectionName,       // collection name
                    uri,                  // collection URI
                    true,                 // mutable_description
                    true,                 // mutable_royalty
                    true,                 // mutable_uri
                    true,                 // mutable_token_description
                    true,                 // mutable_token_name
                    true,                 // mutable_token_properties
                    true,                 // mutable_token_uri
                    true,                 // tokens_burnable_by_creator
                    true,                 // tokens_freezable_by_creator
                    0,                    // royalty_numerator
                    100,                  // royalty_denominator
                ],
            },
        };
    }

    /**
     * Helper to generate a token URI by uploading metadata to IPFS.
     */
    static async generateTokenMetadata(
        name: string,
        description: string,
        imageUrl: string,
        attributes: Array<{ trait_type: string; value: string | number }>,
        pinataJwt?: string // Optional: Pinata JWT for authentication
    ): Promise<string> {
        const metadata = {
            name,
            description,
            image: imageUrl,
            attributes,
        };

        const ipfsCid = await NFTMintingService.uploadMetadataToIPFS(metadata, pinataJwt);
        return `ipfs://${ipfsCid}`;
    }

    /**
     * Uploads metadata to IPFS using Pinata.
     * In a real application, the Pinata JWT would be securely managed.
     */
    static async uploadMetadataToIPFS(metadata: any, pinataJwt?: string): Promise<string> {
        if (!pinataJwt) {
            console.warn("Pinata JWT not provided. Using mock IPFS CID for development.");
            // Simulate a CID generation for demonstration purposes
            const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            return mockCid;
        }

        try {
            const response = await axios.post(PINATA_API_URL, metadata, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${pinataJwt}`,
                },
            });

            if (!response.data.IpfsHash) {
                throw new Error('IPFS upload failed: Invalid response from Pinata');
            }

            return response.data.IpfsHash;
        } catch (error) {
            console.error("Error uploading to IPFS:", error);
            throw new Error("Failed to upload metadata to IPFS");
        }
    }

    /**
   * Extract the minted token object address from transaction hash
   * This fetches the full transaction from blockchain and parses the changes
   */
    static async extractTokenAddress(aptosClient: any, txHash: string): Promise<string | null> {
        try {
            console.log('Fetching full transaction details for hash:', txHash);

            // Wait a moment for transaction to be indexed
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Fetch full transaction details from blockchain
            const transaction = await aptosClient.getTransactionByHash({ transactionHash: txHash });

            console.log('Full transaction:', transaction);

            // Parse the changes to find the new Token object
            const changes = transaction.changes || [];

            for (const change of changes) {
                if (change.type === 'write_resource') {
                    // Check for aptos_token_objects::token::Token or 0x4::token::Token
                    const resourceType = change.data?.type || '';
                    if (resourceType.includes('aptos_token_objects::token::Token') ||
                        resourceType.includes('0x4::token::Token')) {
                        console.log('Found Token object at address:', change.address);
                        return change.address;
                    }
                }
            }

            // Fallback: check events
            const events = transaction.events || [];
            for (const event of events) {
                if (event.type?.includes('CreateTokenEvent') || event.type?.includes('MintEvent')) {
                    if (event.data?.token) {
                        console.log('Found token address in event:', event.data.token);
                        return event.data.token;
                    }
                }
            }

            console.error('Could not find token address in transaction changes or events');
            console.error('Transaction:', transaction);
            return null;
        } catch (error) {
            console.error('Error extracting token address:', error);
            return null;
        }
    }
}
