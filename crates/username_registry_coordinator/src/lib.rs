pub mod evm_signing_offer;
pub mod external_id_attestation;
pub mod oracle_document;
pub mod recipe;
pub mod recipe_execution;
pub mod user_metadata;
pub mod username_attestation;
pub mod wallet_attestation;
use hdk::prelude::*;
use holoom_types::{LocalHoloomSignal, RemoteHoloomSignal};

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let mut functions = BTreeSet::new();
    let zome_name = zome_info()?.name;
    functions.insert((zome_name, "recv_remote_signal".into()));
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        access: ().into(),
        functions: GrantedFunctions::Listed(functions),
    })?;

    Ok(InitCallbackResult::Pass)
}

#[hdk_extern]
fn recv_remote_signal(signal_io: ExternIO) -> ExternResult<()> {
    let remote_holoom_signal: RemoteHoloomSignal = signal_io
        .decode()
        .map_err(|e| wasm_error!(WasmErrorInner::Serialize(e)))?;

    match remote_holoom_signal {
        RemoteHoloomSignal::ExternalIdAttested { request_id, record } => {
            emit_signal(LocalHoloomSignal::ExternalIdAttested { request_id, record })?
        }
        RemoteHoloomSignal::ExternalIdRejected { request_id, reason } => {
            emit_signal(LocalHoloomSignal::ExternalIdRejected { request_id, reason })?
        }
        RemoteHoloomSignal::EvmSignatureProvided {
            request_id,
            signed_u256_array,
        } => emit_signal(LocalHoloomSignal::EvmSignatureProvided {
            request_id,
            signed_u256_array,
        })?,
        RemoteHoloomSignal::EvmSignatureRequestRejected { request_id, reason } => {
            emit_signal(LocalHoloomSignal::EvmSignatureRequestRejected { request_id, reason })?
        }
    }

    Ok(())
}
