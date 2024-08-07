use hdi::prelude::*;
use holoom_types::OracleDocument;
use crate::oracle_document::*;
//use external_attestation_validation::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    OracleDocument(OracleDocument),
}

impl EntryTypes {
    pub fn validate_create(self, action: Create) -> ExternResult<ValidateCallbackResult> {
        match self {
            EntryTypes::OracleDocument(oracle_document) => validate_create_oracle_document(
                EntryCreationAction::Create(action),
                oracle_document,
            ),
        }
    }
}
