/**
 * Tezos Network Configuration
 * 
 * This file contains network-specific configuration for Tezos blockchain integration.
 * It supports both Ghostnet (testnet) and Mainnet environments.
 * 
 * Configuration includes:
 * - Network details (RPC endpoints, network IDs, block explorers)
 * - Contract addresses for all protocol contracts
 * - Environment-specific settings
 */

export type TezosNetwork = 'ghostnet' | 'mainnet';

export interface NetworkConfig {
  name: string;
  displayName: string;
  networkId: string;
  rpcEndpoint: string;
  rpcBackup: string;
  blockExplorer: string;
  blockExplorerName: string;
  faucetUrl?: string;
  isTestnet: boolean;
}

export interface ContractAddresses {
  streamingProtocol: string;
  assetYieldProtocol: string;
  complianceGuard: string;
  tokenRegistry: string;
  rwaHub: string;
  fa2Token: string;
}

export interface TezosConfig {
  network: NetworkConfig;
  contracts: ContractAddresses;
}

// Ghostnet configuration
export const GHOSTNET_CONFIG: TezosConfig = {
  network: {
    name: 'ghostnet',
    displayName: 'Ghostnet',
    networkId: 'NetXnHfVqm9iesp',
    rpcEndpoint: import.meta.env.VITE_GHOSTNET_RPC || 'https://ghostnet.ecadinfra.com',
    rpcBackup: 'https://rpc.ghostnet.teztnets.xyz',
    blockExplorer: 'https://ghostnet.tzkt.io',
    blockExplorerName: 'TzKT',
    faucetUrl: 'https://faucet.ghostnet.teztnets.xyz',
    isTestnet: true,
  },
  contracts: {
    streamingProtocol: import.meta.env.VITE_GHOSTNET_STREAMING_PROTOCOL || '',
    assetYieldProtocol: import.meta.env.VITE_GHOSTNET_ASSET_YIELD_PROTOCOL || '',
    complianceGuard: import.meta.env.VITE_GHOSTNET_COMPLIANCE_GUARD || '',
    tokenRegistry: import.meta.env.VITE_GHOSTNET_TOKEN_REGISTRY || '',
    rwaHub: import.meta.env.VITE_GHOSTNET_RWA_HUB || '',
    fa2Token: import.meta.env.VITE_GHOSTNET_FA2_TOKEN || '',
  },
};

// Mainnet configuration (placeholder addresses until deployment)
export const MAINNET_CONFIG: TezosConfig = {
  network: {
    name: 'mainnet',
    displayName: 'Mainnet',
    networkId: 'NetXdQprcVkpaWU',
    rpcEndpoint: import.meta.env.VITE_MAINNET_RPC || 'https://mainnet.api.tez.ie',
    rpcBackup: 'https://rpc.tzbeta.net',
    blockExplorer: 'https://tzkt.io',
    blockExplorerName: 'TzKT',
    isTestnet: false,
  },
  contracts: {
    streamingProtocol: import.meta.env.VITE_MAINNET_STREAMING_PROTOCOL || '',
    assetYieldProtocol: import.meta.env.VITE_MAINNET_ASSET_YIELD_PROTOCOL || '',
    complianceGuard: import.meta.env.VITE_MAINNET_COMPLIANCE_GUARD || '',
    tokenRegistry: import.meta.env.VITE_MAINNET_TOKEN_REGISTRY || '',
    rwaHub: import.meta.env.VITE_MAINNET_RWA_HUB || '',
    fa2Token: import.meta.env.VITE_MAINNET_FA2_TOKEN || '',
  },
};

// Get configuration based on environment or default to Ghostnet
export const getCurrentNetwork = (): TezosNetwork => {
  const network = import.meta.env.VITE_TEZOS_NETWORK as TezosNetwork;
  return network === 'mainnet' ? 'mainnet' : 'ghostnet';
};

export const getConfig = (network?: TezosNetwork): TezosConfig => {
  const targetNetwork = network || getCurrentNetwork();
  return targetNetwork === 'mainnet' ? MAINNET_CONFIG : GHOSTNET_CONFIG;
};

// Helper to get block explorer URL for an address
export const getExplorerUrl = (address: string, network?: TezosNetwork): string => {
  const config = getConfig(network);
  return `${config.network.blockExplorer}/${address}`;
};

// Helper to get transaction explorer URL
export const getTxExplorerUrl = (txHash: string, network?: TezosNetwork): string => {
  const config = getConfig(network);
  return `${config.network.blockExplorer}/${txHash}`;
};

// Helper to get operation explorer URL
export const getOperationExplorerUrl = (opHash: string, network?: TezosNetwork): string => {
  const config = getConfig(network);
  return `${config.network.blockExplorer}/${opHash}`;
};

// Helper to check if current network is testnet
export const isTestnet = (network?: TezosNetwork): boolean => {
  const config = getConfig(network);
  return config.network.isTestnet;
};

// Helper to get network display name
export const getNetworkDisplayName = (network?: TezosNetwork): string => {
  const config = getConfig(network);
  return config.network.displayName;
};

// Helper to validate contract addresses are configured
export const validateContractAddresses = (network?: TezosNetwork): boolean => {
  const config = getConfig(network);
  const contracts = config.contracts;
  
  return !!(
    contracts.streamingProtocol &&
    contracts.assetYieldProtocol &&
    contracts.complianceGuard &&
    contracts.tokenRegistry &&
    contracts.rwaHub &&
    contracts.fa2Token
  );
};

// Helper to get missing contract addresses
export const getMissingContracts = (network?: TezosNetwork): string[] => {
  const config = getConfig(network);
  const contracts = config.contracts;
  const missing: string[] = [];
  
  if (!contracts.streamingProtocol) missing.push('Streaming Protocol');
  if (!contracts.assetYieldProtocol) missing.push('Asset Yield Protocol');
  if (!contracts.complianceGuard) missing.push('Compliance Guard');
  if (!contracts.tokenRegistry) missing.push('Token Registry');
  if (!contracts.rwaHub) missing.push('RWA Hub');
  if (!contracts.fa2Token) missing.push('FA2 Token');
  
  return missing;
};

