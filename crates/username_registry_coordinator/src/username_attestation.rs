use game_identity_types::UsernameAttestation;
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
