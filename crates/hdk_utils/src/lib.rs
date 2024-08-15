use hdk::prelude::*;

pub fn create_link(
    base_address: impl Into<AnyLinkableHash>,
    target_address: impl Into<AnyLinkableHash>,
    link_type: impl TryInto<ScopedLinkType>,
    tag: impl Into<LinkTag>,
) -> ExternResult<ActionHash> {
    let ScopedLinkType {
        zome_index,
        zome_type: link_type,
    } = link_type
        .try_into()
        .map_err(|_| wasm_error!("Isn't valid link type for this zome".to_string()))?;
    HDK.with(|h| {
        h.borrow().create_link(CreateLinkInput::new(
            base_address.into(),
            target_address.into(),
            zome_index,
            link_type,
            tag.into(),
            ChainTopOrdering::default(),
        ))
    })
}
