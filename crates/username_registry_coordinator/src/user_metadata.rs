use std::collections::HashMap;
use typeshare::typeshare;

use hdk::prelude::*;
use user_metadata_types::MetadataItem;
use username_registry_integrity::LinkTypes;

/// Upsert a key-value item of your own metadata
#[hdk_extern]
pub fn update_metadata_item(item: MetadataItem) -> ExternResult<()> {
    user_metadata_handlers::update_item::handler::<LinkTypes>(item)
}

/// The input argument to `get_metadata_item_value``
#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
pub struct GetMetadataItemValueInput {
    /// The agent whose metadata you wish to query
    pub agent_pubkey: AgentPubKey,
    /// the key for the particular metadata item
    pub name: String,
}

/// Retrieve a particular metadata value for a given key on an agent.
///
/// Return `None` if the key-pair isn't found, which means the user hasn't set it, or the
/// information hasn't been gossiped.
#[hdk_extern]
pub fn get_metadata_item_value(input: GetMetadataItemValueInput) -> ExternResult<Option<String>> {
    user_metadata_handlers::get_item::handler::<LinkTypes>(input.agent_pubkey, input.name)
}

/// Retrieves all metadata known for the specified user as key-value map
#[hdk_extern]
pub fn get_metadata(agent_pubkey: AgentPubKey) -> ExternResult<HashMap<String, String>> {
    user_metadata_handlers::get_all::handler::<LinkTypes>(agent_pubkey)
}
