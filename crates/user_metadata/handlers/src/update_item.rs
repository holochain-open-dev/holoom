use hdk::prelude::*;
use user_metadata_types::{InjectMetadataLinkTypes, MetadataItem};

pub fn handler<LT>(item: MetadataItem) -> ExternResult<()>
where
    LT: InjectMetadataLinkTypes,
{
    let agent_pubkey = agent_info()?.agent_initial_pubkey;
    let links = get_links(
        GetLinksInputBuilder::try_new(agent_pubkey.clone(), LT::agent_metadata())?.build(),
    )?;
    for link in links {
        let existing_item: MetadataItem =
            bincode::deserialize(&link.tag.into_inner()).map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "Failed to deserialize MetadataItem".into()
                ))
            })?;
        if existing_item.name == item.name {
            // Remove old MetadataItem
            delete_link(link.create_link_hash)?;
        }
    }
    let tag_bytes = bincode::serialize(&item).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Failed to serialize MetadataItem".into()
        ))
    })?;
    hdk_utils::create_link(
        agent_pubkey.clone(),
        agent_pubkey, // unused and irrelevant
        LT::agent_metadata(),
        LinkTag(tag_bytes),
    )?;
    Ok(())
}
