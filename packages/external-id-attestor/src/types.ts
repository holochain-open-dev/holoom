import type { AgentPubKey, Record } from "@holochain/client";

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
