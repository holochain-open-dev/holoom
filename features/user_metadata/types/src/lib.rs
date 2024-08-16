use hdi::{link::LinkTypeFilterExt, prelude::ScopedLinkType};
use serde::{Deserialize, Serialize};
use typeshare::typeshare;

/// A key-value pair, representing an item of a user's metadata
#[typeshare]
#[derive(Serialize, Deserialize, Debug)]
pub struct MetadataItem {
    pub name: String,
    pub value: String,
}

/// A helper trait that allows the coordinator zome to inject the corresponding integrity zome's
/// relevant `LinkTypes` information into this crate, avoid a circular dependency.
pub trait InjectMetadataLinkTypes {
    type LinkType: LinkTypeFilterExt + TryInto<ScopedLinkType>;
    fn agent_metadata() -> Self::LinkType;
}
