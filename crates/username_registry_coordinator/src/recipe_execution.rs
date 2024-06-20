use std::{collections::HashMap, rc::Rc};

use hdk::prelude::*;
use holoom_types::{
    ExecuteRecipePayload, ExternalIdAttestation, JqInstructionArgumentName, OracleDocument, Recipe,
    RecipeArgument, RecipeArgumentType, RecipeExecution, RecipeInstruction,
    RecipeInstructionExecution,
};
use indexmap::IndexMap;
use jaq_wrapper::{compile_filter, parse_single_json, run_filter, Val};
use username_registry_integrity::EntryTypes;
use username_registry_utils::deserialize_record_entry;

use crate::{
    external_id_attestation::get_external_id_attestations_for_agent,
    oracle_document::{
        get_latest_oracle_document_ah_for_name, get_latest_oracle_document_for_name,
    },
};

#[hdk_extern]
pub fn create_recipe_execution(recipe_execution: RecipeExecution) -> ExternResult<Record> {
    let recipe_execution_ah = create_entry(EntryTypes::RecipeExecution(recipe_execution))?;
    let record = get(recipe_execution_ah, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from(
            "Could not find the newly created RecipeExecution"
        ))
    ))?;

    Ok(record)
}

#[hdk_extern]
pub fn execute_recipe(payload: ExecuteRecipePayload) -> ExternResult<Record> {
    let recipe_record = get(payload.recipe_ah.clone(), GetOptions::default())?.ok_or(
        wasm_error!(WasmErrorInner::Guest("Recipe not found".into())),
    )?;
    let recipe: Recipe = deserialize_record_entry(recipe_record)?;

    let mut vars: HashMap<String, Val> = HashMap::default();
    let mut instruction_executions: Vec<RecipeInstructionExecution> = Vec::default();

    if payload.arguments.len() != recipe.arguments.len() {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "Incorrect number of arguments".into()
        )));
    }
    for (arg, (arg_name, arg_type)) in payload.arguments.iter().zip(recipe.arguments) {
        let val = match (arg, arg_type) {
            (RecipeArgument::String(value), RecipeArgumentType::String) => Val::str(value.clone()),
            _ => {
                return Err(wasm_error!(WasmErrorInner::Guest(
                    "Bad recipe argument".into()
                )))
            }
        };
        vars.insert(arg_name, val);
    }

    for (var_name, instruction) in recipe.instructions {
        if vars.contains_key(&var_name) {
            unreachable!("Bad impl: A valid Recipe doesn't reassign vars");
        }
        let (val, instruction_execution) = match instruction {
            RecipeInstruction::Constant { value } => {
                let val = parse_single_json(&value)?;
                (val, RecipeInstructionExecution::Constant)
            }
            RecipeInstruction::GetCallerAgentPublicKey => {
                let val = Val::Str(Rc::new(agent_info()?.agent_initial_pubkey.to_string()));
                (val, RecipeInstructionExecution::GetCallerAgentPublicKey)
            }
            RecipeInstruction::GetDocsListedByVar { var_name } => {
                let list_val = vars
                    .get(&var_name)
                    .expect("Bad impl: A valid recipe doesn't use unassigned vars");
                let Val::Arr(item_vals) = list_val else {
                    return Err(wasm_error!(WasmErrorInner::Guest(format!(
                        "var '{}' expected to contain array",
                        &var_name
                    ))));
                };
                let doc_action_hashes = item_vals
                    .iter()
                    .map(|val| {
                        let Val::Str(identifier) = val else {
                            return Err(wasm_error!(WasmErrorInner::Guest(format!(
                                "var '{}' expected to contain array of string elements",
                                &var_name
                            ))));
                        };
                        get_latest_oracle_document_ah_for_name(identifier.as_ref().clone())?.ok_or(
                            wasm_error!(WasmErrorInner::Guest(format!(
                                "No OracleDocument for identifier '{}'",
                                &identifier
                            ))),
                        )
                    })
                    .collect::<ExternResult<Vec<_>>>()?;
                let doc_vals = doc_action_hashes
                    .iter()
                    .map(|doc_ah| {
                        let doc_record = get(doc_ah.clone(), GetOptions::default())?.ok_or(
                            wasm_error!(WasmErrorInner::Guest("OracleDocument not found".into())),
                        )?;
                        let doc: OracleDocument = deserialize_record_entry(doc_record)?;
                        let val = parse_single_json(&doc.json_data)?;
                        Ok(val)
                    })
                    .collect::<ExternResult<Vec<_>>>()?;
                let val = Val::arr(doc_vals);
                let instruction_execution = RecipeInstructionExecution::GetDocsListedByVar {
                    docs: doc_action_hashes,
                };
                (val, instruction_execution)
            }
            RecipeInstruction::GetCallerExternalId => {
                let mut attestation_records =
                    get_external_id_attestations_for_agent(agent_info()?.agent_initial_pubkey)?;
                if attestation_records.len() != 1 {
                    return Err(wasm_error!(WasmErrorInner::Guest(
                        "TODO: support ExternalIdAttestation selecting".into()
                    )));
                }
                let attestation_record = attestation_records.pop().expect("Length check above");
                let attestation_ah = attestation_record.action_address().clone();
                let attestation: ExternalIdAttestation =
                    deserialize_record_entry(attestation_record)?;
                let val = Val::obj(IndexMap::from([
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
                ]));
                let instruction_execution = RecipeInstructionExecution::GetCallerExternalId {
                    attestation: attestation_ah,
                };
                (val, instruction_execution)
            }
            RecipeInstruction::GetLatestDocWithIdentifier { var_name } => {
                let identifier_val = vars
                    .get(&var_name)
                    .expect("Bad impl: A valid recipe doesn't use unassigned vars");
                let Val::Str(identifier) = identifier_val else {
                    return Err(wasm_error!(WasmErrorInner::Guest(format!(
                        "var '{}' expected to contain string",
                        &var_name
                    ))));
                };
                let doc_record = get_latest_oracle_document_for_name(identifier.as_ref().clone())?
                    .ok_or(wasm_error!(WasmErrorInner::Guest(format!(
                        "No OracleDocument found for identifier '{}'",
                        identifier
                    ))))?;
                let doc_ah = doc_record.action_address().clone();
                let doc: OracleDocument = deserialize_record_entry(doc_record)?;
                let val = parse_single_json(&doc.json_data)?;
                let instruction_execution =
                    RecipeInstructionExecution::GetDocWithName { doc: doc_ah };
                (val, instruction_execution)
            }
            RecipeInstruction::Jq {
                input_var_names,
                program,
            } => {
                let input_val = match input_var_names {
                    JqInstructionArgumentName::Single(var_name) => vars
                        .get(&var_name)
                        .expect("Bad impl: A valid recipe doesn't use unassigned vars")
                        .clone(),
                    JqInstructionArgumentName::Map(var_names) => {
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
                let val = run_filter(filter, input_val)?;
                let instruction_execution = RecipeInstructionExecution::Jq;
                (val, instruction_execution)
            }
        };
        vars.insert(var_name, val);
        instruction_executions.push(instruction_execution)
    }

    let return_val = vars
        .remove("$return")
        .expect("Bad impl: A valid recipe has a $return");
    let output = return_val.to_string();

    let recipe_execution = RecipeExecution {
        recipe_ah: payload.recipe_ah,
        arguments: payload.arguments,
        instruction_executions,
        output,
    };

    create_recipe_execution(recipe_execution)
}
