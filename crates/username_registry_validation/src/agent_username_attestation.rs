use game_identity_types::{GameIdentityDnaProperties, UsernameAttestation};
use hdi::prelude::*;

pub fn validate_create_link_agent_to_username_attestations(
    action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Only the authority can create link
    let dna_props = GameIdentityDnaProperties::try_from_dna_properties()?;
    let authority_agent = &AgentPubKey::try_from(dna_props.authority_agent).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Failed to deserialize AgentPubKey from dna properties".into()
        ))
    })?;
    if &action.author != authority_agent {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the Username Registry Authority can create attestation links".into(),
        ));
    }

    // Check the entry type for the given action hash
    let action_hash = ActionHash::try_from(target_address).map_err(|e| wasm_error!(e))?;
    let record = must_get_valid_record(action_hash)?;
    let _username_attestation: UsernameAttestation = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_agent_to_username_attestations(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Username Attestation links cannot be deleted",
    )))
}
