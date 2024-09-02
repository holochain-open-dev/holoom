use hdi::prelude::*;
use holoom_types::ExternalIdAttestation;

pub fn validate_create_external_id_attestation(
    _action: EntryCreationAction,
    _external_id_attestation: ExternalIdAttestation,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
