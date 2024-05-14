use hdi::prelude::*;
use holoom_types::{get_authority_agent, ExternalIdAttestation};

pub fn validate_create_external_id_attestation(
    action: EntryCreationAction,
    _external_id_attestation: ExternalIdAttestation,
) -> ExternResult<ValidateCallbackResult> {
    // Only the authority can publish
    let authority_agent = get_authority_agent()?;
    if action.author() != &authority_agent {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the External ID Registry Authority can create external ID attestations".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}

pub fn validate_update_external_id_attestation(
    _action: Update,
    _external_id_attestation: ExternalIdAttestation,
    _original_action: EntryCreationAction,
    _original_external_id_attestation: ExternalIdAttestation,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "External ID Attestations cannot be updated",
    )))
}
pub fn validate_delete_external_id_attestation(
    _action: Delete,
    _original_action: EntryCreationAction,
    _original_external_id_attestation: ExternalIdAttestation,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "External ID Attestations cannot be deleted",
    )))
}
