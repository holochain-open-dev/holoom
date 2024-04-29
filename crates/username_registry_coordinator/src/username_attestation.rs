use holoom_types::{get_authority_agent, SignedUsername, UsernameAttestation};
use hdk::prelude::*;
use username_registry_integrity::*;

#[hdk_extern]
pub fn create_username_attestation(
    username_attestation: UsernameAttestation,
) -> ExternResult<Record> {
    let username_attestation_hash = create_entry(&EntryTypes::UsernameAttestation(
        username_attestation.clone(),
    ))?;
    create_link(
        username_attestation.agent.clone(),
        username_attestation_hash.clone(),
        LinkTypes::AgentToUsernameAttestations,
        (),
    )?;
    let record = get(username_attestation_hash.clone(), GetOptions::default())?.ok_or(
        wasm_error!(WasmErrorInner::Guest(String::from(
            "Could not find the newly created UsernameAttestation"
        ))),
    )?;
    Ok(record)
}
#[hdk_extern]
pub fn get_username_attestation(
    username_attestation_hash: ActionHash,
) -> ExternResult<Option<Record>> {
    get(username_attestation_hash, GetOptions::default())
}
#[hdk_extern]
pub fn delete_username_attestation(
    original_username_attestation_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_username_attestation_hash)
}
#[hdk_extern]
pub fn get_username_attestation_for_agent(agent: AgentPubKey) -> ExternResult<Option<Record>> {
    let links = get_links(agent, LinkTypes::AgentToUsernameAttestations, None)?;

    match links.first() {
        Some(l) => get(
            ActionHash::try_from(l.clone().target).unwrap(),
            GetOptions::default(),
        ),
        None => Ok(None),
    }
}

#[hdk_extern]
pub fn does_agent_have_username(agent: AgentPubKey) -> ExternResult<bool> {
    let count = count_links(LinkQuery::new(
        agent,
        LinkTypes::AgentToUsernameAttestations.try_into_filter()?,
    ))?;

    Ok(count > 0)
}

#[hdk_extern]
pub fn get_all_username_attestations(_: ()) -> ExternResult<Vec<Record>> {
    let my_pubkey = agent_info()?.agent_initial_pubkey;
    if my_pubkey != get_authority_agent()? {
        return Err(wasm_error!(WasmErrorInner::Host(
            "Only callable by authority agent".into()
        )));
    }
    let username_attestation_type: EntryType = UnitEntryTypes::UsernameAttestation.try_into()?;
    let filter = ChainQueryFilter::new()
        .include_entries(true)
        .entry_type(username_attestation_type);
    query(filter)
}

/// Called by the user who wishes to register a username. Returns a UsernameAttestation Record.
#[hdk_extern]
pub fn sign_username_to_attest(username: String) -> ExternResult<Record> {
    // TODO: devise scheme akin to signing a nonce
    let my_pubkey = agent_info()?.agent_initial_pubkey;
    let signature = sign(my_pubkey.clone(), &username)?;
    let payload = SignedUsername {
        username,
        signature,
        signer: my_pubkey,
    };

    let authority_agent = get_authority_agent()?;

    let zome_name = zome_info()?.name;
    let fn_name = FunctionName::from("ingest_signed_username");
    let resp = call_remote(authority_agent, zome_name, fn_name, None, payload)?;
    match resp {
        ZomeCallResponse::Ok(result) => result.decode().map_err(|err| wasm_error!(err)),
        ZomeCallResponse::NetworkError(err) => Err(wasm_error!(WasmErrorInner::Guest(format!(
            "There was a network error: {:?}",
            err
        )))),
        ZomeCallResponse::Unauthorized(..) => {
            Err(wasm_error!(WasmErrorInner::Guest("Unauthorized".into())))
        }
        ZomeCallResponse::CountersigningSession(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Unexpected countersigning session".into()
        ))),
    }
}

/// Remotely invoked on the authority agent. Returns a UsernameAttestation Record.
#[hdk_extern]
pub fn ingest_signed_username(signed_username: SignedUsername) -> ExternResult<Record> {
    let is_valid = verify_signature(
        signed_username.signer.clone(),
        signed_username.signature,
        signed_username.username.clone(),
    )?;
    if !is_valid {
        return Err(wasm_error!(WasmErrorInner::Host(
            "Invalid username signature".into()
        )));
    }
    let username_attestation = UsernameAttestation {
        username: signed_username.username,
        agent: signed_username.signer,
    };
    create_username_attestation(username_attestation)
}
