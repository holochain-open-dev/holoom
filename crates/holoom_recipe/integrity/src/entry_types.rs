use hdi::prelude::*;
use holoom_types::recipe::Recipe;
use crate::holoom_recipe::*;
//use external_attestation_validation::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    Recipe(Recipe),
}

impl EntryTypes {
    pub fn validate_create(self, action: Create) -> ExternResult<ValidateCallbackResult> {
        match self {
            EntryTypes::Recipe(recipe) => {
                validate_create_recipe(EntryCreationAction::Create(action), recipe)
            }
        }
    }
}
