import type { ActionHash, AgentPubKey, Record } from "@holochain/client";

export interface UsernameAttestation {
  agent: AgentPubKey;
  username: string;
}

export type EvmSignature = [
  Uint8Array, // r
  Uint8Array, // s
  number, // v
];

export interface SignedEvmU256Array {
  raw: Uint8Array[];
  signature: EvmSignature;
  signer: Uint8Array;
}

export interface EvmSignatureOverRecipeExecutionRequest {
  request_id: String;
  recipe_execution_ah: ActionHash;
  signing_offer_ah: ActionHash;
}

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

export type RecipeArgumentType = { type: "String" };

export type RecipeInstruction =
  | { type: "Constant"; value: string }
  | { type: "GetLatestDocWithIdentifier"; var_name: string }
  | {
      input_var_names: JqInstructionArgumentNames;
      program: string;
      type: "Jq";
    }
  | { type: "GetDocsListedByVar"; var_name: string }
  | { type: "GetCallerExternalId" }
  | { type: "GetCallerAgentPublicKey" };
export type JqInstructionArgumentNames =
  | { type: "Single"; var_name: string }
  | { type: "List"; var_names: string[] };

export interface Recipe {
  trusted_authors: AgentPubKey[];
  arguments: [string, RecipeArgumentType][];
  instructions: [string, RecipeInstruction][];
}

export type RecipeArgument = { type: "String"; value: string };

export interface ExecuteRecipePayload {
  recipe_ah: ActionHash;
  arguments: RecipeArgument[];
}

export type RecipeInstructionExecution =
  | { type: "Constant" }
  | { type: "GetLatestDocWithIdentifier"; doc_ah: ActionHash }
  | { type: "Jq" }
  | { type: "GetDocsListedByVar"; doc_ahs: ActionHash[] }
  | { type: "GetCallerExternalId"; attestation_ah: ActionHash }
  | { type: "GetCallerAgentPublicKey" };

export interface RecipeExecution {
  recipe_ah: ActionHash;
  arguments: RecipeArgument[];
  instruction_executions: RecipeInstructionExecution[];
  output: String;
}

// Signals

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
export interface EvmSignatureRequested {
  type: "EvmSignatureRequested";
  request_id: string;
  requestor_pubkey: AgentPubKey;
  u256_array: Uint8Array[];
}
export interface EvmSignatureProvided {
  type: "EvmSignatureProvided";
  request_id: string;
  signed_u256_array: SignedEvmU256Array;
}
export interface EvmSignatureRequestRejected {
  type: "EvmSignatureRequestRejected";
  request_id: string;
  reason: string;
}

export type LocalHoloomSignal =
  | ExternalIdAttestationRequested
  | ExternalIdAttested
  | ExternalIdRejected
  | EvmSignatureRequested
  | EvmSignatureProvided
  | EvmSignatureRequestRejected;
