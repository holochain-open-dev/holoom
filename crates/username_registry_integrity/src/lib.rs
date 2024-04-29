use hdi::prelude::*;
use holoom_types::{UsernameAttestation, WalletAttestation};
use username_registry_validation::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    UsernameAttestation(UsernameAttestation),
    WalletAttestation(WalletAttestation),
}
#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    AgentToUsernameAttestations,
    AgentMetadata,
    AgentToWalletAttestations,
}
#[hdk_extern]
pub fn genesis_self_check(_data: GenesisSelfCheckData) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
pub fn validate_agent_joining(
    _agent_pub_key: AgentPubKey,
    _membrane_proof: &Option<MembraneProof>,
) -> ExternResult<ValidateCallbackResult> {
    Ok(ValidateCallbackResult::Valid)
}
#[hdk_extern]
pub fn validate(op: Op) -> ExternResult<ValidateCallbackResult> {
    match op.flattened::<EntryTypes, LinkTypes>()? {
        FlatOp::StoreEntry(store_entry) => match store_entry {
            OpEntry::CreateEntry { app_entry, action } => match app_entry {
                EntryTypes::UsernameAttestation(username_attestation) => {
                    validate_create_username_attestation(
                        EntryCreationAction::Create(action),
                        username_attestation,
                    )
                }
                EntryTypes::WalletAttestation(wallet_attestation) => {
                    validate_create_wallet_attestation(
                        EntryCreationAction::Create(action),
                        wallet_attestation,
                    )
                }
            },
            OpEntry::UpdateEntry {
                app_entry, action, ..
            } => match app_entry {
                EntryTypes::UsernameAttestation(username_attestation) => {
                    validate_create_username_attestation(
                        EntryCreationAction::Update(action),
                        username_attestation,
                    )
                }
                EntryTypes::WalletAttestation(wallet_attestation) => {
                    validate_create_wallet_attestation(
                        EntryCreationAction::Update(action),
                        wallet_attestation,
                    )
                }
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterUpdate(update_entry) => match update_entry {
            OpUpdate::Entry {
                original_action,
                original_app_entry,
                app_entry,
                action,
            } => match (app_entry, original_app_entry) {
                (
                    EntryTypes::UsernameAttestation(username_attestation),
                    EntryTypes::UsernameAttestation(original_username_attestation),
                ) => validate_update_username_attestation(
                    action,
                    username_attestation,
                    original_action,
                    original_username_attestation,
                ),
                (
                    EntryTypes::WalletAttestation(wallet_attestation),
                    EntryTypes::WalletAttestation(original_wallet_attestation),
                ) => validate_update_wallet_attestation(
                    action,
                    wallet_attestation,
                    original_action,
                    original_wallet_attestation,
                ),
                _ => Ok(ValidateCallbackResult::Invalid(
                    "Updated and original types must match".into(),
                )),
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterDelete(delete_entry) => match delete_entry {
            OpDelete::Entry {
                original_action,
                original_app_entry,
                action,
            } => match original_app_entry {
                EntryTypes::UsernameAttestation(username_attestation) => {
                    validate_delete_username_attestation(
                        action,
                        original_action,
                        username_attestation,
                    )
                }
                EntryTypes::WalletAttestation(wallet_attestation) => {
                    validate_delete_wallet_attestation(action, original_action, wallet_attestation)
                }
            },
            _ => Ok(ValidateCallbackResult::Valid),
        },
        FlatOp::RegisterCreateLink {
            link_type,
            base_address,
            target_address,
            tag,
            action,
        } => match link_type {
            LinkTypes::AgentToUsernameAttestations => {
                validate_create_link_agent_to_username_attestations(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::AgentMetadata => {
                validate_create_link_user_metadata(action, base_address, target_address, tag)
            }
            LinkTypes::AgentToWalletAttestations => {
                validate_create_link_agent_to_wallet_attestations(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
        },
        FlatOp::RegisterDeleteLink {
            link_type,
            base_address,
            target_address,
            tag,
            original_action,
            action,
        } => match link_type {
            LinkTypes::AgentToUsernameAttestations => {
                validate_delete_link_agent_to_username_attestations(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::AgentMetadata => validate_delete_link_user_metadata(
                action,
                original_action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::AgentToWalletAttestations => {
                validate_delete_link_agent_to_wallet_attestations(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
        },
        FlatOp::StoreRecord(store_record) => {
            match store_record {
                OpRecord::CreateEntry { app_entry, action } => match app_entry {
                    EntryTypes::UsernameAttestation(username_attestation) => {
                        validate_create_username_attestation(
                            EntryCreationAction::Create(action),
                            username_attestation,
                        )
                    }
                    EntryTypes::WalletAttestation(wallet_attestation) => {
                        validate_create_wallet_attestation(
                            EntryCreationAction::Create(action),
                            wallet_attestation,
                        )
                    }
                },
                OpRecord::UpdateEntry {
                    original_action_hash,
                    app_entry,
                    action,
                    ..
                } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(ValidateCallbackResult::Invalid(
                                "Original action for an update must be a Create or Update action"
                                    .to_string(),
                            ));
                        }
                    };
                    match app_entry {
                        EntryTypes::UsernameAttestation(username_attestation) => {
                            let result = validate_create_username_attestation(
                                EntryCreationAction::Update(action.clone()),
                                username_attestation.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_username_attestation: Option<UsernameAttestation> =
                                    original_record
                                        .entry()
                                        .to_app_option()
                                        .map_err(|e| wasm_error!(e))?;
                                let original_username_attestation =
                                    match original_username_attestation {
                                        Some(username_attestation) => username_attestation,
                                        None => {
                                            return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                        }
                                    };
                                validate_update_username_attestation(
                                    action,
                                    username_attestation,
                                    original_action,
                                    original_username_attestation,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                        EntryTypes::WalletAttestation(wallet_attestation) => {
                            let result = validate_create_wallet_attestation(
                                EntryCreationAction::Update(action.clone()),
                                wallet_attestation.clone(),
                            )?;
                            if let ValidateCallbackResult::Valid = result {
                                let original_wallet_attestation: Option<WalletAttestation> =
                                    original_record
                                        .entry()
                                        .to_app_option()
                                        .map_err(|e| wasm_error!(e))?;
                                let original_wallet_attestation = match original_wallet_attestation
                                {
                                    Some(wallet_attestation) => wallet_attestation,
                                    None => {
                                        return Ok(
                                            ValidateCallbackResult::Invalid(
                                                "The updated entry type must be the same as the original entry type"
                                                    .to_string(),
                                            ),
                                        );
                                    }
                                };
                                validate_update_wallet_attestation(
                                    action,
                                    wallet_attestation,
                                    original_action,
                                    original_wallet_attestation,
                                )
                            } else {
                                Ok(result)
                            }
                        }
                    }
                }
                OpRecord::DeleteEntry {
                    original_action_hash,
                    action,
                    ..
                } => {
                    let original_record = must_get_valid_record(original_action_hash)?;
                    let original_action = original_record.action().clone();
                    let original_action = match original_action {
                        Action::Create(create) => EntryCreationAction::Create(create),
                        Action::Update(update) => EntryCreationAction::Update(update),
                        _ => {
                            return Ok(ValidateCallbackResult::Invalid(
                                "Original action for a delete must be a Create or Update action"
                                    .to_string(),
                            ));
                        }
                    };
                    let app_entry_type = match original_action.entry_type() {
                        EntryType::App(app_entry_type) => app_entry_type,
                        _ => {
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    let entry = match original_record.entry().as_option() {
                        Some(entry) => entry,
                        None => {
                            if original_action.entry_type().visibility().is_public() {
                                return Ok(
                                    ValidateCallbackResult::Invalid(
                                        "Original record for a delete of a public entry must contain an entry"
                                            .to_string(),
                                    ),
                                );
                            } else {
                                return Ok(ValidateCallbackResult::Valid);
                            }
                        }
                    };
                    let original_app_entry = match EntryTypes::deserialize_from_type(
                        app_entry_type.zome_index,
                        app_entry_type.entry_index,
                        entry,
                    )? {
                        Some(app_entry) => app_entry,
                        None => {
                            // @todo This must be treated as valid due to holochain bug
                            //   see https://github.com/holochain/holochain/issues/2868
                            return Ok(ValidateCallbackResult::Valid);
                            // ValidateCallbackResult::Invalid(
                            //     "Original app entry must be one of the defined entry types for this zome"
                            //         .to_string(),
                            // )
                        }
                    };
                    match original_app_entry {
                        EntryTypes::UsernameAttestation(original_username_attestation) => {
                            validate_delete_username_attestation(
                                action,
                                original_action,
                                original_username_attestation,
                            )
                        }
                        EntryTypes::WalletAttestation(original_wallet_attestation) => {
                            validate_delete_wallet_attestation(
                                action,
                                original_action,
                                original_wallet_attestation,
                            )
                        }
                    }
                }
                OpRecord::CreateLink {
                    base_address,
                    target_address,
                    tag,
                    link_type,
                    action,
                } => match link_type {
                    LinkTypes::AgentToUsernameAttestations => {
                        validate_create_link_agent_to_username_attestations(
                            action,
                            base_address,
                            target_address,
                            tag,
                        )
                    }
                    LinkTypes::AgentMetadata => validate_create_link_user_metadata(
                        action,
                        base_address,
                        target_address,
                        tag,
                    ),
                    LinkTypes::AgentToWalletAttestations => {
                        validate_create_link_agent_to_wallet_attestations(
                            action,
                            base_address,
                            target_address,
                            tag,
                        )
                    }
                },
                OpRecord::DeleteLink {
                    original_action_hash,
                    base_address,
                    action,
                } => {
                    let record = must_get_valid_record(original_action_hash)?;
                    let create_link = match record.action() {
                        Action::CreateLink(create_link) => create_link.clone(),
                        _ => {
                            return Ok(ValidateCallbackResult::Invalid(
                                "The action that a DeleteLink deletes must be a CreateLink"
                                    .to_string(),
                            ));
                        }
                    };
                    let link_type = match LinkTypes::from_type(
                        create_link.zome_index,
                        create_link.link_type,
                    )? {
                        Some(lt) => lt,
                        None => {
                            // @todo This must be treated as valid due to holochain bug
                            //   see https://github.com/holochain/holochain/issues/2868
                            return Ok(ValidateCallbackResult::Valid);
                        }
                    };
                    match link_type {
                        LinkTypes::AgentToUsernameAttestations => {
                            validate_delete_link_agent_to_username_attestations(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                        LinkTypes::AgentMetadata => validate_delete_link_user_metadata(
                            action,
                            create_link.clone(),
                            base_address,
                            create_link.target_address,
                            create_link.tag,
                        ),
                        LinkTypes::AgentToWalletAttestations => {
                            validate_delete_link_agent_to_wallet_attestations(
                                action,
                                create_link.clone(),
                                base_address,
                                create_link.target_address,
                                create_link.tag,
                            )
                        }
                    }
                }
                OpRecord::CreatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdatePrivateEntry { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CreateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapClaim { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::UpdateCapGrant { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::Dna { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::OpenChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::CloseChain { .. } => Ok(ValidateCallbackResult::Valid),
                OpRecord::InitZomesComplete { .. } => Ok(ValidateCallbackResult::Valid),
                _ => Ok(ValidateCallbackResult::Valid),
            }
        }
        FlatOp::RegisterAgentActivity(agent_activity) => match agent_activity {
            OpActivity::CreateAgent { agent, action } => {
                let previous_action = must_get_action(action.prev_action)?;
                match previous_action.action() {
                        Action::AgentValidationPkg(
                            AgentValidationPkg { membrane_proof, .. },
                        ) => validate_agent_joining(agent, membrane_proof),
                        _ => {
                            Ok(
                                ValidateCallbackResult::Invalid(
                                    "The previous action for a `CreateAgent` action must be an `AgentValidationPkg`"
                                        .to_string(),
                                ),
                            )
                        }
                    }
            }
            _ => Ok(ValidateCallbackResult::Valid),
        },
    }
}
