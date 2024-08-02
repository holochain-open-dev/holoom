use hdk::prelude::*;

use holochain::conductor::api::error::ConductorApiResult;
use holoom_types::{DocumentRelationTag, OracleDocument};

use crate::TestSetup;

#[tokio::test(flavor = "multi_thread")]
async fn can_fetch_documents_by_relation() {
    let setup = TestSetup::authority_only().await;

    let _foo1_record: Record = setup
        .authority_call(
            "username_registry",
            "create_oracle_document",
            OracleDocument {
                name: "foo/1".into(),
                json_data: "{\"type\":\"foo\",\"value\":1}".into(),
            },
        )
        .await
        .unwrap();

    let _foo2_record: Record = setup
        .authority_call(
            "username_registry",
            "create_oracle_document",
            OracleDocument {
                name: "foo/2".into(),
                json_data: "{\"type\":\"foo\",\"value\":2}".into(),
            },
        )
        .await
        .unwrap();

    let res: ConductorApiResult<()> = setup
        .authority_call(
            "username_registry",
            "relate_oracle_document",
            DocumentRelationTag {
                name: "foo/1".into(),
                relation: "foo".into(),
            },
        )
        .await;
    assert!(res.is_ok());

    let res: ConductorApiResult<()> = setup
        .authority_call(
            "username_registry",
            "relate_oracle_document",
            DocumentRelationTag {
                name: "foo/2".into(),
                relation: "foo".into(),
            },
        )
        .await;
    assert!(res.is_ok());

    let identifiers: Vec<String> = setup
        .authority_call(
            "username_registry",
            "get_related_oracle_document_names",
            String::from("foo"),
        )
        .await
        .unwrap();

    let expected_identifiers = vec![String::from("foo/1"), String::from("foo/2")];
    assert_eq!(identifiers, expected_identifiers);
}
