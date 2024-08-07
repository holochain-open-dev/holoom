use std::{collections::HashMap, rc::Rc};

use hdk::prelude::*;
use holoom_types::{recipe::*, ExternalIdAttestation, OracleDocument};
use indexmap::IndexMap;
use jaq_wrapper::{compile_filter, parse_single_json, run_filter, Val};
use holoom_recipe_execution_integrity::EntryTypes;
use shared_utils::deserialize_record_entry;
//use external_attestation::external_attestation::get_external_id_attestations_for_agent;
//use oracle_document::oracle_document::{ get_latest_oracle_document_ah_for_name, get_latest_oracle_document_for_name};

//use crate::{
    //external_attestation::get_external_id_attestations_for_agent,
  //  oracle_document::{
  //      get_latest_oracle_document_ah_for_name, get_latest_oracle_document_for_name,
  //  },
//};

#[hdk_extern]
pub fn create_recipe_execution(recipe_execution: RecipeExecution) -> ExternResult<Record> {
    let recipe_execution_ah = create_entry(EntryTypes::RecipeExecution(recipe_execution))?;
    let record = get(recipe_execution_ah, GetOptions::network())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from(
            "Could not find the newly created RecipeExecution"
        ))
    ))?;

    Ok(record)
}

#[hdk_extern]
pub fn execute_recipe(payload: ExecuteRecipePayload) -> ExternResult<Record> {
    let recipe_record = get(payload.recipe_ah.clone(), GetOptions::network())?.ok_or(
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
            (RecipeArgument::String { value }, RecipeArgumentType::String) => {
                Val::str(value.clone())
            }
            (RecipeArgument::EvmAddress { value }, RecipeArgumentType::EvmAddress) => {
                Val::str(value.to_string())
            }
            _ => {
                return Err(wasm_error!(WasmErrorInner::Guest(
                    "Bad recipe argument".into()
                )))
            }
        };
        vars.insert(arg_name, val);
    }

    for (out_var_name, instruction) in recipe.instructions {
        if vars.contains_key(&out_var_name) {
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
                let doc_ahs = item_vals
                    .iter()
                    .map(|val| {
                        let Val::Str(identifier) = val else {
                            return Err(wasm_error!(WasmErrorInner::Guest(format!(
                                "var '{}' expected to contain array of string elements",
                                &var_name
                            ))));
                        };
                        get_latest_oracle_document_ah_for_name(
                        ExecuteOracleRecipePayload { name:identifier.as_ref().clone(),
                            trusted:recipe.trusted_authors,
                        }.into()?)?
                        .ok_or(wasm_error!(WasmErrorInner::Guest(
                            format!("No OracleDocument for identifier '{}'", &identifier)
                        )))
                    })
                    .collect::<ExternResult<Vec<_>>>()?;
                let doc_vals = doc_ahs
                    .iter()
                    .map(|doc_ah| {
                        let doc_record = get(doc_ah.clone(), GetOptions::network())?.ok_or(
                            wasm_error!(WasmErrorInner::Guest("OracleDocument not found".into())),
                        )?;
                        let doc: OracleDocument = deserialize_record_entry(doc_record)?;
                        let val = parse_single_json(&doc.json_data)?;
                        Ok(val)
                    })
                    .collect::<ExternResult<Vec<_>>>()?;
                let val = Val::arr(doc_vals);
                let instruction_execution =
                    RecipeInstructionExecution::GetDocsListedByVar { doc_ahs };
                (val, instruction_execution)
            }
            RecipeInstruction::GetLatestCallerExternalId => {
                let mut attestation_records =
                    get_external_id_attestations_for_agent(SerializedBytes::try_from(agent_info()?.agent_initial_pubkey))?;
                let attestation_record =
                    attestation_records
                        .pop()
                        .ok_or(wasm_error!(WasmErrorInner::Guest(
                            "Agent has no External ID Attestations".into()
                        )))?;
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
                let instruction_execution =
                    RecipeInstructionExecution::GetLatestCallerExternalId { attestation_ah };
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
                let doc_record = get_latest_oracle_document_for_name(
                    ExecuteOracleRecipePayload { name:identifier.as_ref().clone(),
                    trusted:recipe.trusted_authors,
                }.into()?)?
                .ok_or(wasm_error!(WasmErrorInner::Guest(format!(
                    "No OracleDocument found for identifier '{}'",
                    identifier
                ))))?;
                let doc_ah = doc_record.action_address().clone();
                let doc: OracleDocument = deserialize_record_entry(doc_record)?;
                let val = parse_single_json(&doc.json_data)?;
                let instruction_execution =
                    RecipeInstructionExecution::GetLatestDocWithIdentifier { doc_ah };
                (val, instruction_execution)
            }
            RecipeInstruction::Jq {
                input_var_names,
                program,
            } => {
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
                let val = run_filter(filter, input_val)?;
                let instruction_execution = RecipeInstructionExecution::Jq;
                (val, instruction_execution)
            }
        };
        vars.insert(out_var_name, val);
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


fn get_latest_oracle_document_ah_for_name(payload: SerializedBytes) -> ExternResult<Option<ActionHash>>{
    let call_response = call(CallTargetCell::Local, ZomeName::from("oracle_document"), FunctionName("get_latest_oracle_document_ah_for_name".into()), None, payload)?;
    match call_response {
        ZomeCallResponse::Ok(result) => {     // Of type ExternIO, wrapper around byte array
            //let posts: Vec<Record> = result.decode().map_err(|err| wasm_error!(err))?;
            let data: Option<HoloHash<hash_type::Action>> = result.decode().map_err(|err| wasm_error!(err))?;
            //debug!("{:?}",data.signed_action.into());
            return Ok(data)
        },
        ZomeCallResponse::NetworkError(err) => {
            Err(wasm_error!(WasmErrorInner::Guest(format!("There was a network error: {:?}", err))))?
        },
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Failed to handle remote call".into()
        )))?
    } 
    Err(wasm_error!(WasmErrorInner::Guest("no data returned".into())))
}

fn get_latest_oracle_document_for_name(payload: SerializedBytes) -> ExternResult<Option<Record>>{
    let call_response = call(CallTargetCell::Local, ZomeName::from("oracle_document"), FunctionName("get_latest_oracle_document_for_name".into()), None, payload)?;
    match call_response {
        ZomeCallResponse::Ok(result) => {     // Of type ExternIO, wrapper around byte array
            //let posts: Vec<Record> = result.decode().map_err(|err| wasm_error!(err))?;
            let data: Option<Record> = result.decode().map_err(|err| wasm_error!(err))?;
            //debug!("{:?}",data.signed_action.into());
            return Ok(data)
        },
        ZomeCallResponse::NetworkError(err) => {
            Err(wasm_error!(WasmErrorInner::Guest(format!("There was a network error: {:?}", err))))?
        },
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Failed to handle remote call".into()
        )))?
    } 
    Err(wasm_error!(WasmErrorInner::Guest("no data returned".into())))
}

fn get_external_id_attestations_for_agent(payload: SerializedBytes) -> ExternResult<Vec<Record>>{
    let call_response = call(CallTargetCell::Local, ZomeName::from("external_attestation"), FunctionName("get_external_id_attestations_for_agent".into()), None, payload)?;
    match call_response {
        ZomeCallResponse::Ok(result) => {     // Of type ExternIO, wrapper around byte array
            //let posts: Vec<Record> = result.decode().map_err(|err| wasm_error!(err))?;
            let data: Vec<Record> = result.decode().map_err(|err| wasm_error!(err))?;
            //debug!("{:?}",data.signed_action.into());
            return Ok(data)
        },
        ZomeCallResponse::NetworkError(err) => {
            Err(wasm_error!(WasmErrorInner::Guest(format!("There was a network error: {:?}", err))))?
        },
        _ => Err(wasm_error!(WasmErrorInner::Guest(
            "Failed to handle remote call".into()
        )))?
    } 
    Err(wasm_error!(WasmErrorInner::Guest("no data returned".into())))
}