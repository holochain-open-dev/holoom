use hdi::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub enum RecipeArgumentType {
    String,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub enum JqInstructionArgumentName {
    Single(String),
    Map(Vec<String>),
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub enum RecipeInstruction {
    GetLatestDocWithIdentifier {
        identifier: String,
    },
    Jq {
        input_names: JqInstructionArgumentName,
        program: String,
    },
    GetDocsListedByVar {
        var_name: String,
    },
    GetCallerExternalId,
    GetCallerAgentPublicKey,
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct Recipe {
    pub trusted_authors: Vec<AgentPubKey>,
    pub arguments: Vec<(String, RecipeArgumentType)>,
    pub instructions: Vec<(String, RecipeInstruction)>,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub enum RecipeArgument {
    String(String),
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub enum RecipeInstructionExecution {
    GetDocWithName { doc: ActionHash },
    Jq, // In memory
    GetDocsListedByVar { docs: Vec<ActionHash> },
    GetCallerExternalId { attestation: ActionHash },
    GetCallerAgentPublicKey, // In memory
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq)]
pub struct RecipeExecution {
    pub recipe_ah: ActionHash,
    pub arguments: Vec<RecipeArgument>,
    pub instruction_executions: Vec<RecipeInstructionExecution>,
    pub output: String,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug)]
pub struct ExecuteRecipePayload {
    pub recipe_ah: ActionHash,
    pub arguments: Vec<RecipeArgument>,
}
