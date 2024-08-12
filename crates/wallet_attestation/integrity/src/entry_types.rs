use hdi::prelude::*;
use holoom_types::WalletAttestation;
use crate::wallet_attestation::*;
//use external_attestation_validation::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    WalletAttestation(WalletAttestation),
}

impl EntryTypes {
    pub fn validate_create(self, action: Create) -> ExternResult<ValidateCallbackResult> {
        match self {
            EntryTypes::WalletAttestation(wallet_attestation) => {
                validate_create_wallet_attestation(
                    EntryCreationAction::Create(action),
                    wallet_attestation,
                )
            }
        }
    }
}
