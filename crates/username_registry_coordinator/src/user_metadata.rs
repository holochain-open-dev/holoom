use std::collections::HashMap;

use hdk::prelude::*;
use username_registry_integrity::LinkTypes;

#[hdk_extern]
pub fn update_metadata_item(item: metadata_types::MetadataItem) -> ExternResult<()> {
    user_metadata_handlers::update_item::handler::<LinkTypes>(item)
}

#[hdk_extern]
pub fn get_metadata_item_value(
    input: user_metadata_handlers::get_item::Input,
) -> ExternResult<Option<String>> {
    user_metadata_handlers::get_item::handler::<LinkTypes>(input)
}

#[hdk_extern]
pub fn get_metadata(agent_pubkey: AgentPubKey) -> ExternResult<HashMap<String, String>> {
    user_metadata_handlers::get_all::handler::<LinkTypes>(agent_pubkey)
}
