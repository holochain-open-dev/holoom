use game_identity_integrity::*;
use game_identity_types::WalletAttestation;
use hdk::prelude::*;

#[hdk_extern]
pub fn create_wallet_attestation(wallet_attestation: WalletAttestation) -> ExternResult<Record> {
    let wallet_attestation_hash =
        create_entry(&EntryTypes::WalletAttestation(wallet_attestation.clone()))?;
    create_link(
        wallet_attestation.agent.clone(),
        wallet_attestation_hash.clone(),
        LinkTypes::AgentToWalletAttestations,
        (),
    )?;
    let record = get(wallet_attestation_hash.clone(), GetOptions::default())?.ok_or(
        wasm_error!(WasmErrorInner::Guest(String::from(
            "Could not find the newly created WalletAttestation"
        ))),
    )?;
    Ok(record)
}

#[hdk_extern]
pub fn get_wallet_attestation(wallet_attestation_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(wallet_attestation_hash, GetOptions::default())
}

#[hdk_extern]
pub fn get_wallet_attestations_for_agent(agent: AgentPubKey) -> ExternResult<Vec<Record>> {
    get_links(agent, LinkTypes::AgentToWalletAttestations, None)?
        .into_iter()
        .map(|l| {
            let record = get(
                ActionHash::try_from(l.clone().target).unwrap(),
                GetOptions::default(),
            )?;
            record.ok_or_else(|| {
                wasm_error!(WasmErrorInner::Guest(
                    "Broken Wallet Attestation link".into()
                ))
            })
        })
        .collect::<ExternResult<Vec<_>>>()
}
