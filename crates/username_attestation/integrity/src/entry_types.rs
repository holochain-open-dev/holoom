use hdi::prelude::*;
use holoom_types::UsernameAttestation;
use crate::username_attestation::*;
//use external_attestation_validation::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    UsernameAttestation(UsernameAttestation),
}

impl EntryTypes {
    pub fn validate_create(self, action: Create) -> ExternResult<ValidateCallbackResult> {
        match self {
            EntryTypes::UsernameAttestation(username_attestation) => {
                validate_create_username_attestation(
                    EntryCreationAction::Create(action),
                    username_attestation,
                )
            }
        }
    }
}
