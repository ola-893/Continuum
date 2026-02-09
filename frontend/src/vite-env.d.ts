/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEZOS_NETWORK: 'ghostnet' | 'mainnet';
  readonly VITE_GHOSTNET_STREAMING_PROTOCOL: string;
  readonly VITE_GHOSTNET_ASSET_YIELD_PROTOCOL: string;
  readonly VITE_GHOSTNET_COMPLIANCE_GUARD: string;
  readonly VITE_GHOSTNET_TOKEN_REGISTRY: string;
  readonly VITE_GHOSTNET_RWA_HUB: string;
  readonly VITE_GHOSTNET_FA2_TOKEN: string;
  readonly VITE_MAINNET_STREAMING_PROTOCOL: string;
  readonly VITE_MAINNET_ASSET_YIELD_PROTOCOL: string;
  readonly VITE_MAINNET_COMPLIANCE_GUARD: string;
  readonly VITE_MAINNET_TOKEN_REGISTRY: string;
  readonly VITE_MAINNET_RWA_HUB: string;
  readonly VITE_MAINNET_FA2_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
