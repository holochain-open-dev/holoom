use std::collections::HashMap;

use game_identity_types::{GetMetadataItemValuePayload, MetadataItem, UpdateMetadataItemPayload};
use hdk::prelude::*;
use username_registry_integrity::*;

#[hdk_extern]
pub fn update_metadata_item(payload: UpdateMetadataItemPayload) -> ExternResult<()> {
    let links = get_links(payload.agent_pubkey.clone(), LinkTypes::AgentMetadata, None)?;
    for link in links {
        let existing_item: MetadataItem =
            bincode::deserialize(&link.tag.into_inner()).map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to deserialize MetadataItem".into()
                ))
            })?;
        if existing_item.name == payload.name {
            // Remove old MetadataItem
            delete_link(link.create_link_hash)?;
        }
    }
    let item = MetadataItem {
        name: payload.name,
        value: payload.value,
    };
    let tag_bytes = bincode::serialize(&item).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Failed to serialize MetadataItem".into()
        ))
    })?;
    create_link(
        payload.agent_pubkey.clone(),
        payload.agent_pubkey, // unused and irrelevant
        LinkTypes::AgentMetadata,
        LinkTag(tag_bytes),
    )?;
    Ok(())
}

#[hdk_extern]
pub fn get_metadata_item_value(
    payload: GetMetadataItemValuePayload,
) -> ExternResult<Option<String>> {
    let links = get_links(payload.agent_pubkey, LinkTypes::AgentMetadata, None)?;
    for link in links {
        let item: MetadataItem = bincode::deserialize(&link.tag.into_inner()).map_err(|_| {
            wasm_error!(WasmErrorInner::Guest(
                "Failed to deserialize MetadataItem".into()
            ))
        })?;
        if payload.name == item.name {
            return Ok(Some(item.value));
        }
    }
    Ok(None)
}

#[hdk_extern]
pub fn get_metadata(agent_pubkey: AgentPubKey) -> ExternResult<HashMap<String, String>> {
    let links = get_links(agent_pubkey, LinkTypes::AgentMetadata, None)?;
    let mut out = HashMap::default();
    for link in links {
        let item: MetadataItem = bincode::deserialize(&link.tag.into_inner()).map_err(|_| {
            wasm_error!(WasmErrorInner::Guest(
                "Failed to deserialize MetadataItem".into()
            ))
        })?;
        out.insert(item.name, item.value);
    }
    Ok(out)
}
