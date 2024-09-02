use hdi::prelude::*;
use holoom_types::ExternalIdAttestation;

pub fn validate_create_link_agent_to_external_id_attestations(
    action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = ActionHash::try_from(target_address).map_err(|e| wasm_error!(e))?;
    let record = must_get_valid_record(action_hash)?;

    // Only the attestation author can create links to it
    if &action.author != record.action().author() {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the external ID attestation author can create links to it".into(),
        ));
    }

    let _external_id_attestation: ExternalIdAttestation = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_agent_to_external_id_attestations(
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
