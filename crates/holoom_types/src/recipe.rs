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
    Constant {
        value: String,
    },
    GetLatestDocWithIdentifier {
        var_name: String,
    },
    Jq {
        input_var_names: JqInstructionArgumentName,
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
    Constant, // In memory
    GetLatestDocWithIdentifier { doc_ah: ActionHash },
    Jq, // In memory
    GetDocsListedByVar { doc_ahs: Vec<ActionHash> },
    GetCallerExternalId { attestation_ah: ActionHash },
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
