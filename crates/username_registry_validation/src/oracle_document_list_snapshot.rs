use hdi::prelude::*;
use holoom_types::{JqExecution, OracleDocument, OracleDocumentListSnapshot, SnapshotInput};
use username_registry_utils::deserialize_record_entry;

pub fn validate_create_oracle_document_list_snapshot(
    _action: EntryCreationAction,
    oracle_document_list_snapshot: OracleDocumentListSnapshot,
) -> ExternResult<ValidateCallbackResult> {
    let (resolution_validity, identifiers) =
        must_resolve_snapshot_input(oracle_document_list_snapshot.identifiers_input)?;
    if resolution_validity != ValidateCallbackResult::Valid {
        return Ok(resolution_validity);
    }

    let resolved_documents = oracle_document_list_snapshot
        .resolved_documents
        .into_iter()
        .map(|ah| {
            let record = must_get_valid_record(ah)?;
            let oracle_document: OracleDocument = deserialize_record_entry(record)?;
            Ok(oracle_document)
        })
        .collect::<ExternResult<Vec<_>>>()?;
    for (oracle_document, identifier) in resolved_documents.into_iter().zip(identifiers.into_iter())
    {
        if oracle_document.name != identifier {
            return Ok(ValidateCallbackResult::Invalid(format!(
                "Oracle document identifier mismatch: '{}' != '{}'",
                oracle_document.name, identifier
            )));
        }
    }

    Ok(ValidateCallbackResult::Valid)
}

pub fn must_resolve_snapshot_input(
    input: SnapshotInput,
) -> ExternResult<(ValidateCallbackResult, Vec<String>)> {
    // Must get the input document
    let json_list = match input {
        SnapshotInput::JqExecution(jq_execution_ah) => {
            let record = must_get_valid_record(jq_execution_ah)?;
            let jq_execution: JqExecution = deserialize_record_entry(record)?;
            jq_execution.output
        }
        SnapshotInput::OracleDocument(oracle_document_ah) => {
            let record = must_get_valid_record(oracle_document_ah)?;
            let oracle_document: OracleDocument = deserialize_record_entry(record)?;
            oracle_document.json_data
        }
        SnapshotInput::RelationSnapshot(identifiers) => {
            return Ok((ValidateCallbackResult::Valid, identifiers))
        }
    };

    // Input document must be a list of identifiers
    let Ok(identifiers) = serde_json::from_str::<Vec<String>>(&json_list) else {
        return Ok((
            ValidateCallbackResult::Invalid("SnapshotInput doesn't point to a list".into()),
            Vec::default(),
        ));
    };
    Ok((ValidateCallbackResult::Valid, identifiers))
}
