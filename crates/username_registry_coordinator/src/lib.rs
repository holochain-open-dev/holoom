pub mod username_attestation;
pub mod wallet_attestation;
use game_identity_types::get_authority_agent;
use hdk::prelude::*;

#[hdk_extern]
pub fn init(_: ()) -> ExternResult<InitCallbackResult> {
    let authority_agent = get_authority_agent()?;
    let my_pubkey = agent_info()?.agent_initial_pubkey;
    if my_pubkey == authority_agent {
        let mut functions = BTreeSet::new();
        functions.insert((zome_info()?.name, "ingest_signed_username".into()));
        create_cap_grant(CapGrantEntry {
            tag: "".into(),
            access: ().into(),
            functions: GrantedFunctions::Listed(functions),
        })?;
    }

    Ok(InitCallbackResult::Pass)
}
