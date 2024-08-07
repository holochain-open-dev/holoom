use hdi::prelude::*;
use holoom_types::DocumentRelationTag;
use username_registry_utils::hash_identifier;

pub fn validate_create_link_relate_oracle_document_name(
    _action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let Ok(document_relation) = ExternIO(tag.into_inner()).decode::<DocumentRelationTag>() else {
        return Ok(ValidateCallbackResult::Invalid(
            "Tag must be a DocumentRelationTag".into(),
        ));
    };
    if base_address != hash_identifier(document_relation.relation)?.into() {
        return Ok(ValidateCallbackResult::Invalid(
            "Base address must be the hash of the document relation".into(),
        ));
    }
    if target_address != hash_identifier(document_relation.name)?.into() {
        return Ok(ValidateCallbackResult::Invalid(
            "Target address must be the hash of the target document name".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_relate_oracle_document_name(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(
        "Cannot delete oracle document relation links".into(),
    ))
}
