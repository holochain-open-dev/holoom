use hdi::{link::LinkTypeFilterExt, prelude::ScopedLinkType};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, Debug, TS)]
#[ts(export)]
pub struct MetadataItem {
    pub name: String,
    pub value: String,
}

pub trait InjectMetadataLinkTypes {
    type LinkType: LinkTypeFilterExt + TryInto<ScopedLinkType>;
    fn agent_metadata() -> Self::LinkType;
}
