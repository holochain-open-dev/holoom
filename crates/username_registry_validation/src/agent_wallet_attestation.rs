use hdi::prelude::*;
use holoom_types::WalletAttestation;

pub fn validate_create_link_agent_to_wallet_attestations(
    action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = ActionHash::try_from(target_address).map_err(|e| wasm_error!(e))?;
    let record = must_get_valid_record(action_hash)?;
    let wallet_attestation: WalletAttestation = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;

    if action.author != wallet_attestation.agent {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the owner can create wallet attestation links".into(),
        ));
    }
    let base_address_agent = match AgentPubKey::try_from(base_address) {
        Ok(agent) => agent,
        Err(_) => {
            return Ok(ValidateCallbackResult::Invalid(
                "Base address must be an agent".into(),
            ));
        }
    };
    if wallet_attestation.agent != base_address_agent {
        return Ok(ValidateCallbackResult::Invalid(
            "Link must be from agent in attestation".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_agent_to_wallet_attestations(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Wallet Attestation links cannot be deleted",
    )))
}
