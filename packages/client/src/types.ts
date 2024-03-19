import { AgentPubKey } from "@holochain/client";

export interface UsernameAttestation {
  agent: AgentPubKey;
  username: string;
}

export type EvmSignature = [
  Uint8Array, // r
  Uint8Array, // s
  number // v
];

export type ChainWalletSignature_Evm = {
  Evm: {
    evm_address: Uint8Array;
    evm_signature: EvmSignature;
  };
};

export type ChainWalletSignature_Solana = {
  Solana: {
    solana_address: Uint8Array;
    solana_signature: number[];
  };
};

export type ChainWalletSignature =
  | ChainWalletSignature_Evm
  | ChainWalletSignature_Solana;

export interface WalletAttestation {
  agent: AgentPubKey;
  chain_wallet_signature: ChainWalletSignature;
}

export type BoundWallet_Evm = {
  type: "evm";
  checksummedAddress: string;
};
export type BoundWallet_Solana = {
  type: "solana";
  base58Address: string;
};
export type BoundWallet = BoundWallet_Evm | BoundWallet_Solana;
