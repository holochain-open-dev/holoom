use hdi::prelude::*;
use holoom_types::OracleDocument;

pub fn validate_create_oracle_document(
    _action: EntryCreationAction,
    _oracle_document: OracleDocument,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
