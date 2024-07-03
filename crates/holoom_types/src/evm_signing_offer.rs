use hdi::prelude::*;
use serde::{Deserialize, Serialize};

use crate::{EvmAddress, EvmSignature};

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
#[serde(tag = "type")]
pub enum EvmU256Item {
    Uint,
    Hex,
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct EvmSigningOffer {
    pub recipe_ah: ActionHash,
    pub u256_items: Vec<EvmU256Item>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct CreateEvmSigningOfferPayload {
    pub identifier: String,
    pub evm_signing_offer: EvmSigningOffer,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct EvmSignatureOverRecipeExecutionRequest {
    pub request_id: String,
    pub recipe_execution_ah: ActionHash,
    pub signing_offer_ah: ActionHash,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct ResolveEvmSignatureOverRecipeExecutionRequestPayload {
    pub request_id: String,
    pub requestor: AgentPubKey,
    pub signed_u256_array: SignedEvmU256Array,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RejectEvmSignatureOverRecipeExecutionRequestPayload {
    pub request_id: String,
    pub requestor: AgentPubKey,
    pub reason: String,
}

pub type EvmU256 = alloy_primitives::U256;

#[derive(Serialize, Deserialize, Debug)]
pub struct SignedEvmU256Array {
    pub raw: Vec<EvmU256>,
    pub signature: EvmSignature,
    pub signer: EvmAddress,
}
