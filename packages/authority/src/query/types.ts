export interface UsernameRegistryItem {
  agent_pubkey_b64: string;
  username: string;
}

export interface UsernameRegistryResponse {
  success: boolean;
  items: UsernameRegistryItem[];
}

export interface UsernameRegistryWalletsResponse {
  success: boolean;
  evm_addresses: string[];
  solana_addresses: string[];
}

export interface UsernameRegistryMetadataResponse {
  success: boolean;
  metadata: { [key: string]: string };
}
