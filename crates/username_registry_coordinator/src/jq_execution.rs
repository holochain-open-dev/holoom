use hdk::prelude::*;
use holoom_types::{
    JqExecution, JqExecutionInput, OracleDocument, OracleDocumentListSnapshot,
    RefreshJqExecutionForNamedRelationPayload,
};
use jaq_wrapper::{compile_and_run_jq, JqProgramInput};
use username_registry_integrity::EntryTypes;
use username_registry_utils::deserialize_record_entry;

use crate::oracle_document_list_snapshot::refresh_oracle_document_snapshot_for_relation;

#[hdk_extern]
pub fn refresh_jq_execution_for_named_relation(
    payload: RefreshJqExecutionForNamedRelationPayload,
) -> ExternResult<Record> {
    let snapshot_record = refresh_oracle_document_snapshot_for_relation(payload.relation_name)?;
    let snapshot_ah = snapshot_record.action_address().clone();
    let snapshot: OracleDocumentListSnapshot = deserialize_record_entry(snapshot_record)?;

    let jsons = snapshot
        .resolved_documents
        .into_iter()
        .map(|ah| {
            let oracle_document_record = get(ah, GetOptions::default())?.ok_or(wasm_error!(
                WasmErrorInner::Guest("OracleDocument not found".into())
            ))?;
            let oracle_document: OracleDocument = deserialize_record_entry(oracle_document_record)?;
            Ok(oracle_document.json_data)
        })
        .collect::<ExternResult<Vec<_>>>()?;

    let jq_program_output = compile_and_run_jq(&payload.program, JqProgramInput::Slurp(jsons))?;

    let jq_execution = JqExecution {
        program: payload.program,
        input: JqExecutionInput::OracleDocumentListSnapshot(snapshot_ah),
        output: jq_program_output,
    };

    let jq_execution_ah = create_entry(EntryTypes::JqExecution(jq_execution))?;
    let jq_execution_record = get(jq_execution_ah, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Newly created JqExecution not found".into())
    ))?;
    Ok(jq_execution_record)
}
