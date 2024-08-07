use std::collections::HashMap;

use holochain::conductor::api::error::ConductorApiError;
use holoom_types::{GetMetadataItemValuePayload, UpdateMetadataItemPayload};

use crate::TestSetup;

#[tokio::test(flavor = "multi_thread")]
async fn users_can_only_update_their_own_metadata() {
    let setup = TestSetup::authority_and_alice_bob().await;
    setup.conductors.exchange_peer_info().await;

    // Alice starts with no metadata
    let initial_metadata: HashMap<String, String> = setup
        .alice_call("username_registry", "get_metadata", setup.alice_pubkey())
        .await
        .unwrap();
    assert_eq!(initial_metadata, HashMap::default());

    // Bob cannot set Alice's metadata
    let res1: Result<(), ConductorApiError> = setup
        .bob_call(
            "username_registry",
            "update_metadata_item",
            UpdateMetadataItemPayload {
                agent_pubkey: setup.alice_pubkey(),
                name: "foo".into(),
                value: "bar".into(),
            },
        )
        .await;
    assert!(res1.is_err());

    // Alice sets an item
    let _: () = setup
        .alice_call(
            "username_registry",
            "update_metadata_item",
            UpdateMetadataItemPayload {
                agent_pubkey: setup.alice_pubkey(),
                name: "foo".into(),
                value: "bar2".into(),
            },
        )
        .await
        .unwrap();

    setup.consistency().await;

    // Bob sees new item
    let value1: String = setup
        .bob_call(
            "username_registry",
            "get_metadata_item_value",
            GetMetadataItemValuePayload {
                agent_pubkey: setup.alice_pubkey(),
                name: "foo".into(),
            },
        )
        .await
        .unwrap();
    assert_eq!(value1, String::from("bar2"));
}
