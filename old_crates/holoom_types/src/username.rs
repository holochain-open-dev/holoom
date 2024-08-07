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
