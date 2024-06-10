use hdi::prelude::*;
use serde::{Deserialize, Serialize};

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct ExternalIdAttestation {
    pub request_id: String,
    pub internal_pubkey: AgentPubKey,
    pub external_id: String,
    pub display_name: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SendExternalIdAttestationRequestPayload {
    pub request_id: String,
    pub code_verifier: String,
    pub code: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct IngestExternalIdAttestationRequestPayload {
    pub request_id: String,
    pub code_verifier: String,
    pub code: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ConfirmExternalIdRequestPayload {
    pub request_id: String,
    pub external_id: String,
    pub display_name: String,
    pub requestor: AgentPubKey,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RejectExternalIdRequestPayload {
    pub request_id: String,
    pub requestor: AgentPubKey,
    pub reason: String,
}
