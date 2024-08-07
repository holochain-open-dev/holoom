use hdi::prelude::*;
use holoom_types::ExternalIdAttestation;
use username_registry_utils::get_authority_agent;

pub fn validate_create_external_id_attestation(
    action: EntryCreationAction,
    _external_id_attestation: ExternalIdAttestation,
) -> ExternResult<ValidateCallbackResult> {
    // Only the authority can publish
    let authority_agent = get_authority_agent()?;
    if action.author() != &authority_agent {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the Username Registry Authority can create external ID attestations".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
