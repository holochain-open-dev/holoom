use hdi::prelude::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[hdk_entry_helper]
#[derive(Clone, PartialEq, TS)]
#[ts(export)]
pub struct ExternalIdAttestation {
    pub request_id: String,
    #[ts(type = "AgentPubKey")]
    pub internal_pubkey: AgentPubKey,
    pub external_id: String,
    pub display_name: String,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct SendExternalIdAttestationRequestPayload {
    pub request_id: String,
    pub code_verifier: String,
    pub code: String,
    #[ts(type = "AgentPubKey")]
    pub authority: AgentPubKey,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct IngestExternalIdAttestationRequestPayload {
    pub request_id: String,
    pub code_verifier: String,
    pub code: String,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ConfirmExternalIdRequestPayload {
    pub request_id: String,
    pub external_id: String,
    pub display_name: String,
    #[ts(type = "AgentPubKey")]
    pub requestor: AgentPubKey,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct RejectExternalIdRequestPayload {
    pub request_id: String,
    #[ts(type = "AgentPubKey")]
    pub requestor: AgentPubKey,
    pub reason: String,
}

/// Input to `get_external_id_attestations_for_agent`
#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct GetExternalIdAttestationsForAgentPayload {
    /// The agent whose is the object of the attestations you wish to retrieve
    #[ts(type = "AgentPubKey")]
    pub agent_pubkey: AgentPubKey,
    /// The authorities whose attestations you respect.
    #[ts(type = "AgentPubKey[]")]
    pub trusted_authorities: Vec<AgentPubKey>,
}

/// Input to `get_attestation_for_external_id`
#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct GetAttestationForExternalIdPayload {
    /// The external ID for which to want a corresponding attestation
    pub external_id: String,
    /// The authorities whose attestations you respect.
    #[ts(type = "AgentPubKey[]")]
    pub trusted_authorities: Vec<AgentPubKey>,
}
