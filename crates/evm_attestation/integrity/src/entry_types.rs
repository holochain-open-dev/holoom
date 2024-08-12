use hdi::prelude::*;
use holoom_types::evm_signing_offer::SignedEvmSigningOffer;
use crate::evm_signing_offer::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    SignedEvmSigningOffer(SignedEvmSigningOffer),
}

impl EntryTypes {
    pub fn validate_create(self, action: Create) -> ExternResult<ValidateCallbackResult> {
        match self {
            EntryTypes::SignedEvmSigningOffer(evm_signing_offer) => {
                validate_create_signed_evm_signing_offer(
                    EntryCreationAction::Create(action),
                    evm_signing_offer,
                )
            }
        }
    }
}
