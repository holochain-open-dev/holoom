use hdk::prelude::*;
use holochain::conductor::api::error::ConductorApiError;
use holoom_types::{ConfirmExternalIdRequestPayload, ExternalIdAttestation};
mod config;
use crate::config::TestSetup;


#[cfg(test)]


#[tokio::test(flavor = "multi_thread")]
async fn only_authority_can_create_external_id_attestation() {
    let setup = TestSetup::authority_and_alice().await;

    // Authority creates a external id Attestation for alice
    let _: Record = setup
        .authority_call(
            "external_attestation",
            "create_external_id_attestation",
            ExternalIdAttestation {
                request_id: "1234".into(),
                internal_pubkey: setup.alice_pubkey(),
                external_id: "4546".into(),
                display_name: "alice".into()
            },
        )
        .await
        .unwrap();

    // Alice cannot create an external id Attestation
    let result: Result<Record, ConductorApiError> = setup
        .alice_call(
            "external_attestation",
            "create_external_id_attestation",
            ExternalIdAttestation {
                request_id: "9876".into(),
                internal_pubkey: setup.alice_pubkey(),
                external_id: "abcd".into(),
                display_name: "alice2".into()
            },
        )
        .await;

    assert!(result.is_err());
}



#[tokio::test(flavor = "multi_thread")]
async fn only_authority_can_confirm_request() {
    let setup = TestSetup::authority_and_alice().await;
    
    let _: Record = setup
        .authority_call(
            "external_attestation",
            "confirm_external_id_request",
            ConfirmExternalIdRequestPayload {
                request_id:"1234".into(),
                external_id: "4567".into(),
                display_name: "alice".into(),
                requestor: setup.alice_pubkey()
            })
            .await
            .unwrap();

    let result2: Result<Record, ConductorApiError> = setup
        .alice_call(
            "external_attestation",
            "confirm_external_id_request",
            ConfirmExternalIdRequestPayload {
                request_id:"1234".into(),
                external_id: "4567".into(),
                display_name: "alice".into(),
                requestor: setup.alice_pubkey()
            })
            .await;
        assert!(result2.is_err());
}
 

#[tokio::test(flavor = "multi_thread")]
async fn nobody_can_delete_external_id_attestation() {
    let setup = TestSetup::authority_and_alice().await;
    setup.conductors.exchange_peer_info().await;

    // Authority creates a external_id Attestation
    let record: Record = setup
        .authority_call(
            "external_attestation",
            "create_external_id_attestation",
            ExternalIdAttestation {
                request_id: "1234".into(),
                internal_pubkey: fake_agent_pubkey_1(),
                external_id: "4546".into(),
                display_name: "alice".into()
            },
        )
        .await
        .unwrap();

    setup.consistency().await;

    // Authority cannot delete a external_id Attestation
    let result: Result<ActionHash, ConductorApiError> = setup
        .authority_call(
            "external_attestation",
            "delete_external_id_attestation",
            record.action_address(),
        )
        .await;

    assert!(result.is_err());

    // Alice cannot delete a external_id Attestation
    let result2: Result<ActionHash, ConductorApiError> = setup
        .alice_call(
            "external_attestation",
            "delete_external_id_attestation",
            record.action_address(),
        )
        .await;

    assert!(result2.is_err());
}



#[tokio::test(flavor = "multi_thread")]
async fn all_can_get_external_id_attestations() {
    let setup = TestSetup::authority_and_alice().await;
    setup.conductors.exchange_peer_info().await;

    // Authority creates an external_id Attestation
    let record: Record = setup
        .authority_call(
            "external_attestation",
            "create_external_id_attestation",
            ExternalIdAttestation {
                request_id: "1234".into(),
                internal_pubkey: fake_agent_pubkey_1(),
                external_id: "4546".into(),
                display_name: "alice".into()
            },
        )
        .await
        .unwrap();

    setup.consistency().await;

    // Authority gets the external_id Attestation
    let maybe_record: Option<Record> = setup
        .authority_call(
            "external_attestation",
            "get_external_id_attestation",
            record.action_address(),
        )
        .await
        .unwrap();

    assert!(maybe_record.is_some());

    // Alice gets the external_id Attestation
    let maybe_record2: Option<Record> = setup
        .alice_call(
            "external_attestation",
            "get_external_id_attestation",
            record.action_address(),
        )
        .await
        .unwrap();

    assert!(maybe_record2.is_some());
}


#[tokio::test(flavor = "multi_thread")]
async fn all_can_get_external_id_attestation_for_agent() {
    let setup = TestSetup::authority_and_alice().await;
    setup.conductors.exchange_peer_info().await;

    // Authority's complete list of attestations initially empty
    let all_records1: Vec<ActionHash> = setup
        .authority_call("external_attestation", "get_all_external_id_ahs", ())
        .await
        .unwrap();
    assert_eq!(all_records1, vec![]);

    // Authority creates an external_id Attestation
    let _: Record = setup
        .authority_call(
            "external_attestation",
            "create_external_id_attestation",
            ExternalIdAttestation {
                request_id: "1234".into(),
                internal_pubkey: setup.alice_pubkey(),
                external_id: "4546".into(),
                display_name: "alice".into()
            },
        )
        .await
        .unwrap();

    // Authority gets the external_id Attestation
    let maybe_record: Option<Record> = setup
        .authority_call(
            "external_attestation",
            "get_attestation_for_external_id",
            "4546".to_string()
        )
        .await
        .unwrap();
    let entry = maybe_record
        .clone()
        .unwrap()
        .entry()
        .to_app_option::<ExternalIdAttestation>()
        .unwrap()
        .unwrap();

    assert_eq!(entry.external_id, "4546");
    assert_eq!(entry.internal_pubkey, setup.alice_pubkey());

    // Alice gets the external_id Attestation
    setup.consistency().await;

    let maybe_vector_record: Vec<Record> = setup
        .alice_call(
            "external_attestation",
            "get_external_id_attestations_for_agent",
            setup.alice_pubkey(),
        )
        .await
        .unwrap();
    let entry2 = maybe_vector_record.first()
        .unwrap()
        .entry()
        .to_app_option::<ExternalIdAttestation>()
        .unwrap()
        .unwrap();

    assert_eq!(entry2.external_id, "4546");
    assert_eq!(entry2.internal_pubkey, setup.alice_pubkey());

    // Authority can see the attestation in their complete list
    let all_records2: Vec<ActionHash> = setup
        .authority_call("external_attestation", "get_all_external_id_ahs", ())
        .await
        .unwrap();
    
    let first_record: Record = maybe_vector_record.first().unwrap().clone();
    
    let search_record: Record = setup
        .authority_call("external_attestation", "get_external_id_attestation", first_record.action_address())
        .await
        .unwrap();
    assert_eq!(all_records2.first().unwrap(), search_record.action_address());
}



#[tokio::test(flavor = "multi_thread")]
async fn cannot_get_external_id_attestation_for_agent_that_doesnt_exist() {
    let setup = TestSetup::authority_only().await;

    // Authority tries to get external_id Attestation
    let res: Vec<Option<Record>> = setup
        .authority_call(
            "external_attestation",
            "get_external_id_attestations_for_agent",
            fake_agent_pubkey_1(),
        )
        .await
        .unwrap();

    assert!(res.is_empty());
}


//this test anticipates future code changes that change the behaviour 
//of allowing another pub key to use the same external id 
// commented for now

/*#[tokio::test(flavor = "multi_thread")]
async fn same_external_id_cannot_be_registered_twice_from_another_user() {
    // Set up conductors
    let setup = TestSetup::authority_only().await;

    // Authority creates an external id attestation
    let _: Record = setup
        .authority_call(
            "external_attestation",
            "create_external_id_attestation",
            ExternalIdAttestation {
                request_id: "1234".into(),
                internal_pubkey: fake_agent_pubkey_1(),
                external_id: "4546".into(),
                display_name: "alice".into()
            },
        )
        .await
        .unwrap();

    // Authority creates a UsernameAttestation with an identical username
    let result: Result<Record, ConductorApiError> = setup
        .authority_call(
            "external_attestation",
            "create_external_id_attestation",
            ExternalIdAttestation {
                request_id: "1234".into(),
                internal_pubkey: fake_agent_pubkey_2(),
                external_id: "4546".into(),
                display_name: "bob".into()
            },
        )
        .await;

    assert!(result.is_err());  
}*/
