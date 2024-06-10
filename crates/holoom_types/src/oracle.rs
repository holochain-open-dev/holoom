use hdi::prelude::*;
use serde::{Deserialize, Serialize};

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct OracleDocument {
    // E.g. organizers/1234/championship-ids
    pub name: String,
    pub json_data: String,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub enum SnapshotInput {
    JqExecution(ActionHash),
    OracleDocument(ActionHash),
    RelationSnapshot(Vec<String>),
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct OracleDocumentListSnapshot {
    /// The action hash of an OracleDocument that gives a list of identifiers
    pub identifiers_input: SnapshotInput,
    pub resolved_documents: Vec<ActionHash>,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub enum JqExecutionInput {
    OracleDocument(ActionHash),
    OracleDocumentListSnapshot(ActionHash),
    JqExecution(ActionHash),
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct JqExecution {
    pub program: String,
    pub input: JqExecutionInput,
    pub output: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RefreshJqExecutionForNamedRelationPayload {
    pub relation_name: String,
    pub program: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct RelateOracleDocumentPayload {
    pub name: String,
    pub relation: String,
}
