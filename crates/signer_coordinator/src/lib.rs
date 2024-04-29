use hdk::prelude::*;
use holoom_types::SignableBytes;

/// Sign secret message with agent key as transferable proof that user owns this account
#[hdk_extern]
pub fn sign_message(message: SignableBytes) -> ExternResult<Signature> {
    sign(agent_info()?.agent_initial_pubkey, message)
}
