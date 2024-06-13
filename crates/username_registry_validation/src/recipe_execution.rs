use hdi::prelude::*;
use holoom_types::RecipeExecution;

pub fn validate_create_recipe_execution(
    _action: EntryCreationAction,
    _recipe_execution: RecipeExecution,
) -> ExternResult<ValidateCallbackResult> {
    // TODO:
    // - step through instructions checking for consistency with specified recipe
    Ok(ValidateCallbackResult::Valid)
}
