use hdk::prelude::*;

use holochain::conductor::api::error::ConductorApiResult;
use holoom_types::{
    JqExecution, OracleDocument, OracleDocumentListSnapshot,
    RefreshJqExecutionForNamedRelationPayload, RelateOracleDocumentPayload, SnapshotInput,
};
use username_registry_utils::deserialize_record_entry;

use crate::TestSetup;

#[tokio::test(flavor = "multi_thread")]
async fn can_fetch_documents_by_relation() {
    let setup = TestSetup::authority_only().await;

    let foo1_record: Record = setup
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

    let foo2_record: Record = setup
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
            RelateOracleDocumentPayload {
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
            RelateOracleDocumentPayload {
                name: "foo/2".into(),
                relation: "foo".into(),
            },
        )
        .await;
    assert!(res.is_ok());

    let identifiers: Vec<String> = setup
        .authority_call(
            "username_registry",
            "get_related_oracle_document",
            String::from("foo"),
        )
        .await
        .unwrap();

    let expected_identifiers = vec![String::from("foo/1"), String::from("foo/2")];
    assert_eq!(identifiers, expected_identifiers);

    let snapshot_record: Record = setup
        .authority_call(
            "username_registry",
            "refresh_oracle_document_snapshot_for_relation",
            String::from("foo"),
        )
        .await
        .unwrap();

    let snapshot: OracleDocumentListSnapshot = deserialize_record_entry(snapshot_record).unwrap();

    assert_eq!(
        snapshot.identifiers_input,
        SnapshotInput::RelationSnapshot(expected_identifiers)
    );
    assert_eq!(
        snapshot.resolved_documents,
        vec![
            foo1_record.action_address().clone(),
            foo2_record.action_address().clone()
        ]
    );

    let jq_execution_record: Record = setup
        .authority_call(
            "username_registry",
            "refresh_jq_execution_for_named_relation",
            RefreshJqExecutionForNamedRelationPayload {
                relation_name: "foo".into(),
                program: "[.[].value]".into(),
            },
        )
        .await
        .unwrap();

    let jq_execution: JqExecution = deserialize_record_entry(jq_execution_record).unwrap();
    assert_eq!(jq_execution.output, String::from("[1,2]"));

    let revised_foo2_record: Record = setup
        .authority_call(
            "username_registry",
            "create_oracle_document",
            OracleDocument {
                name: "foo/2".into(),
                json_data: "{\"type\":\"foo\",\"value\":\"two\"}".into(),
            },
        )
        .await
        .unwrap();

    let revised_snapshot_record: Record = setup
        .authority_call(
            "username_registry",
            "refresh_oracle_document_snapshot_for_relation",
            String::from("foo"),
        )
        .await
        .unwrap();

    let revised_snapshot: OracleDocumentListSnapshot =
        deserialize_record_entry(revised_snapshot_record).unwrap();

    assert_eq!(
        revised_snapshot.resolved_documents,
        vec![
            foo1_record.action_address().clone(),
            revised_foo2_record.action_address().clone()
        ]
    );

    let revised_jq_execution_record: Record = setup
        .authority_call(
            "username_registry",
            "refresh_jq_execution_for_named_relation",
            RefreshJqExecutionForNamedRelationPayload {
                relation_name: "foo".into(),
                program: "[.[].value]".into(),
            },
        )
        .await
        .unwrap();

    let revised_jq_execution: JqExecution =
        deserialize_record_entry(revised_jq_execution_record).unwrap();
    assert_eq!(revised_jq_execution.output, String::from("[1,\"two\"]"));
}
