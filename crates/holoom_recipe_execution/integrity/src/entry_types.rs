use hdi::prelude::*;
use holoom_types::recipe::RecipeExecution;
use crate::holoom_recipe_execution::*;
//use external_attestation_validation::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_types]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    RecipeExecution(RecipeExecution),
}

impl EntryTypes {
    pub fn validate_create(self, action: Create) -> ExternResult<ValidateCallbackResult> {
        match self {
            EntryTypes::RecipeExecution(recipe_execution) => validate_create_recipe_execution(
                EntryCreationAction::Create(action),
                recipe_execution,
            ),
        }
    }
}
