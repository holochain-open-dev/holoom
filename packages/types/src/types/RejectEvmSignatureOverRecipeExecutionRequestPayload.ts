import { AgentPubKey, Signature } from "@holochain/client";
// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.

export type RejectEvmSignatureOverRecipeExecutionRequestPayload = {
  request_id: string;
  requestor: AgentPubKey;
  reason: string;
};
