use std::collections::HashMap;

use game_identity_rocket_state::holochain::HolochainClientState;
use game_identity_rocket_types::{endpoint::*, result::*, ApiError};
use game_identity_types::{ChainWalletSignature, UsernameAttestation, WalletAttestation};
use holo_hash::AgentPubKey;
use holochain_zome_types::Record;
use rocket::{get, serde::json::Json, State};
use rocket_okapi::openapi;

/// #
/// ## Get the list of agents who have registered usernames, alongside any wallet they have bound
///
/// * This method can only be called if the connected holochain client is the authority agent *
///
/// This method currently has no pagination and should be used sparingly.
#[openapi(tag = "username_registry")]
#[get("/username_registry")]
pub async fn bare(
    holochain_state: &State<HolochainClientState>,
) -> JsonResult<UsernameRegistryResponse> {
    let records: Vec<Record> = holochain_state
        .client
        .call_zome(
            "game_identity",
            "username_registry",
            "get_all_username_attestations",
            (),
        )
        .await?;
    let items = records
        .into_iter()
        .map(|record| {
            let username_attestation: UsernameAttestation = record
                .entry()
                .to_app_option()
                .map_err(|_| ApiError::Holochain {
                    message: "Failed to decode entry from response record".into(),
                })?
                .ok_or(ApiError::Holochain {
                    message: "Record entry data not present".into(),
                })?;
            let item = UsernameRegistryItem {
                agent_pubkey_b64: username_attestation.agent.to_string(),
                username: username_attestation.username,
            };
            Ok(item)
        })
        .collect::<Result<Vec<_>>>()?;

    Ok(Json(UsernameRegistryResponse {
        success: true,
        items,
    }))
}

/// #
/// ## Get the lists of EVM and Solana wallet public keys that have been bound to this address
///
#[openapi(tag = "username_registry")]
#[get("/username_registry/<agent_pubkey_b64>/wallets")]
pub async fn wallets(
    agent_pubkey_b64: String,
    holochain_state: &State<HolochainClientState>,
) -> JsonResult<UsernameRegistryWalletsResponse> {
    let agent_pubkey = AgentPubKey::try_from(agent_pubkey_b64.clone())
        .map_err(|_| ApiError::AgentPubKeyB64Invalid { agent_pubkey_b64 })?;
    let records: Vec<Record> = holochain_state
        .client
        .call_zome(
            "game_identity",
            "username_registry",
            "get_wallet_attestations_for_agent",
            agent_pubkey,
        )
        .await?;
    let wallet_attestations = records
        .into_iter()
        .map(|record| {
            let wallet_attestation: WalletAttestation = record
                .entry()
                .to_app_option()
                .map_err(|_| ApiError::Holochain {
                    message: "Failed to decode entry from response record".into(),
                })?
                .ok_or(ApiError::Holochain {
                    message: "Record entry data not present".into(),
                })?;
            Ok(wallet_attestation)
        })
        .collect::<Result<Vec<_>>>()?;
    let evm_addresses = wallet_attestations
        .iter()
        .filter_map(|wa| match wa.chain_wallet_signature {
            ChainWalletSignature::Evm { evm_address, .. } => Some(evm_address.to_string()),
            _ => None,
        })
        .collect();

    let solana_addresses = wallet_attestations
        .iter()
        .filter_map(|wa| match wa.chain_wallet_signature {
            ChainWalletSignature::Solana { solana_address, .. } => {
                Some(bs58::encode(solana_address.as_bytes()).into_string())
            }
            _ => None,
        })
        .collect();

    Ok(Json(UsernameRegistryWalletsResponse {
        success: true,
        evm_addresses,
        solana_addresses,
    }))
}

/// #
/// ## Get the metadata key-values set by a particular agent
///
#[openapi(tag = "username_registry")]
#[get("/username_registry/<agent_pubkey_b64>/metadata")]
pub async fn metadata(
    agent_pubkey_b64: String,
    holochain_state: &State<HolochainClientState>,
) -> JsonResult<UsernameRegistryMetadataResponse> {
    let agent_pubkey = AgentPubKey::try_from(agent_pubkey_b64.clone())
        .map_err(|_| ApiError::AgentPubKeyB64Invalid { agent_pubkey_b64 })?;
    let metadata: HashMap<String, String> = holochain_state
        .client
        .call_zome(
            "game_identity",
            "username_registry",
            "get_metadata",
            agent_pubkey,
        )
        .await?;

    Ok(Json(UsernameRegistryMetadataResponse {
        success: true,
        metadata,
    }))
}
