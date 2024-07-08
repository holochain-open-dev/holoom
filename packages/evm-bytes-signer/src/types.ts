import type { ActionHash, AgentPubKey, Record } from "@holochain/client";

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

export type EvmU256Item = { type: "Uint" } | { type: "Hex" };

export interface EvmSigningOffer {
  recipe_ah: ActionHash;
  u256_items: EvmU256Item[];
}

export interface CreateEvmSigningOfferPayload {
  identifier: string;
  evm_signing_offer: EvmSigningOffer;
}

export interface ResolveEvmSignatureOverRecipeExecutionRequestPayload {
  request_id: String;
  requestor: AgentPubKey;
  signed_u256_array: SignedEvmU256Array;
}

export interface RejectEvmSignatureOverRecipeExecutionRequestPayload {
  request_id: String;
  requestor: AgentPubKey;
  reason: String;
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
