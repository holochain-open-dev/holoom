use hdk::prelude::*;
use holoom_types::{ChainWalletSignature, EvmAddress, SolanaAddress, WalletAttestation};
use username_registry_integrity::*;
use username_registry_validation::{evm_signing_message, solana_signing_message};

#[hdk_extern]
pub fn get_evm_wallet_binding_message(evm_address: EvmAddress) -> ExternResult<String> {
    let info = agent_info()?;
    let message = evm_signing_message(&evm_address, info.agent_initial_pubkey, info.chain_head.0);
    Ok(message)
}

#[hdk_extern]
pub fn get_solana_wallet_binding_message(solana_address: SolanaAddress) -> ExternResult<String> {
    let info = agent_info()?;
    let message = solana_signing_message(
        &solana_address,
        info.agent_initial_pubkey,
        info.chain_head.0,
    );
    Ok(message)
}

#[hdk_extern]
pub fn attest_wallet_signature(
    chain_wallet_signature: ChainWalletSignature,
) -> ExternResult<Record> {
    let wallet_attestation = WalletAttestation {
        agent: agent_info()?.agent_initial_pubkey,
        chain_wallet_signature,
        prev_action: agent_info()?.chain_head.0,
    };
    create_wallet_attestation(wallet_attestation)
}

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
    let record = get(wallet_attestation_hash.clone(), GetOptions::network())?.ok_or(
        wasm_error!(WasmErrorInner::Guest(String::from(
            "Could not find the newly created WalletAttestation"
        ))),
    )?;
    Ok(record)
}

#[hdk_extern]
pub fn get_wallet_attestation(wallet_attestation_hash: ActionHash) -> ExternResult<Option<Record>> {
    get(wallet_attestation_hash, GetOptions::network())
}

#[hdk_extern]
pub fn get_wallet_attestations_for_agent(agent: AgentPubKey) -> ExternResult<Vec<Record>> {
    get_links(GetLinksInputBuilder::try_new(agent, LinkTypes::AgentToWalletAttestations)?.build())?
        .into_iter()
        .map(|l| {
            let record = get(
                ActionHash::try_from(l.clone().target).unwrap(),
                GetOptions::network(),
            )?;
            record.ok_or_else(|| {
                wasm_error!(WasmErrorInner::Guest(
                    "Broken Wallet Attestation link".into()
                ))
            })
        })
        .collect::<ExternResult<Vec<_>>>()
}
