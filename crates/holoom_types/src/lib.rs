use hdi::prelude::*;
use serde::{Deserialize, Serialize};

pub mod external_id;
pub use external_id::*;
pub mod metadata;
pub use metadata::*;
pub mod wallet;
pub use wallet::*;
pub mod username;
pub use username::*;
pub mod oracle;
pub use oracle::*;

#[derive(Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum LocalHoloomSignal {
    ExternalIdAttestationRequested {
        request_id: String,
        requestor_pubkey: AgentPubKey,
        code_verifier: String,
        code: String,
    },
    ExternalIdAttested {
        request_id: String,
        record: Record,
    },
    ExternalIdRejected {
        request_id: String,
        reason: String,
    },
}

#[derive(Serialize, Deserialize, Debug)]
pub enum RemoteHoloomSignal {
    ExternalIdAttested { request_id: String, record: Record },
    ExternalIdRejected { request_id: String, reason: String },
}

#[derive(Serialize, Deserialize, Debug, Clone, SerializedBytes)]
pub struct SignableBytes(pub Vec<u8>);

#[dna_properties]
#[derive(Clone)]
pub struct HoloomDnaProperties {
    pub authority_agent: String,
}

pub fn get_authority_agent() -> ExternResult<AgentPubKey> {
    let dna_props = HoloomDnaProperties::try_from_dna_properties()?;
    AgentPubKey::try_from(dna_props.authority_agent).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Failed to deserialize AgentPubKey from dna properties".into()
        ))
    })
}
