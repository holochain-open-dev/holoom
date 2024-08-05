use hdi::prelude::*;
use holoom_types::evm_signing_offer::SignedEvmSigningOffer;
use username_registry_utils::{deserialize_record_entry, hash_evm_address};

pub fn validate_create_link_evm_address_to_signing_offer(
    action: CreateLink,
    base_address: AnyLinkableHash,
    target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    let Ok(target_address) = ActionHash::try_from(target_address) else {
        return Ok(ValidateCallbackResult::Invalid(
            "target_address must be an ActionHash".into(),
        ));
    };
    let record = must_get_valid_record(target_address)?;
    if &action.author != record.action().author() {
        return Ok(ValidateCallbackResult::Invalid(
            "link and target must have same author".into(),
        ));
    }

    let Ok(signed_offer) = deserialize_record_entry::<SignedEvmSigningOffer>(record) else {
        return Ok(ValidateCallbackResult::Invalid(
            "target_address must be a SignedEvmSigningOffer".into(),
        ));
    };

    if base_address != hash_evm_address(signed_offer.signer)?.into() {
        return Ok(ValidateCallbackResult::Invalid(
            "base_address must be hash of evm signer".into(),
        ));
    }

    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_delete_link_evm_address_to_signing_offer(
    _action: DeleteLink,
    _original_action: CreateLink,
    _base_address: AnyLinkableHash,
    _target_address: AnyLinkableHash,
    _tag: LinkTag,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Invalid(
        "Cannot delete EvmAddressToSigningOffer links".into(),
    ))
}
