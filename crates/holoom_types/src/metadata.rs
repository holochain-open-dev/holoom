use hdi::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct MetadataItem {
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct UpdateMetadataItemPayload {
    pub agent_pubkey: AgentPubKey,
    pub name: String,
    pub value: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct GetMetadataItemValuePayload {
    pub agent_pubkey: AgentPubKey,
    pub name: String,
}
