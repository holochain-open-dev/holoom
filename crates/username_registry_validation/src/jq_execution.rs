use hdi::prelude::*;
use holoom_types::{JqExecution, JqExecutionInput, OracleDocument, OracleDocumentListSnapshot};
use jaq_wrapper::{compile_and_run_jq, JqProgramInput};
use username_registry_utils::deserialize_record_entry;

pub fn validate_create_jq_execution(
    _action: EntryCreationAction,
    jq_execution: JqExecution,
) -> ExternResult<ValidateCallbackResult> {
    let input = match jq_execution.input {
        JqExecutionInput::OracleDocument(oracle_document_ah) => {
            let record = must_get_valid_record(oracle_document_ah)?;
            let oracle_document: OracleDocument = deserialize_record_entry(record)?;
            JqProgramInput::Single(oracle_document.json_data)
        }
        JqExecutionInput::OracleDocumentListSnapshot(snapshot_ah) => {
            let record = must_get_valid_record(snapshot_ah)?;
            let snapshot: OracleDocumentListSnapshot = deserialize_record_entry(record)?;
            let jsons = snapshot
                .resolved_documents
                .into_iter()
                .map(|oracle_document_ah| {
                    let record = must_get_valid_record(oracle_document_ah)?;
                    let oracle_document: OracleDocument = deserialize_record_entry(record)?;
                    Ok(oracle_document.json_data)
                })
                .collect::<ExternResult<Vec<_>>>()?;
            JqProgramInput::Slurp(jsons)
        }
        JqExecutionInput::JqExecution(_) => {
            todo!()
        }
    };

    let output = compile_and_run_jq(&jq_execution.program, input)?;
    if output != jq_execution.output {
        return Ok(ValidateCallbackResult::Invalid(
            "Program output doesn't match".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
