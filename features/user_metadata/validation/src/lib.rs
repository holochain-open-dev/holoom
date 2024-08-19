use hdi::prelude::*;
use serde::{Deserialize, Serialize};
use typeshare::typeshare;
use user_metadata_types::MetadataItem;

/// Reasons for which a create `AgentMetadata` link action can fail validation.
#[derive(Serialize, Deserialize)]
#[typeshare]
pub enum CreateAgentMetadataLinkRejectionReason {
    /// The base address is the agent pubkey of the user who is being annotated with metadata.
    /// As a user can only author their own metadata, the base address has match their own pubkey.
    BaseAddressMustBeOwner,

    /// The link tag content doesn't match the expected key-value schema struct `MetadataItem`.
    BadTagSerialization,
}

/// Gathers any reasons for rejecting a create `AgentMetadata` link action
pub fn validate_create_link_user_metadata(
    action: CreateLink,
    base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    tag: LinkTag,
) -> ExternResult<Vec<CreateAgentMetadataLinkRejectionReason>> {
    use CreateAgentMetadataLinkRejectionReason::*;
    let mut rejection_reasons = Vec::new();

    if AnyLinkableHash::from(action.author) != base_address {
        rejection_reasons.push(BaseAddressMustBeOwner {});
    }

    // The contents of the target_address is unused and irrelevant

    // Check the tag is valid
    if bincode::deserialize::<MetadataItem>(&tag.into_inner()).is_err() {
        rejection_reasons.push(BadTagSerialization)
    }

    Ok(rejection_reasons)
}

/// Reasons for which a delete `AgentMetadata` link action can fail validation.
#[derive(Serialize)]
#[typeshare]
pub enum DeleteAgentMetadataLinkRejectionReason {
    /// The user attempting to delete the metadata item is not the owner and therefore doesn't
    /// have permission.
    DeleterIsNotOwner,
}

/// Gathers any reasons for rejecting a delete `AgentMetadata`` link action
pub fn validate_delete_link_user_metadata(
    action: DeleteLink,
    _original_action: CreateLink,
    base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<Vec<DeleteAgentMetadataLinkRejectionReason>> {
    use DeleteAgentMetadataLinkRejectionReason::*;
    let mut rejection_reasons = Vec::new();

    if AnyLinkableHash::from(action.author) != base_address {
        rejection_reasons.push(DeleterIsNotOwner)
    }

    Ok(rejection_reasons)
}
