use hdk::prelude::*;
use metadata_types::{InjectMetadataLinkTypes, MetadataItem};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct Input {
    #[ts(type = "AgentPubKey")]
    pub agent_pubkey: AgentPubKey,
    pub name: String,
}

pub fn handler<LT>(input: Input) -> ExternResult<Option<String>>
where
    LT: InjectMetadataLinkTypes,
{
    let links = get_links(
        GetLinksInputBuilder::try_new(input.agent_pubkey, LT::agent_metadata())?.build(),
    )?;
    for link in links {
        let item: MetadataItem = bincode::deserialize(&link.tag.into_inner()).map_err(|_| {
            wasm_error!(WasmErrorInner::Guest(
                "Failed to deserialize MetadataItem".into()
            ))
        })?;
        if input.name == item.name {
            return Ok(Some(item.value));
        }
    }
    Ok(None)
}
