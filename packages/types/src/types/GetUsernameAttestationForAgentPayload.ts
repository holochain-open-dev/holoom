import { AgentPubKey } from "@holochain/client";
// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.

/**
 * The input to `get_username_attestation_for_agent`
 */
export type GetUsernameAttestationForAgentPayload = {
  /**
   * The agent whose is the object of the attestations you wish to retrieve
   */
  agent: AgentPubKey;
  /**
   * The authorities whose attestations you respect.
   */
  trusted_authorities: AgentPubKey[];
};