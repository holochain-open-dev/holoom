import type { AgentPubKey, Record } from "@holochain/client";

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

export interface JqExecution {
  program: string;
  input: unknown;
  output: string;
}

export interface ExternalIdAttestation {
  request_id: string;
  internal_pubkey: AgentPubKey;
  external_id: string;
  display_name: string;
}

export interface SendExternalIdAttestationRequestPayload {
  request_id: string;
  code_verifier: string;
  code: string;
}

export interface ConfirmExternalIdRequestPayload {
  request_id: string;
  external_id: string;
  display_name: string;
  requestor: AgentPubKey;
}

export interface RejectExternalIdRequestPayload {
  request_id: string;
  requestor: AgentPubKey;
  reason: string;
}

export interface ExternalIdAttestationRequested {
  type: "ExternalIdAttestationRequested";
  request_id: string;
  requestor_pubkey: AgentPubKey;
  code_verifier: string;
  code: string;
}
export interface ExternalIdAttested {
  type: "ExternalIdAttested";
  request_id: string;
  record: Record;
}
export interface ExternalIdRejected {
  type: "ExternalIdRejected";
  request_id: string;
  reason: string;
}
export type LocalHoloomSignal =
  | ExternalIdAttestationRequested
  | ExternalIdAttested
  | ExternalIdRejected;
