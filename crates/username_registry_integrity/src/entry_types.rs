use hdi::prelude::*;
use holoom_types::{
    evm_signing_offer::EvmSigningOffer,
    recipe::{Recipe, RecipeExecution},
    ExternalIdAttestation, OracleDocument, UsernameAttestation, WalletAttestation,
};
use username_registry_validation::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    UsernameAttestation(UsernameAttestation),
    WalletAttestation(WalletAttestation),
    ExternalIdAttestation(ExternalIdAttestation),
    OracleDocument(OracleDocument),
    Recipe(Recipe),
    RecipeExecution(RecipeExecution),
    EvmSigningOffer(EvmSigningOffer),
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
            EntryTypes::WalletAttestation(wallet_attestation) => {
                validate_create_wallet_attestation(
                    EntryCreationAction::Create(action),
                    wallet_attestation,
                )
            }
            EntryTypes::ExternalIdAttestation(external_id_attestation) => {
                validate_create_external_id_attestation(
                    EntryCreationAction::Create(action),
                    external_id_attestation,
                )
            }
            EntryTypes::OracleDocument(oracle_document) => validate_create_oracle_document(
                EntryCreationAction::Create(action),
                oracle_document,
            ),
            EntryTypes::Recipe(recipe) => {
                validate_create_recipe(EntryCreationAction::Create(action), recipe)
            }
            EntryTypes::RecipeExecution(recipe_execution) => validate_create_recipe_execution(
                EntryCreationAction::Create(action),
                recipe_execution,
            ),
            EntryTypes::EvmSigningOffer(evm_signing_offer) => validate_create_evm_signing_offer(
                EntryCreationAction::Create(action),
                evm_signing_offer,
            ),
        }
    }
}
