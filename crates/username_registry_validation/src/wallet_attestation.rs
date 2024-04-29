use hdi::prelude::*;
use holoom_types::{
    ChainWalletSignature, EvmAddress, EvmSignature, SolanaAddress, SolanaSignature,
    WalletAttestation,
};

pub fn evm_signing_message(
    evm_address: &EvmAddress,
    agent: AgentPubKey,
    prev_action: ActionHash,
) -> String {
    format!(
        "Binding wallet:\n{}\n\nTo Holochain public key:\n{}\n\nCommitted after holochain action:\n{}",
        evm_address.to_checksum(None),
        holo_hash::HoloHashB64::<_>::from(agent),
        holo_hash::HoloHashB64::<_>::from(prev_action)
    )
}

pub fn solana_signing_message(
    solana_address: &SolanaAddress,
    agent: AgentPubKey,
    prev_action: ActionHash,
) -> String {
    format!(
        "Binding Solana wallet:\n{}\n\nTo Holochain public key:\n{}\n\nCommitted after holochain action:\n{}",
        bs58::encode(solana_address.as_bytes()).into_string(),
        holo_hash::HoloHashB64::<_>::from(agent),
        holo_hash::HoloHashB64::<_>::from(prev_action)
    )
}

fn verify_evm_signature(
    evm_signature: EvmSignature,
    evm_address: EvmAddress,
    agent: AgentPubKey,
    prev_action: ActionHash,
) -> ExternResult<ValidateCallbackResult> {
    let message = evm_signing_message(&evm_address, agent, prev_action);
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
    prev_action: ActionHash,
) -> ExternResult<ValidateCallbackResult> {
    let message = solana_signing_message(&solana_address, agent, prev_action);
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
    // Including the previous action hash in the signing message ensures that signature was
    // intended for a particular context, i.e. on the user's chain in this particular DHT.
    if action.prev_action() != &wallet_attestation.prev_action {
        return Ok(ValidateCallbackResult::Invalid(
            "Previous action doesn't match".into(),
        ));
    }
    match wallet_attestation.chain_wallet_signature {
        ChainWalletSignature::Evm {
            evm_address,
            evm_signature,
        } => verify_evm_signature(
            evm_signature,
            evm_address,
            wallet_attestation.agent,
            wallet_attestation.prev_action,
        ),
        ChainWalletSignature::Solana {
            solana_address,
            solana_signature,
        } => verify_solana_signature(
            solana_signature,
            solana_address,
            wallet_attestation.agent,
            wallet_attestation.prev_action,
        ),
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
