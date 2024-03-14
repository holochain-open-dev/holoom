pub mod username_attestation;
pub mod wallet_attestation;
use hdk::prelude::*;

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    Ok(InitCallbackResult::Pass)
}
