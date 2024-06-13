use hdk::prelude::*;
use holoom_types::Recipe;
use username_registry_integrity::EntryTypes;

#[hdk_extern]
pub fn create_recipe(recipe: Recipe) -> ExternResult<Record> {
    let recipe_ah = create_entry(EntryTypes::Recipe(recipe))?;
    let record = get(recipe_ah, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from("Could not find the newly created Recipe"))
    ))?;

    Ok(record)
}
