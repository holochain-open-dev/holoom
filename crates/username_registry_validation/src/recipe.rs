use hdi::prelude::*;
use holoom_types::recipe::Recipe;

pub fn validate_create_recipe(
    _action: EntryCreationAction,
    _recipe: Recipe,
) -> ExternResult<ValidateCallbackResult> {
    // TODO:
    // - check there is at least one trusted author
    // - check all var names are know at execution time
    // - check vars aren't redefined
    // - check last instruction is called '$return'
    Ok(ValidateCallbackResult::Valid)
}
