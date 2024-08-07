use hdi::prelude::*;
use holoom_types::ExternalIdAttestation;
use crate::external_id_attestation::*;
//use external_attestation_validation::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    ExternalIdAttestation(ExternalIdAttestation),
}

impl EntryTypes {
    pub fn validate_create(self, action: Create) -> ExternResult<ValidateCallbackResult> {
        match self {
            EntryTypes::ExternalIdAttestation(external_id_attestation) => {
                validate_create_external_id_attestation(
                    EntryCreationAction::Create(action),
                    external_id_attestation,
                )
            }
        }
    }
}
