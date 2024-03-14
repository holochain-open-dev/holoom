use game_identity_types::{
    ChainWalletSignature, EvmAddress, EvmSignature, SolanaAddress, SolanaSignature,
    WalletAttestation,
};
use hdi::prelude::*;

pub fn evm_signing_message(evm_address: &EvmAddress, agent: AgentPubKey) -> String {
    format!(
        "Bind wallet {} to Holochain public key {}",
        evm_address.to_checksum(None),
        holo_hash::HoloHashB64::<_>::from(agent)
    )
}

pub fn solana_signing_message(solana_address: &SolanaAddress, agent: AgentPubKey) -> String {
    format!(
        "Bind wallet {} to Holochain public key {}",
        bs58::encode(solana_address.as_bytes()).into_string(),
        holo_hash::HoloHashB64::<_>::from(agent)
    )
}

fn verify_evm_signature(
    evm_signature: EvmSignature,
    evm_address: EvmAddress,
    agent: AgentPubKey,
) -> ExternResult<ValidateCallbackResult> {
    let message = evm_signing_message(&evm_address, agent);
    match evm_signature.recover_address_from_msg(message) {
        Ok(recovered_address) => {
            if recovered_address == evm_address {
                Ok(ValidateCallbackResult::Valid)
            } else {
                Ok(ValidateCallbackResult::Invalid(format!(
                    "Expected to recover {} from signature, but instead recovered {}",
                    evm_address.to_checksum(None),
                    recovered_address.to_checksum(None)
                )))
            }
        }
        Err(_) => Ok(ValidateCallbackResult::Invalid(
            "Invalid signature over wallet binding message".into(),
        )),
    }
}

fn verify_solana_signature(
    solana_signature: SolanaSignature,
    solana_address: SolanaAddress,
    agent: AgentPubKey,
) -> ExternResult<ValidateCallbackResult> {
    let message = solana_signing_message(&solana_address, agent);
    match solana_address.verify_strict(message.as_bytes(), &solana_signature) {
        Ok(()) => Ok(ValidateCallbackResult::Valid),
        Err(_) => Ok(ValidateCallbackResult::Invalid(
            "Invalid signature over wallet binding message".into(),
        )),
    }
}

pub fn validate_create_wallet_attestation(
    action: EntryCreationAction,
    wallet_attestation: WalletAttestation,
) -> ExternResult<ValidateCallbackResult> {
    if action.author() != &wallet_attestation.agent {
        return Ok(ValidateCallbackResult::Invalid(
            "Wallet cannot by attested by a different user".into(),
        ));
    }
    match wallet_attestation.chain_wallet_signature {
        ChainWalletSignature::Evm {
            evm_address,
            evm_signature,
        } => verify_evm_signature(evm_signature, evm_address, wallet_attestation.agent),
        ChainWalletSignature::Solana {
            solana_address,
            solana_signature,
        } => verify_solana_signature(solana_signature, solana_address, wallet_attestation.agent),
    }
}

pub fn validate_update_wallet_attestation(
    _action: Update,
    _wallet_attestation: WalletAttestation,
    _original_action: EntryCreationAction,
    _original_wallet_attestation: WalletAttestation,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Wallet Attestations cannot be updated",
    )))
}
pub fn validate_delete_wallet_attestation(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_wallet_attestation: WalletAttestation,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Wallet Attestations cannot be deleted",
    )))
}
