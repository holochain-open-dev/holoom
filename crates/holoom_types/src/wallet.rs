use hdi::prelude::*;
use serde::{Deserialize, Serialize};

pub type EvmAddress = alloy_primitives::Address;
pub type EvmSignature = alloy_primitives::Signature;
pub type SolanaAddress = ed25519_dalek::VerifyingKey;
pub type SolanaSignature = ed25519_dalek::Signature;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ChainWalletSignature {
    Evm {
        evm_address: EvmAddress,
        evm_signature: EvmSignature,
    },
    Solana {
        solana_address: Box<SolanaAddress>,
        solana_signature: SolanaSignature,
    },
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct WalletAttestation {
    pub agent: AgentPubKey,
    pub chain_wallet_signature: ChainWalletSignature,
    pub prev_action: ActionHash,
}
