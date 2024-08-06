use hdi::prelude::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::{EvmAddress, EvmSignature};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, TS)]
#[serde(tag = "type")]
#[ts(export)]
pub enum EvmU256Item {
    Uint,
    Hex,
    HoloAgent,
}

#[derive(Clone, PartialEq, TS, Serialize, Deserialize, Debug)]
#[ts(export)]
pub struct EvmSigningOffer {
    #[ts(type = "ActionHash")]
    pub recipe_ah: ActionHash,
    pub u256_items: Vec<EvmU256Item>,
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq, TS)]
#[ts(export)]
pub struct SignedEvmSigningOffer {
    #[ts(type = "Uint8Array")]
    pub signer: EvmAddress,
    #[ts(type = "[Uint8Array, Uint8Array, number]")]
    pub signature: EvmSignature,
    pub offer: EvmSigningOffer,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct CreateEvmSigningOfferPayload {
    pub identifier: String,
    pub signed_offer: SignedEvmSigningOffer,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct EvmSignatureOverRecipeExecutionRequest {
    pub request_id: String,
    #[ts(type = "ActionHash")]
    pub recipe_execution_ah: ActionHash,
    #[ts(type = "ActionHash")]
    pub signing_offer_ah: ActionHash,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ResolveEvmSignatureOverRecipeExecutionRequestPayload {
    pub request_id: String,
    #[ts(type = "AgentPubKey")]
    pub requestor: AgentPubKey,
    pub signed_u256_array: SignedEvmU256Array,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct RejectEvmSignatureOverRecipeExecutionRequestPayload {
    pub request_id: String,
    #[ts(type = "AgentPubKey")]
    pub requestor: AgentPubKey,
    pub reason: String,
}

pub type EvmU256 = alloy_primitives::U256;

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct SignedEvmU256Array {
    #[ts(type = "Uint8Array[]")]
    pub raw: Vec<EvmU256>,
    #[ts(type = "[Uint8Array, Uint8Array, number]")]
    pub signature: EvmSignature,
    #[ts(type = "Uint8Array")]
    pub signer: EvmAddress,
}
