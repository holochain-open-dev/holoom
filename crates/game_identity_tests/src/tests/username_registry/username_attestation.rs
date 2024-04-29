use game_identity_types::{SignableBytes, SignedUsername, UsernameAttestation};
use hdk::prelude::*;
use holochain::conductor::api::error::ConductorApiError;

use crate::TestSetup;

#[tokio::test(flavor = "multi_thread")]
async fn only_authority_can_create_username_attestation() {
    let setup = TestSetup::authority_and_alice().await;

    // Authority creates a UsernameAttestation for alice
    let _: Record = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy1".into(),
                agent: setup.alice_pubkey(),
            },
        )
        .await
        .unwrap();

    // Alice cannot create an UsernameAttestation
    let result: Result<Record, ConductorApiError> = setup
        .alice_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy2".into(),
                agent: setup.alice_pubkey(),
            },
        )
        .await;

    assert!(result.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn same_username_cannot_be_registered_twice() {
    // Set up conductors
    let setup = TestSetup::authority_only().await;

    // Authority creates an UsernameAttestation
    let _: Record = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy".into(),
                agent: fake_agent_pub_key(0),
            },
        )
        .await
        .unwrap();

    // Authority creates a UsernameAttestation with an identical username
    let result: Result<Record, ConductorApiError> = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy".into(),
                agent: fake_agent_pub_key(1),
            },
        )
        .await;

    assert!(result.is_err());

    // Authority creates a UsernameAttestation with a different username
    let _: Record = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy2".into(),
                agent: fake_agent_pub_key(2),
            },
        )
        .await
        .unwrap();
}

#[tokio::test(flavor = "multi_thread")]
async fn same_agent_cannot_be_registered_twice() {
    // Set up conductors
    let setup = TestSetup::authority_only().await;

    // Authority creates an UsernameAttestation
    let _: Record = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "a_cool_guy".into(),
                agent: fake_agent_pubkey_1(),
            },
        )
        .await
        .unwrap();

    // Authority creates a UsernameAttestation with an identical agent
    let result: Result<Record, ConductorApiError> = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "a_different_guy".into(),
                agent: fake_agent_pubkey_1(),
            },
        )
        .await;

    assert!(result.is_err());

    // Authority creates a UsernameAttestation with a different agent
    let _: Record = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "a_third_guy".into(),
                agent: fake_agent_pubkey_2(),
            },
        )
        .await
        .unwrap();
}

#[tokio::test(flavor = "multi_thread")]
async fn username_must_be_within_character_limit() {
    let setup = TestSetup::authority_only().await;

    // Authority creates an username of 5 characters
    let result1: Result<Record, ConductorApiError> = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "abcde".into(),
                agent: fake_agent_pubkey_1(),
            },
        )
        .await;

    assert!(result1.is_err());

    // Alice creates an username of 33 characters
    let result2: Result<Record, ConductorApiError> = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "abcdeabcdeabcdeabcdeabcdeabcdeabc".into(),
                agent: fake_agent_pubkey_1(),
            },
        )
        .await;

    assert!(result2.is_err());

    // Alice creates an username of 15 characters
    let result3: Result<Record, ConductorApiError> = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "abcdeabcdeabcde".into(),
                agent: fake_agent_pubkey_1(),
            },
        )
        .await;

    assert!(result3.is_ok());
}

#[tokio::test(flavor = "multi_thread")]
async fn nobody_can_delete_username_attestation() {
    let setup = TestSetup::authority_and_alice().await;
    setup.conductors.exchange_peer_info().await;

    // Authority creates a UsernameAttestation
    let record: Record = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "asodijsadvjsadlkj".into(),
                agent: fake_agent_pubkey_1(),
            },
        )
        .await
        .unwrap();

    setup.consistency().await;

    // Authority cannot delete a UsernameAttestation
    let result: Result<ActionHash, ConductorApiError> = setup
        .authority_call(
            "username_registry",
            "delete_username_attestation",
            record.action_address(),
        )
        .await;

    assert!(result.is_err());

    // Alice cannot delete a UsernameAttestation
    let result2: Result<ActionHash, ConductorApiError> = setup
        .alice_call(
            "username_registry",
            "delete_username_attestation",
            record.action_address(),
        )
        .await;

    assert!(result2.is_err());
}

#[tokio::test(flavor = "multi_thread")]
async fn all_can_get_username_attestations() {
    let setup = TestSetup::authority_and_alice().await;
    setup.conductors.exchange_peer_info().await;

    // Authority creates an UsernameAttestation
    let record: Record = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "asodijsadvjsadlkj".into(),
                agent: fake_agent_pubkey_1(),
            },
        )
        .await
        .unwrap();

    setup.consistency().await;

    // Authority gets the UsernameAttestation
    let maybe_record: Option<Record> = setup
        .authority_call(
            "username_registry",
            "get_username_attestation",
            record.action_address(),
        )
        .await
        .unwrap();

    assert!(maybe_record.is_some());

    // Alice gets the UsernameAttestation
    let maybe_record2: Option<Record> = setup
        .alice_call(
            "username_registry",
            "get_username_attestation",
            record.action_address(),
        )
        .await
        .unwrap();

    assert!(maybe_record2.is_some());
}

#[tokio::test(flavor = "multi_thread")]
async fn all_can_get_username_attestation_for_agent() {
    let setup = TestSetup::authority_and_alice().await;
    setup.conductors.exchange_peer_info().await;

    // Authority's complete list of attestations initially empty
    let all_records1: Vec<Record> = setup
        .authority_call("username_registry", "get_all_username_attestations", ())
        .await
        .unwrap();
    assert_eq!(all_records1, vec![]);

    // Authority creates an UsernameAttestation
    let _: Record = setup
        .authority_call(
            "username_registry",
            "create_username_attestation",
            UsernameAttestation {
                username: "username1".into(),
                agent: fake_agent_pubkey_1(),
            },
        )
        .await
        .unwrap();

    // Authority gets the UsernameAttestation
    let maybe_record: Option<Record> = setup
        .authority_call(
            "username_registry",
            "get_username_attestation_for_agent",
            fake_agent_pubkey_1(),
        )
        .await
        .unwrap();
    let entry = maybe_record
        .clone()
        .unwrap()
        .entry()
        .to_app_option::<UsernameAttestation>()
        .unwrap()
        .unwrap();

    assert_eq!(entry.username, "username1");
    assert_eq!(entry.agent, fake_agent_pubkey_1());

    // Alice gets the UsernameAttestation
    setup.consistency().await;

    let maybe_record2: Option<Record> = setup
        .alice_call(
            "username_registry",
            "get_username_attestation_for_agent",
            fake_agent_pubkey_1(),
        )
        .await
        .unwrap();
    let entry2 = maybe_record2
        .unwrap()
        .entry()
        .to_app_option::<UsernameAttestation>()
        .unwrap()
        .unwrap();

    assert_eq!(entry2.username, "username1");
    assert_eq!(entry2.agent, fake_agent_pubkey_1());

    // Authority can see the attestation in their complete list
    let all_records2: Vec<Record> = setup
        .authority_call("username_registry", "get_all_username_attestations", ())
        .await
        .unwrap();
    assert_eq!(all_records2, vec![maybe_record.unwrap()]);
}

#[tokio::test(flavor = "multi_thread")]
async fn cannot_get_username_attestation_for_agent_that_doesnt_exist() {
    let setup = TestSetup::authority_only().await;

    // Authority tries to get  UsernameAttestation
    let res: Option<Record> = setup
        .authority_call(
            "username_registry",
            "get_username_attestation_for_agent",
            fake_agent_pubkey_1(),
        )
        .await
        .unwrap();

    assert!(res.is_none());
}

#[tokio::test(flavor = "multi_thread")]
async fn can_attest_username_via_remote_call() {
    let setup = TestSetup::authority_and_alice().await;
    setup.conductors.exchange_peer_info().await;

    // Alice creates a UsernameAttestation
    let record: Record = setup
        .alice_call(
            "username_registry",
            "sign_username_to_attest",
            "asodijsadvjsadlkj".to_string(),
        )
        .await
        .unwrap();

    setup.consistency().await;

    // UsernameAttestation has been created
    let result: Result<Option<Record>, ConductorApiError> = setup
        .authority_call(
            "username_registry",
            "get_username_attestation",
            record.action_address(),
        )
        .await;

    let same_record = result
        .expect(" get_username_attestation should have succeeded")
        .expect("Record should exist");
    assert_eq!(same_record.action_address(), record.action_address());
    let entry = record
        .entry()
        .to_app_option::<UsernameAttestation>()
        .unwrap()
        .unwrap();
    assert_ne!(entry.agent, setup.authority_pubkey());
    assert_eq!(entry.agent, setup.alice_pubkey());
}

#[tokio::test(flavor = "multi_thread")]
async fn authority_wont_ingest_invalid_username_signature() {
    let setup = TestSetup::authority_and_alice().await;
    setup.conductors.exchange_peer_info().await;

    // Alice signs username
    let signature: Signature = setup
        .alice_call("signer", "sign_message", SignableBytes("whatever".into()))
        .await
        .unwrap();
    let invalid_signed_username = SignedUsername {
        username: "a_different_name".into(),
        signature,
        signer: setup.alice_pubkey(),
    };

    // Authority ingests signed username
    let result: Result<Record, ConductorApiError> = setup
        .authority_call(
            "username_registry",
            "ingest_signed_username",
            invalid_signed_username,
        )
        .await;

    assert!(result.is_err());
}
