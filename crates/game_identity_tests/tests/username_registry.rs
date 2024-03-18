use game_identity_types::{
    ChainWalletSignature, EvmAddress, EvmSignature, UsernameAttestation, WalletAttestation,
};
use hdk::prelude::*;
use holochain::{
    conductor::{
        api::error::{ConductorApiError, ConductorApiResult},
        config::ConductorConfig,
    },
    sweettest::*,
};
use std::{str::FromStr, time::Duration};
use username_registry_validation::{evm_signing_message, solana_signing_message};

use game_identity_tests::game_identity_dna_with_authority;

#[tokio::test(flavor = "multi_thread")]
async fn only_authority_can_create_username_attestation() {
    // Set up conductors
    let mut conductors: SweetConductorBatch =
        SweetConductorBatch::from_config(2, ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductors[0].keystore()).await;

    let dnas = &[game_identity_dna_with_authority(&alice_agentpubkey).await];

    let app = conductors[0]
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();
    let app2 = conductors[1]
        .setup_app("game_identity", dnas)
        .await
        .unwrap();
    let (bob,) = app2.into_tuple();

    // Alice creates an UsernameAttestation
    let _: Record = conductors[0]
        .call(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy1".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    // Bob cannot create an UsernameAttestation
    let result: Result<Record, ConductorApiError> = conductors[1]
        .call_fallible(
            &bob.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy2".into(),
                agent: bob.agent_pubkey().clone(),
            },
        )
        .await;

    assert!(result.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn same_username_cannot_be_registered_twice() {
    // Set up conductors
    let mut conductor = SweetConductor::from_config(ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductor.keystore()).await;

    let dnas = &[game_identity_dna_with_authority(&alice_agentpubkey).await];

    let app = conductor
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();

    // Alice creates an UsernameAttestation
    let _: Record = conductor
        .call(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    // Alice creates a UsernameAttestation with an identical username
    let other_agentpubkey1 = SweetAgents::one(conductor.keystore()).await;
    let result: Result<Record, ConductorApiError> = conductor
        .call_fallible(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy".into(),
                agent: other_agentpubkey1.clone(),
            },
        )
        .await;

    assert!(result.is_err());

    // Alice creates a UsernameAttestation with a different username
    let other_agentpubkey2 = SweetAgents::one(conductor.keystore()).await;
    let _: Record = conductor
        .call(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy2".into(),
                agent: other_agentpubkey2.clone(),
            },
        )
        .await;
}

#[tokio::test(flavor = "multi_thread")]
async fn same_agent_cannot_be_registered_twice() {
    // Set up conductors
    let mut conductor = SweetConductor::from_config(ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductor.keystore()).await;

    let dnas = &[game_identity_dna_with_authority(&alice_agentpubkey).await];

    let app = conductor
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();

    // Alice creates an UsernameAttestation
    let _: Record = conductor
        .call(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    // Alice creates a UsernameAttestation with an identical agent
    let result: Result<Record, ConductorApiError> = conductor
        .call_fallible(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "a_different_guy".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    assert!(result.is_err());

    // Alice creates a UsernameAttestation with a different agent
    let other_agentpubkey1 = SweetAgents::one(conductor.keystore()).await;
    let _: Record = conductor
        .call(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "a_third_guy".into(),
                agent: other_agentpubkey1.clone(),
            },
        )
        .await;
}

#[tokio::test(flavor = "multi_thread")]
async fn username_must_be_within_character_limit() {
    // Set up conductors
    let mut conductor = SweetConductor::from_config(ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductor.keystore()).await;
    let dnas = &[game_identity_dna_with_authority(&alice_agentpubkey).await];

    let app = conductor
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();

    // Alice creates an username of 5 characters
    let result1: Result<Record, ConductorApiError> = conductor
        .call_fallible(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "abcde".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    assert!(result1.is_err());

    // Alice creates an username of 33 characters
    let result2: Result<Record, ConductorApiError> = conductor
        .call_fallible(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "abcdeabcdeabcdeabcdeabcdeabcdeabc".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    assert!(result2.is_err());

    // Alice creates an username of 15 characters
    let result3: Result<Record, ConductorApiError> = conductor
        .call_fallible(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "abcdeabcdeabcde".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    assert!(result3.is_ok());
}

#[tokio::test(flavor = "multi_thread")]
async fn nobody_can_delete_username_attestation() {
    // Set up conductors
    let mut conductors: SweetConductorBatch =
        SweetConductorBatch::from_config(2, ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductors[0].keystore()).await;

    let dnas = &[game_identity_dna_with_authority(&alice_agentpubkey).await];

    let app = conductors[0]
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();
    let app2 = conductors[1]
        .setup_app("game_identity", dnas)
        .await
        .unwrap();
    let (bob,) = app2.into_tuple();
    conductors.exchange_peer_info().await;

    // Alice creates a UsernameAttestation
    let record: Record = conductors[0]
        .call(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "asodijsadvjsadlkj".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    consistency([&alice, &bob], 100, Duration::from_secs(10)).await;

    // Alice cannot delete a UsernameAttestation
    let result: Result<ActionHash, ConductorApiError> = conductors[0]
        .call_fallible(
            &alice.zome("username_registry"),
            "delete_username_attestation",
            record.action_address(),
        )
        .await;

    assert!(result.is_err());

    // bob cannot delete a UsernameAttestation
    let result2: Result<ActionHash, ConductorApiError> = conductors[1]
        .call_fallible(
            &bob.zome("username_registry"),
            "delete_username_attestation",
            record.action_address(),
        )
        .await;

    assert!(result2.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn all_can_get_username_attestations() {
    // Set up conductors
    let mut conductors: SweetConductorBatch =
        SweetConductorBatch::from_config(2, ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductors[0].keystore()).await;

    let dnas = &[game_identity_dna_with_authority(&alice_agentpubkey).await];

    let app = conductors[0]
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();
    let app2 = conductors[1]
        .setup_app("game_identity", dnas)
        .await
        .unwrap();
    let (bob,) = app2.into_tuple();
    conductors.exchange_peer_info().await;

    // Alice creates an UsernameAttestation
    let record: Record = conductors[0]
        .call(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "asodijsadvjsadlkj".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    consistency([&alice, &bob], 100, Duration::from_secs(10)).await;

    // Alice gets the UsernameAttestation
    let maybe_record: Option<Record> = conductors[0]
        .call(
            &alice.zome("username_registry"),
            "get_username_attestation",
            record.action_address(),
        )
        .await;

    assert!(maybe_record.is_some());

    // Bob gets the UsernameAttestation
    let maybe_record2: Option<Record> = conductors[1]
        .call(
            &bob.zome("username_registry"),
            "get_username_attestation",
            record.action_address(),
        )
        .await;

    assert!(maybe_record2.is_some());
}

#[tokio::test(flavor = "multi_thread")]
async fn all_can_get_username_attestation_for_agent() {
    // Set up conductors
    let mut conductors: SweetConductorBatch =
        SweetConductorBatch::from_config(2, ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductors[0].keystore()).await;

    let dnas = &[game_identity_dna_with_authority(&alice_agentpubkey).await];

    let app = conductors[0]
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();
    let app2 = conductors[1]
        .setup_app("game_identity", dnas)
        .await
        .unwrap();
    let (bob,) = app2.into_tuple();
    conductors.exchange_peer_info().await;

    // Alice creates an UsernameAttestation
    let _: Record = conductors[0]
        .call(
            &alice.zome("username_registry"),
            "create_username_attestation",
            UsernameAttestation {
                username: "username1".into(),
                agent: alice_agentpubkey.clone(),
            },
        )
        .await;

    // Alice gets the UsernameAttestation
    let maybe_record: Option<Record> = conductors[0]
        .call(
            &alice.zome("username_registry"),
            "get_username_attestation_for_agent",
            alice_agentpubkey.clone(),
        )
        .await;
    let entry = maybe_record
        .unwrap()
        .entry()
        .to_app_option::<UsernameAttestation>()
        .unwrap()
        .unwrap();

    assert_eq!(entry.username, "username1");
    assert_eq!(entry.agent, alice_agentpubkey.clone());

    // Bob gets the UsernameAttestation
    consistency([&alice, &bob], 100, Duration::from_secs(10)).await;

    let maybe_record2: Option<Record> = conductors[1]
        .call(
            &bob.zome("username_registry"),
            "get_username_attestation_for_agent",
            alice_agentpubkey.clone(),
        )
        .await;
    let entry2 = maybe_record2
        .unwrap()
        .entry()
        .to_app_option::<UsernameAttestation>()
        .unwrap()
        .unwrap();

    assert_eq!(entry2.username, "username1");
    assert_eq!(entry2.agent, alice_agentpubkey.clone());
}

#[tokio::test(flavor = "multi_thread")]
async fn cannot_get_username_attestation_for_agent_that_doesnt_exist() {
    // Set up conductors
    let mut conductors: SweetConductorBatch =
        SweetConductorBatch::from_config(1, ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductors[0].keystore()).await;

    let dnas = &[game_identity_dna_with_authority(&alice_agentpubkey).await];

    let app = conductors[0]
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();

    // Alice tries to get  UsernameAttestation
    let res: Option<Record> = conductors[0]
        .call(
            &alice.zome("username_registry"),
            "get_username_attestation_for_agent",
            fake_agent_pubkey_1(),
        )
        .await;

    assert!(res.is_none());
}

#[tokio::test(flavor = "multi_thread")]
async fn checks_validity_of_evm_wallet_attestation() {
    // Set up conductors
    let mut conductors: SweetConductorBatch =
        SweetConductorBatch::from_config(1, ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductors[0].keystore()).await;

    let dnas = &[game_identity_dna_with_authority(&fake_agent_pubkey_1()).await];

    let app = conductors[0]
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();

    // Create WalletAttestation for alice at address 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

    // First account of seed phrase: test test test test test test test test test test test junk
    let signer_private_key = "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    use ethers_signers::{LocalWallet, Signer};
    let signer_wallet = LocalWallet::from_str(signer_private_key).unwrap();
    let wallet_address = signer_wallet.address();
    let wallet_address = EvmAddress::try_from(wallet_address.as_bytes()).unwrap();
    assert_eq!(
        wallet_address.to_checksum(None),
        String::from("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
    );
    let message = evm_signing_message(&wallet_address, alice_agentpubkey.clone());
    let signature = signer_wallet.sign_message(message).await.unwrap();
    let signature_bytes = signature.to_vec();
    let signature = EvmSignature::try_from(&signature_bytes[..]).unwrap();

    let attestation = WalletAttestation {
        chain_wallet_signature: ChainWalletSignature::Evm {
            evm_address: wallet_address,
            evm_signature: signature,
        },
        agent: alice_agentpubkey.clone(),
    };

    // Genuine attestation should be accepted
    let res: ConductorApiResult<Record> = conductors[0]
        .call_fallible(
            &alice.zome("username_registry"),
            "create_wallet_attestation",
            attestation,
        )
        .await;
    assert!(res.is_ok());

    let malicious_message = evm_signing_message(&wallet_address, fake_agent_pubkey_1());
    let signature = signer_wallet.sign_message(malicious_message).await.unwrap();
    let signature_bytes = signature.to_vec();
    let signature = EvmSignature::try_from(&signature_bytes[..]).unwrap();

    let malicious_attestation = WalletAttestation {
        chain_wallet_signature: ChainWalletSignature::Evm {
            evm_address: wallet_address,
            evm_signature: signature,
        },
        agent: alice_agentpubkey.clone(),
    };

    // Genuine attestation should be rejected
    let res: ConductorApiResult<Record> = conductors[0]
        .call_fallible(
            &alice.zome("username_registry"),
            "create_wallet_attestation",
            malicious_attestation,
        )
        .await;
    assert!(res.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn checks_validity_of_solana_wallet_attestation() {
    // Set up conductors
    let mut conductors: SweetConductorBatch =
        SweetConductorBatch::from_config(1, ConductorConfig::default()).await;

    let alice_agentpubkey = SweetAgents::one(conductors[0].keystore()).await;

    let dnas = &[game_identity_dna_with_authority(&fake_agent_pubkey_1()).await];

    let app = conductors[0]
        .setup_app_for_agent("game_identity", alice_agentpubkey.clone(), dnas)
        .await
        .unwrap();
    let (alice,) = app.into_tuple();

    // Create WalletAttestation for alice at address oeYf6KAJkLYhBuR8CiGc6L4D4Xtfepr85fuDgA9kq96

    // First account of seed phrase: test test test test test test test test test test test junk
    let private_key =
        "4Cfc4TJ6dsWwLcw8aJ5uhx7UJKPR5VGXTu2iJr5bVRoTDsxzb6qfJrzR5HNhBcwGwsXqGeHzDR3eUWLr7MRnska8";
    let private_key_bytes = bs58::decode(private_key).into_vec().unwrap();

    use ed25519_dalek::{Signer, SigningKey, SECRET_KEY_LENGTH};

    let signing_key = SigningKey::try_from(&private_key_bytes[..SECRET_KEY_LENGTH]).unwrap();
    let solana_address = signing_key.verifying_key();

    assert_eq!(
        bs58::encode(solana_address.as_bytes()).into_string(),
        String::from("oeYf6KAJkLYhBuR8CiGc6L4D4Xtfepr85fuDgA9kq96")
    );
    let message = solana_signing_message(&solana_address, alice_agentpubkey.clone());
    let solana_signature = signing_key.try_sign(message.as_bytes()).unwrap();

    let attestation = WalletAttestation {
        chain_wallet_signature: ChainWalletSignature::Solana {
            solana_address,
            solana_signature,
        },
        agent: alice_agentpubkey.clone(),
    };

    // Genuine attestation should be accepted
    let res: ConductorApiResult<Record> = conductors[0]
        .call_fallible(
            &alice.zome("username_registry"),
            "create_wallet_attestation",
            attestation,
        )
        .await;
    assert!(res.is_ok());

    let malicious_message = solana_signing_message(&solana_address, fake_agent_pubkey_1());
    let solana_signature = signing_key.try_sign(malicious_message.as_bytes()).unwrap();

    let malicious_attestation = WalletAttestation {
        chain_wallet_signature: ChainWalletSignature::Solana {
            solana_address,
            solana_signature,
        },
        agent: alice_agentpubkey.clone(),
    };

    // Genuine attestation should be rejected
    let res: ConductorApiResult<Record> = conductors[0]
        .call_fallible(
            &alice.zome("username_registry"),
            "create_wallet_attestation",
            malicious_attestation,
        )
        .await;
    assert!(res.is_err());
}
