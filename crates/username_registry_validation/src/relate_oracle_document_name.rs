use hdi::prelude::*;

pub fn validate_create_link_relate_oracle_document_name(
    _action: CreateLink,
    _base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // TODO: maybe check tag looks like a valid address?
    // TODO: only authority?

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_relate_oracle_document_name(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    // TODO: only authority?

    Ok(ValidateCallbackResult::Valid)
}
