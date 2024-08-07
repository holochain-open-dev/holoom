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
