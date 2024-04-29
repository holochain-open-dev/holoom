use hdi::prelude::*;
use holoom_types::MetadataItem;

pub fn validate_create_link_user_metadata(
    action: CreateLink,
    base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let agent_pubkey = AgentPubKey::try_from(base_address).map_err(|e| wasm_error!(e))?;

    if action.author != agent_pubkey {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the owner can embed metadata in their link tags".into(),
        ));
    }
    // The contents of the target_address is unused and irrelevant

    // Check the tag is valid
    let _item: MetadataItem = bincode::deserialize(&tag.into_inner()).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Failed to deserialize MetadataItem".into()
        ))
    })?;

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_user_metadata(
    action: DeleteLink,
    _original_action: CreateLink,
    base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let agent_pubkey = AgentPubKey::try_from(base_address).map_err(|e| wasm_error!(e))?;

    if action.author != agent_pubkey {
        return Ok(ValidateCallbackResult::Invalid(
            "Only the owner can delete their metadata tags".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
