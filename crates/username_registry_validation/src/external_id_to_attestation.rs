use hdi::prelude::*;
use holoom_types::ExternalIdAttestation;
use username_registry_utils::{get_authority_agent, hash_identifier};

pub fn validate_create_link_external_id_to_attestation(
    action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Only the authority can create link
    let authority_agent = get_authority_agent()?;
    if action.author != authority_agent {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the Username Registry Authority can create external ID attestation links".into(),
        ));
    }

    // Check the entry type for the given action hash
    let action_hash = ActionHash::try_from(target_address).map_err(|e| wasm_error!(e))?;
    let record = must_get_valid_record(action_hash)?;
    let external_id_attestation: ExternalIdAttestation = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;

    let expected_base_address = hash_identifier(external_id_attestation.external_id)?;
    if AnyLinkableHash::from(expected_base_address) != base_address {
        return Ok(ValidateCallbackResult::Invalid(
            "ExternalIdToAttestation base_address not derived from external_id".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_external_id_to_attestation(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "External ID Attestation links cannot be deleted",
    )))
}
