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

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct DocumentRelationTag {
    pub name: String,
    pub relation: String,
}
