use hdi::prelude::*;
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::EvmAddress;

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type")]
pub enum RecipeArgumentType {
    String,
    EvmAddress,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type")]
pub enum JqInstructionArgumentNames {
    Single { var_name: String },
    List { var_names: Vec<String> },
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type")]
pub enum RecipeInstruction {
    Constant {
        value: String,
    },
    GetLatestDocWithIdentifier {
        var_name: String,
    },
    Jq {
        input_var_names: JqInstructionArgumentNames,
        program: String,
    },
    GetDocsListedByVar {
        var_name: String,
    },
    GetLatestCallerExternalId {
        #[ts(type = "AgentPubKey")]
        trusted_author: AgentPubKey,
    },
    GetCallerAgentPublicKey,
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq, TS)]
#[ts(export)]
pub struct Recipe {
    #[ts(type = "AgentPubKey[]")]
    pub trusted_authors: Vec<AgentPubKey>,
    pub arguments: Vec<(String, RecipeArgumentType)>,
    pub instructions: Vec<(String, RecipeInstruction)>,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug, TS)]
#[ts(export)]
#[serde(tag = "type")]
pub enum RecipeArgument {
    String {
        value: String,
    },
    EvmAddress {
        #[ts(type = "Uint8Array")]
        value: EvmAddress,
    },
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub enum RecipeInstructionExecution {
    Constant, // In memory
    GetLatestDocWithIdentifier {
        #[ts(type = "ActionHash")]
        doc_ah: ActionHash,
    },
    Jq, // In memory
    GetDocsListedByVar {
        #[ts(type = "ActionHash[]")]
        doc_ahs: Vec<ActionHash>,
    },
    GetLatestCallerExternalId {
        #[ts(type = "ActionHash")]
        attestation_ah: ActionHash,
    },
    GetCallerAgentPublicKey, // In memory
}

#[hdk_entry_helper]
#[derive(Clone, PartialEq, TS)]
#[ts(export)]
pub struct RecipeExecution {
    #[ts(type = "ActionHash")]
    pub recipe_ah: ActionHash,
    pub arguments: Vec<RecipeArgument>,
    pub instruction_executions: Vec<RecipeInstructionExecution>,
    pub output: String,
}

#[derive(Clone, PartialEq, Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct ExecuteRecipePayload {
    #[ts(type = "ActionHash")]
    pub recipe_ah: ActionHash,
    pub arguments: Vec<RecipeArgument>,
}
