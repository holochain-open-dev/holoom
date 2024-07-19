use hdk::prelude::*;
use holoom_types::{JqExecution, OracleDocument, OracleDocumentListSnapshot, SnapshotInput};
use serde_json;
use username_registry_integrity::EntryTypes;
use username_registry_utils::deserialize_record_entry;

use crate::oracle_document::{
    get_latest_oracle_document_ah_for_name, get_related_oracle_document_names,
};

pub fn resolve_snapshot_input(input: SnapshotInput) -> ExternResult<Vec<String>> {
    let json_list = match input {
        SnapshotInput::JqExecution(jq_execution_ah) => {
            let record = get(jq_execution_ah, GetOptions::network())?.ok_or(wasm_error!(
                WasmErrorInner::Guest("JqExecution for SnapshotInput not found".into())
            ))?;
            let jq_execution: JqExecution = deserialize_record_entry(record)?;
            jq_execution.output
        }
        SnapshotInput::OracleDocument(oracle_document_ah) => {
            let record = get(oracle_document_ah, GetOptions::network())?.ok_or(wasm_error!(
                WasmErrorInner::Guest("JqExecution for SnapshotInput not found".into())
            ))?;
            let oracle_document: OracleDocument = deserialize_record_entry(record)?;
            oracle_document.json_data
        }
        SnapshotInput::RelationSnapshot(identifiers) => return Ok(identifiers),
    };

    serde_json::from_str(&json_list).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "SnapshotInput doesn't point to a list".into()
        ))
    })
}

pub fn build_latest_oracle_document_list_snapshot_for_frozen_input(
    input: SnapshotInput,
) -> ExternResult<OracleDocumentListSnapshot> {
    let names = resolve_snapshot_input(input.clone())?;
    let action_hashes = names
        .into_iter()
        .map(|name| {
            let action_hash = get_latest_oracle_document_ah_for_name(name.clone())?;
            action_hash.ok_or(wasm_error!(WasmErrorInner::Guest(format!(
                "Cannot build snapshot with missing document '{}'",
                name
            ))))
        })
        .collect::<ExternResult<Vec<ActionHash>>>()?;
    let snapshot = OracleDocumentListSnapshot {
        identifiers_input: input,
        resolved_documents: action_hashes,
    };
    Ok(snapshot)
}

pub fn refresh_oracle_document_snapshot_for_named_input_list_document(
    input_list_document_name: String,
) -> ExternResult<Record> {
    let input_ah = get_latest_oracle_document_ah_for_name(input_list_document_name.clone())?
        .ok_or(wasm_error!(WasmErrorInner::Guest(format!(
            "No linked documents for '{}'",
            input_list_document_name
        ))))?;
    let snapshot_input = SnapshotInput::OracleDocument(input_ah);
    let snapshot = build_latest_oracle_document_list_snapshot_for_frozen_input(snapshot_input)?;
    let snapshot_ah = create_entry(EntryTypes::OracleDocumentListSnapshot(snapshot))?;
    let record = get(snapshot_ah, GetOptions::network())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Newly created OracleDocumentListSnapshot not found".into())
    ))?;
    Ok(record)
}

#[hdk_extern]
pub fn refresh_oracle_document_snapshot_for_relation(
    relation_name: String,
) -> ExternResult<Record> {
    let identifiers = get_related_oracle_document_names(relation_name)?;
    let snapshot_input = SnapshotInput::RelationSnapshot(identifiers);
    let snapshot = build_latest_oracle_document_list_snapshot_for_frozen_input(snapshot_input)?;
    let snapshot_ah = create_entry(EntryTypes::OracleDocumentListSnapshot(snapshot))?;
    let record = get(snapshot_ah, GetOptions::network())?.ok_or(wasm_error!(
        WasmErrorInner::Guest("Newly created OracleDocumentListSnapshot not found".into())
    ))?;
    Ok(record)
}
