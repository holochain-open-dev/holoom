use core::str;

use hdi::prelude::*;

pub fn validate_create_link_publisher(
    action: CreateLink,
    _base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    if AnyLinkableHash::from(action.author) != target_address {
        return Ok(ValidateCallbackResult::Invalid(
            "Target of publisher link must author".to_string(),
        ));
    }

    if str::from_utf8(&tag.into_inner()).is_err() {
        return Ok(ValidateCallbackResult::Invalid(
            "Tag must be a valid utf-8 string".to_string(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_publisher(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base: AnyLinkableHash,
    _target: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(String::from(
        "Publisher links cannot be deleted",
    )))
}
