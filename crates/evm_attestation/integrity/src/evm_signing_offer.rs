use hdi::prelude::*;
use holoom_types::{
    evm_signing_offer::{EvmU256Item, SignedEvmSigningOffer},
    recipe::Recipe,
};
use shared_utils::deserialize_record_entry;

pub fn validate_create_signed_evm_signing_offer(
    _action: EntryCreationAction,
    signed_evm_signing_offer: SignedEvmSigningOffer,
) -> ExternResult<ValidateCallbackResult> {
    let recipe_record = must_get_valid_record(signed_evm_signing_offer.offer.recipe_ah.clone())?;
    if deserialize_record_entry::<Recipe>(recipe_record).is_err() {
        // This check seems brittle. See https://github.com/holochain-open-dev/holoom/issues/69
        return Ok(ValidateCallbackResult::Invalid(
            "recipe_ah doesn't point to a Recipe".into(),
        ));
    }

    // Ensure a stable byte order
    #[derive(Serialize, Debug)]
    struct OrderedSigningOffer(ActionHash, Vec<EvmU256Item>);
    let ordered_offer = OrderedSigningOffer(
        signed_evm_signing_offer.offer.recipe_ah,
        signed_evm_signing_offer.offer.u256_items,
    );

    let message = ExternIO::encode(ordered_offer)
        .expect("EvmSigningOffer implements Serialize")
        .into_vec();

    match signed_evm_signing_offer
        .signature
        .recover_address_from_msg(&message)
    {
        Ok(recovered_address) => {
            if recovered_address == signed_evm_signing_offer.signer {
                Ok(ValidateCallbackResult::Valid)
            } else {
                Ok(ValidateCallbackResult::Invalid(format!(
                    "Expected to recover {} from signature, but instead recovered {}",
                    signed_evm_signing_offer.signer.to_checksum(None),
                    recovered_address.to_checksum(None)
                )))
            }
        }
        Err(_) => Ok(ValidateCallbackResult::Invalid(
            "Invalid signature over wallet binding message".into(),
        )),
    }
}
