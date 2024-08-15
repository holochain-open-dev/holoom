use hdk::prelude::*;
use user_metadata_types::{InjectMetadataLinkTypes, MetadataItem};

pub fn handler<LT>(agent_pubkey: AgentPubKey, name: String) -> ExternResult<Option<String>>
where
    LT: InjectMetadataLinkTypes,
{
    let links =
        get_links(GetLinksInputBuilder::try_new(agent_pubkey, LT::agent_metadata())?.build())?;
    for link in links {
        let item: MetadataItem = bincode::deserialize(&link.tag.into_inner()).map_err(|_| {
            wasm_error!(WasmErrorInner::Guest(
                "Failed to deserialize MetadataItem".into()
            ))
        })?;
        if name == item.name {
            return Ok(Some(item.value));
        }
    }
    Ok(None)
}
