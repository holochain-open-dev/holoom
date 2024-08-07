use hdi::prelude::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

pub type EvmAddress = alloy_primitives::Address;
pub type EvmSignature = alloy_primitives::Signature;
pub type SolanaAddress = ed25519_dalek::VerifyingKey;
pub type SolanaSignature = ed25519_dalek::Signature;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq, TS)]
#[ts(export)]
pub enum ChainWalletSignature {
    Evm {
        #[ts(type = "Uint8Array")]
        evm_address: EvmAddress,
        #[ts(type = "[Uint8Array, Uint8Array, number]")]
        evm_signature: EvmSignature,
    },
    Solana {
        #[ts(type = "Uint8Array")]
        solana_address: Box<SolanaAddress>,
        #[ts(type = "number[]")]
        solana_signature: SolanaSignature,
    },
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq, TS)]
#[ts(export)]
pub struct WalletAttestation {
    #[ts(type = "AgentPubKey")]
    pub agent: AgentPubKey,
    pub chain_wallet_signature: ChainWalletSignature,
    #[ts(type = "ActionHash")]
    pub prev_action: ActionHash,
}
