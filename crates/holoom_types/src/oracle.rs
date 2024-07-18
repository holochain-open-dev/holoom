use hdi::prelude::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[hdk_entry_helper]
#[derive(Clone, PartialEq, TS)]
#[ts(export)]
pub struct OracleDocument {
    // E.g. organizers/1234/championship-ids
    pub name: String,
    pub json_data: String,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub enum SnapshotInput {
    JqExecution(#[ts(type = "ActionHash")] ActionHash),
    OracleDocument(#[ts(type = "ActionHash")] ActionHash),
    RelationSnapshot(Vec<String>),
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq, TS)]
#[ts(export)]
pub struct OracleDocumentListSnapshot {
    /// The action hash of an OracleDocument that gives a list of identifiers
    pub identifiers_input: SnapshotInput,
    #[ts(type = "ActionHash[]")]
    pub resolved_documents: Vec<ActionHash>,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub enum JqExecutionInput {
    OracleDocument(#[ts(type = "ActionHash")] ActionHash),
    OracleDocumentListSnapshot(#[ts(type = "ActionHash")] ActionHash),
    JqExecution(#[ts(type = "ActionHash")] ActionHash),
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq, TS)]
#[ts(export)]
pub struct JqExecution {
    pub program: String,
    pub input: JqExecutionInput,
    pub output: String,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct RefreshJqExecutionForNamedRelationPayload {
    pub relation_name: String,
    pub program: String,
}

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct DocumentRelationTag {
    pub name: String,
    pub relation: String,
}
