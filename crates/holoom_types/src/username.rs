use hdi::prelude::*;
use serde::{Deserialize, Serialize};

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct UsernameAttestation {
    pub agent: AgentPubKey,
    pub username: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SignedUsername {
    pub username: String,
    pub signature: Signature,
    pub signer: AgentPubKey,
}
