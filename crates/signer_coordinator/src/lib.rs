use game_identity_types::SignableBytes;
use hdk::prelude::*;

/// Sign secret message with agent key as transferable proof that user owns this account
#[hdk_extern]
pub fn sign_message(message: SignableBytes) -> ExternResult<Signature> {
    sign(agent_info()?.agent_initial_pubkey, message)
}
