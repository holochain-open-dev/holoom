use hdi::prelude::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[hdk_entry_helper]
#[derive(Clone, PartialEq, TS)]
#[ts(export)]
pub struct UsernameAttestation {
    #[ts(type = "AgentPubKey")]
    pub agent: AgentPubKey,
    pub username: String,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct SignedUsername {
    pub username: String,
    #[ts(type = "Signature")]
    pub signature: Signature,
    #[ts(type = "AgentPubKey")]
    pub signer: AgentPubKey,
}

/// The input to `sign_username_and_request_attestation`
#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct SignUsernameAndRequestAttestationInput {
    /// The username for which you want a corresponding attestation
    pub username: String,
    /// The authorities whose attestations you respect.
    #[ts(type = "AgentPubKey")]
    pub authority: AgentPubKey,
}

/// The input to `get_username_attestation_for_agent`
#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct GetUsernameAttestationForAgentPayload {
    /// The agent whose is the object of the attestations you wish to retrieve
    #[ts(type = "AgentPubKey")]
    pub agent: AgentPubKey,
    /// The authorities whose attestations you respect.
    #[ts(type = "AgentPubKey[]")]
    pub trusted_authorities: Vec<AgentPubKey>,
}
