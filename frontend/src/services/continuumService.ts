import { ethers } from 'ethers';
import { PublicClient, WalletClient } from 'viem'; 
import { CONTRACT_CONFIG } from '../config/contracts';

export class ContinuumService {
    private static _publicClient: PublicClient | undefined;
    private static _walletClient: WalletClient | undefined;

    static setClients(publicClient: PublicClient, walletClient?: WalletClient) {
        ContinuumService._publicClient = publicClient;
        ContinuumService._walletClient = walletClient;
    }

    static getPublicClient(): PublicClient {
        if (!ContinuumService._publicClient) {
            throw new Error("PublicClient not set in ContinuumService. Ensure Wagmi config is initialized.");
        }
        return ContinuumService._publicClient;
    }

    static getWalletClient(): WalletClient {
        if (!ContinuumService._walletClient) {
            throw new Error("WalletClient not set in ContinuumService. Ensure wallet is connected.");
        }
        return ContinuumService._walletClient;
    }

    static getEthersProvider() {
        return new ethers.BrowserProvider(ContinuumService.getPublicClient().transport);
    }

    static async getEthersSigner() {
        const walletClient = ContinuumService.getWalletClient();
        const { account } = walletClient;

        if (!account || !account.address) { // Added null check for account.address
            throw new Error("Wallet account not available.");
        }

        const provider = new ethers.BrowserProvider(ContinuumService.getPublicClient().transport);
        const signer = await provider.getSigner(account.address);
        return signer;
    }

    static async getHubContract(signerRequired: boolean = false) {
        const providerOrSigner = signerRequired ? await this.getEthersSigner() : this.getEthersProvider();
        return new ethers.Contract(CONTRACT_CONFIG.RWA_HUB_ADDRESS, CONTRACT_CONFIG.ABIS.RWAHub, providerOrSigner);
    }

    static async getTokenRegistryContract(signerRequired: boolean = false) {
        const providerOrSigner = signerRequired ? await this.getEthersSigner() : this.getEthersProvider();
        return new ethers.Contract(CONTRACT_CONFIG.TOKEN_REGISTRY_ADDRESS, CONTRACT_CONFIG.ABIS.TokenRegistry, providerOrSigner);
    }

    static async getStreamingProtocolContract(signerRequired: boolean = false) {
        const providerOrSigner = signerRequired ? await this.getEthersSigner() : this.getEthersProvider();
        return new ethers.Contract(CONTRACT_CONFIG.STREAMING_PROTOCOL_ADDRESS, CONTRACT_CONFIG.ABIS.StreamingProtocol, providerOrSigner);
    }

    static async createAssetStream(
        owner: string,
        assetType: number,
        metadataUri: string,
        totalYield: ethers.BigNumberish,
        durationInSeconds: number
    ): Promise<ethers.ContractTransactionResponse> {
        const hub = await this.getHubContract(true);
        const tx = await hub.createCompliantRWAStream(owner, assetType, metadataUri, totalYield, durationInSeconds);
        return tx;
    }

    static async getAllTokenIds(): Promise<number[]> {
        const tokenRegistry = await this.getTokenRegistryContract();
        const totalSupply = await tokenRegistry.totalSupply();
        const tokenIds: number[] = [];
        for (let i = 0; i < totalSupply; i++) {
            const tokenId = await tokenRegistry.tokenByIndex(i);
            tokenIds.push(Number(tokenId));
        }
        return tokenIds;
    }

    static async getTokenDetails(tokenId: number): Promise<any> {
        const tokenRegistry = await this.getTokenRegistryContract();
        const details = await tokenRegistry.tokenDetails(tokenId);
        return {
            asset_type: details.assetType,
            stream_id: details.streamId,
            metadata_uri: details.metadataUri,
            registered_at: details.registeredAt,
        };
    }

    static async getStreamInfo(streamId: number): Promise<any> {
        const streamingProtocol = await this.getStreamingProtocolContract();
        const stream = await streamingProtocol.streams(streamId);
        return {
            sender: stream.sender,
            recipient: stream.recipient,
            totalAmount: stream.totalAmount,
            flowRate: stream.flowRate,
            startTime: stream.startTime,
            stopTime: stream.stopTime,
            amountWithdrawn: stream.amountWithdrawn,
            isActive: stream.isActive,
        };
    }

    static async getTokenOwner(tokenId: number): Promise<string> {
        const tokenRegistry = await this.getTokenRegistryContract();
        const owner = await tokenRegistry.ownerOf(tokenId);
        return owner;
    }

    static async getTokenURI(tokenId: number): Promise<string> {
        const tokenRegistry = await this.getTokenRegistryContract();
        const uri = await tokenRegistry.tokenURI(tokenId);
        return uri;
    }

    static async claimYield(streamId: number): Promise<ethers.ContractTransactionResponse> {
        const streamingProtocol = await this.getStreamingProtocolContract(true);
        const tx = await streamingProtocol.claimFromStream(streamId);
        return tx;
    }

    static async getClaimableBalance(streamId: number): Promise<ethers.BigNumberish> {
        const streamingProtocol = await this.getStreamingProtocolContract();
        const balance = await streamingProtocol.claimableBalance(streamId);
        return balance;
    }

    static async getStreamStatus(streamId: number): Promise<{ claimable: ethers.BigNumberish, escrowBalance: ethers.BigNumberish, remaining: ethers.BigNumberish, isFrozen: boolean }> {
        const streamingProtocol = await this.getStreamingProtocolContract();
        const streamInfo = await streamingProtocol.streams(streamId);
        const claimable = await streamingProtocol.claimableBalance(streamId);

        const escrowBalance = streamInfo.totalAmount - streamInfo.amountWithdrawn;
        const remaining = streamInfo.totalAmount - streamInfo.amountWithdrawn - claimable;

        return {
            claimable,
            escrowBalance,
            remaining,
            isFrozen: !streamInfo.isActive,
        };
    }

    static async cancelStream(streamId: number): Promise<ethers.ContractTransactionResponse> {
        const streamingProtocol = await this.getStreamingProtocolContract(true);
        const tx = await streamingProtocol.cancelStream(streamId);
        return tx;
    }

    static async initializeEcosystem(): Promise<ethers.ContractTransactionResponse | void> {
        console.warn("EVM: initializeEcosystem is a placeholder. Full implementation requires ComplianceGuard contract.");
        return Promise.resolve();
    }

    static async registerIdentity(
        _userAddress: string,
        _jurisdiction: string,
        _verificationLevel: number
    ): Promise<ethers.ContractTransactionResponse | void> {
        console.warn("EVM: registerIdentity is a placeholder. Full implementation requires ComplianceGuard contract.");
        return Promise.resolve();
    }

    static async whitelistUser(
        _userAddress: string,
        _assetTypes: number[]
    ): Promise<ethers.ContractTransactionResponse | void> {
        console.warn("EVM: whitelistUser is a placeholder. Full implementation requires ComplianceGuard contract.");
        return Promise.resolve();
    }

    static async freezeAsset(
        _streamId: number,
        _reason: string
    ): Promise<ethers.ContractTransactionResponse | void> {
        console.warn("EVM: freezeAsset is a placeholder. Full implementation requires ComplianceGuard contract.");
        return Promise.resolve();
    }

    static async unfreezeAsset(
        _streamId: number
    ): Promise<ethers.ContractTransactionResponse | void> {
        console.warn("EVM: unfreezeAsset is a placeholder. Full implementation requires ComplianceGuard contract.");
        return Promise.resolve();
    }

    static async batchWhitelist(
        _users: string[],
        _assetTypes: number[]
    ): Promise<ethers.ContractTransactionResponse | void> {
        console.warn("EVM: batchWhitelist is a placeholder. Full implementation requires ComplianceGuard contract.");
        return Promise.resolve();
    }

    static async canUserParticipate(): Promise<boolean> { 
        console.warn("EVM: canUserParticipate is a placeholder.");
        return true; 
    }
    static async getUserComplianceStatus(): Promise<any> { 
        console.warn("EVM: getUserComplianceStatus is a placeholder.");
        return { isAdmin: false, hasKYC: true, canTradeRealEstate: true }; 
    }
}