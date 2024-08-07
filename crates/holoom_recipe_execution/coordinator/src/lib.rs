pub mod holoom_recipe_execution;
use hdk::prelude::*;
use holoom_types::{LocalHoloomSignal, RemoteHoloomSignal};
use shared_utils::get_authority_agent;

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let authority_agent = get_authority_agent()?;
    let my_pubkey = agent_info()?.agent_initial_pubkey;
    let mut functions = BTreeSet::new();
    let zome_name = zome_info()?.name;
    if my_pubkey == authority_agent {
        functions.insert((
            zome_name.clone(),
            "ingest_evm_signature_over_recipe_execution_request".into(),
        ));
    }
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
        _=> ()
    }
    Ok(())
}

#[hdk_extern]
fn get_authority(_: ()) -> ExternResult<AgentPubKey> {
    get_authority_agent()
}
