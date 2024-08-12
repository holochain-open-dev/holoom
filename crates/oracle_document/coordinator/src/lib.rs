pub mod oracle_document;
use hdk::prelude::*;
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
            "get_latest_oracle_document_ah_for_name".into(),
        ));
        functions.insert((
            zome_name.clone(),
            "get_latest_oracle_document_for_name".into(),
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
fn get_authority(_: ()) -> ExternResult<AgentPubKey> {
    get_authority_agent()
}
