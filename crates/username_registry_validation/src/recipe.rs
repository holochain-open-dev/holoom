use hdi::prelude::*;
use holoom_types::recipe::{JqInstructionArgumentName, Recipe, RecipeInstruction};

pub fn validate_create_recipe(
    _action: EntryCreationAction,
    recipe: Recipe,
) -> ExternResult<ValidateCallbackResult> {
    if recipe.trusted_authors.is_empty() {
        return Ok(ValidateCallbackResult::Invalid(
            "Recipe needs at least 1 trusted author".into(),
        ));
    }

    match recipe.instructions.last() {
        None => {
            return Ok(ValidateCallbackResult::Invalid(
                "Recipe must contain at least 1 instruction".into(),
            ))
        }
        Some((var_name, _)) => {
            if var_name != "$return" {
                return Ok(ValidateCallbackResult::Invalid(
                    "Last instruction must be named '$return'".into(),
                ));
            }
        }
    }

    let mut declared_vars_names: HashSet<String> = HashSet::default();
    for (arg_name, _) in recipe.arguments {
        declared_vars_names.insert(arg_name);
    }

    for (out_var_name, inst) in recipe.instructions {
        let var_dependencies = match inst {
            RecipeInstruction::Constant { .. }
            | RecipeInstruction::GetCallerAgentPublicKey
            | RecipeInstruction::GetCallerExternalId => Vec::new(),
            RecipeInstruction::GetDocsListedByVar { var_name } => vec![var_name],
            RecipeInstruction::GetLatestDocWithIdentifier { var_name } => vec![var_name],
            RecipeInstruction::Jq {
                input_var_names, ..
            } => match input_var_names {
                JqInstructionArgumentName::Map(var_names) => var_names,
                JqInstructionArgumentName::Single(var_name) => vec![var_name],
            },
        };
        for dependency in var_dependencies {
            if !declared_vars_names.contains(&dependency) {
                return Ok(ValidateCallbackResult::Invalid(
                    "var used before declaration".into(),
                ));
            }
        }
        if declared_vars_names.contains(&out_var_name) {
            return Ok(ValidateCallbackResult::Invalid("var redeclared".into()));
        }
        declared_vars_names.insert(out_var_name);
    }

    Ok(ValidateCallbackResult::Valid)
}
