use hdi::prelude::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct MetadataItem {
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct UpdateMetadataItemPayload {
    #[ts(type = "AgentPubKey")]
    pub agent_pubkey: AgentPubKey,
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct GetMetadataItemValuePayload {
    #[ts(type = "AgentPubKey")]
    pub agent_pubkey: AgentPubKey,
    pub name: String,
}
