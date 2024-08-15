use std::collections::HashMap;

use hdk::prelude::*;
use metadata_types::{InjectMetadataLinkTypes, MetadataItem};

pub fn handler<LT>(agent_pubkey: AgentPubKey) -> ExternResult<HashMap<String, String>>
where
    LT: InjectMetadataLinkTypes,
{
    let links =
        get_links(GetLinksInputBuilder::try_new(agent_pubkey, LT::agent_metadata())?.build())?;
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
