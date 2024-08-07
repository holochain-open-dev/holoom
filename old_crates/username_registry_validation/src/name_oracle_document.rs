use hdi::prelude::*;
use holoom_types::OracleDocument;
use username_registry_utils::hash_identifier;

pub fn validate_create_link_name_to_oracle_document(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // Check the entry type for the given action hash
    let action_hash = ActionHash::try_from(target_address).map_err(|e| wasm_error!(e))?;
    let record = must_get_valid_record(action_hash)?;
    let oracle_document: OracleDocument = record
        .entry()
        .to_app_option()
        .map_err(|e| wasm_error!(e))?
        .ok_or(wasm_error!(WasmErrorInner::Guest(String::from(
            "Linked action must reference an entry"
        ))))?;

    let expected_base_address = hash_identifier(oracle_document.name)?;
    if AnyLinkableHash::from(expected_base_address) != base_address {
        return Ok(ValidateCallbackResult::Invalid(
            "OracleDocument name doesn't hash to base address".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_name_to_oracle_document(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "OracleDocument links cannot be deleted",
    )))
}
