use std::{collections::HashMap, rc::Rc};

use hdi::prelude::*;
use holoom_types::{
    recipe::{
        JqInstructionArgumentNames, Recipe, RecipeArgument, RecipeArgumentType, RecipeExecution,
        RecipeInstruction, RecipeInstructionExecution,
    },
    ExternalIdAttestation, OracleDocument,
};
use indexmap::IndexMap;
use jaq_wrapper::{compile_filter, parse_single_json, run_filter, Val};
use username_registry_utils::deserialize_record_entry;

pub fn validate_create_recipe_execution(
    action: EntryCreationAction,
    recipe_execution: RecipeExecution,
) -> ExternResult<ValidateCallbackResult> {
    let recipe_record = must_get_valid_record(recipe_execution.recipe_ah)?;
    let recipe: Recipe = deserialize_record_entry(recipe_record)?;

    let mut vars: HashMap<String, Val> = HashMap::default();

    if recipe_execution.arguments.len() != recipe.arguments.len() {
        return Ok(ValidateCallbackResult::Invalid(
            "Incorrect number of arguments".into(),
        ));
    }

    for (arg, (arg_name, arg_type)) in recipe_execution
        .arguments
        .into_iter()
        .zip(recipe.arguments.into_iter())
    {
        let val = match (arg, arg_type) {
            (RecipeArgument::String { value }, RecipeArgumentType::String) => {
                Val::str(value.clone())
            }
            (RecipeArgument::EvmAddress { value }, RecipeArgumentType::EvmAddress) => {
                Val::str(value.to_string())
            }
            _ => {
                return Ok(ValidateCallbackResult::Invalid(
                    "Bad recipe argument".into(),
                ))
            }
        };
        vars.insert(arg_name, val);
    }

    if recipe_execution.instruction_executions.len() != recipe.instructions.len() {
        return Ok(ValidateCallbackResult::Invalid(
            "Incorrect number of instruction executions".into(),
        ));
    }

    for (instruction_execution, (out_var_name, instruction)) in recipe_execution
        .instruction_executions
        .into_iter()
        .zip(recipe.instructions.into_iter())
    {
        if vars.contains_key(&out_var_name) {
            unreachable!("Bad impl: A valid Recipe doesn't reassign vars");
        }

        let val = match (instruction_execution, instruction) {
            (RecipeInstructionExecution::Constant, RecipeInstruction::Constant { value }) => {
                // TODO: validate constant value in validate_create_recipe
                parse_single_json(&value)?
            }
            (
                RecipeInstructionExecution::GetCallerAgentPublicKey,
                RecipeInstruction::GetCallerAgentPublicKey,
            ) => Val::str(action.author().to_string()),
            (
                RecipeInstructionExecution::GetDocsListedByVar { doc_ahs },
                RecipeInstruction::GetDocsListedByVar { var_name },
            ) => {
                let list_val = vars
                    .get(&var_name)
                    .expect("Bad impl: A valid recipe doesn't use unassigned vars");
                let Val::Arr(item_vals) = list_val else {
                    return Ok(ValidateCallbackResult::Invalid(format!(
                        "var '{}' expected to contain array",
                        &var_name
                    )));
                };
                let mut expected_names = Vec::new();
                for val in item_vals.iter() {
                    match val {
                        Val::Str(identifier) => expected_names.push(identifier.as_ref().clone()),
                        _ => {
                            return Ok(ValidateCallbackResult::Invalid(format!(
                                "var '{}' expected to contain array of string elements",
                                &var_name
                            )))
                        }
                    }
                }

                let docs = doc_ahs
                    .iter()
                    .map(|doc_ah| {
                        let doc_record = must_get_valid_record(doc_ah.clone())?;
                        let doc: OracleDocument = deserialize_record_entry(doc_record)?;
                        Ok(doc)
                        // let val = parse_single_json(&doc.json_data)?;
                        // Ok(val)
                    })
                    .collect::<ExternResult<Vec<_>>>()?;

                let actual_names: Vec<String> = docs.iter().map(|doc| doc.name.clone()).collect();
                if expected_names != actual_names {
                    return Ok(ValidateCallbackResult::Invalid(
                        "Listed document name doesn't match".into(),
                    ));
                }
                let doc_vals = docs
                    .iter()
                    .map(|doc| {
                        let val = parse_single_json(&doc.json_data)?;
                        Ok(val)
                    })
                    .collect::<ExternResult<Vec<_>>>()?;
                Val::arr(doc_vals)
            }
            (
                RecipeInstructionExecution::GetCallerExternalId { attestation_ah },
                RecipeInstruction::GetCallerExternalId,
            ) => {
                let attestation_record = must_get_valid_record(attestation_ah)?;
                let attestation: ExternalIdAttestation =
                    deserialize_record_entry(attestation_record)?;
                Val::obj(IndexMap::from([
                    (
                        Rc::new(String::from("agent_pubkey")),
                        Val::str(attestation.internal_pubkey.to_string()),
                    ),
                    (
                        Rc::new(String::from("external_id")),
                        Val::str(attestation.external_id),
                    ),
                    (
                        Rc::new(String::from("display_name")),
                        Val::str(attestation.display_name),
                    ),
                ]))
            }
            (
                RecipeInstructionExecution::GetLatestDocWithIdentifier { doc_ah },
                RecipeInstruction::GetLatestDocWithIdentifier { var_name },
            ) => {
                let name_val = vars
                    .get(&var_name)
                    .expect("Bad impl: A valid recipe doesn't use unassigned vars");
                let Val::Str(name) = name_val else {
                    return Ok(ValidateCallbackResult::Invalid(format!(
                        "var '{}' expected to contain string",
                        &var_name
                    )));
                };
                let expected_name = name.as_ref().clone();
                let doc_record = must_get_valid_record(doc_ah)?;
                let doc: OracleDocument = deserialize_record_entry(doc_record)?;

                if doc.name != expected_name {
                    return Ok(ValidateCallbackResult::Invalid(
                        "Specified document name doesn't match".into(),
                    ));
                }
                parse_single_json(&doc.json_data)?
            }
            (
                RecipeInstructionExecution::Jq,
                RecipeInstruction::Jq {
                    input_var_names,
                    program,
                },
            ) => {
                let input_val = match input_var_names {
                    JqInstructionArgumentNames::Single { var_name } => vars
                        .get(&var_name)
                        .expect("Bad impl: A valid recipe doesn't use unassigned vars")
                        .clone(),
                    JqInstructionArgumentNames::List { var_names } => {
                        let map: IndexMap<Rc<String>, Val> = var_names
                            .into_iter()
                            .map(|var_name| {
                                let val = vars
                                    .get(&var_name)
                                    .expect("Bad impl: A valid recipe doesn't use unassigned vars")
                                    .clone();
                                (Rc::new(var_name), val)
                            })
                            .collect();
                        Val::obj(map)
                    }
                };
                let filter = compile_filter(&program)?;
                run_filter(filter, input_val)?
            }
            _ => {
                return Ok(ValidateCallbackResult::Invalid(
                    "Bad RecipeInstructionExecution".into(),
                ))
            }
        };
        vars.insert(out_var_name, val);
    }

    let return_val = vars
        .remove("$return")
        .expect("Bad impl: A valid recipe has a $return");
    let output = return_val.to_string();

    if output != recipe_execution.output {
        return Ok(ValidateCallbackResult::Invalid(
            "Provided output doesn't match execution's".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
