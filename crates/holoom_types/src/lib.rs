use evm_signing_offer::{EvmU256, SignedEvmU256Array};
use hdi::prelude::*;
use serde::{Deserialize, Serialize};

pub mod external_id;
pub use external_id::*;
pub mod evm_signing_offer;
pub mod metadata;
pub mod recipe;
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
    EvmSignatureRequested {
        request_id: String,
        requestor_pubkey: AgentPubKey,
        u256_array: Vec<EvmU256>,
    },
    EvmSignatureProvided {
        request_id: String,
        signed_u256_array: SignedEvmU256Array,
    },
    EvmSignatureRequestRejected {
        request_id: String,
        reason: String,
    },
}

#[derive(Serialize, Deserialize, Debug)]
pub enum RemoteHoloomSignal {
    ExternalIdAttested {
        request_id: String,
        record: Record,
    },
    ExternalIdRejected {
        request_id: String,
        reason: String,
    },
    EvmSignatureProvided {
        request_id: String,
        signed_u256_array: SignedEvmU256Array,
    },
    EvmSignatureRequestRejected {
        request_id: String,
        reason: String,
    },
}

#[derive(Serialize, Deserialize, Debug, Clone, SerializedBytes)]
pub struct SignableBytes(pub Vec<u8>);

#[dna_properties]
#[derive(Clone)]
pub struct HoloomDnaProperties {
    pub authority_agent: String,
}
