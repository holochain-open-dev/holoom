use hdi::prelude::*;
use holoom_types::evm_signing_offer::EvmSigningOffer;

pub fn validate_create_evm_signing_offer(
    _action: EntryCreationAction,
    _evm_signing_offer: EvmSigningOffer,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
