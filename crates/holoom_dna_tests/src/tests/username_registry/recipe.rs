use hdk::prelude::*;

use holochain::conductor::api::error::ConductorApiResult;
use holoom_types::{
    recipe::{
        ExecuteRecipePayload, JqInstructionArgumentNames, Recipe, RecipeArgument,
        RecipeArgumentType, RecipeExecution, RecipeInstruction,
    },
    ExternalIdAttestation, OracleDocument,
};
use username_registry_utils::deserialize_record_entry;

use crate::TestSetup;

#[tokio::test(flavor = "multi_thread")]
async fn can_execute_basic_recipe() {
    let setup = TestSetup::authority_and_alice().await;
    setup.conductors.exchange_peer_info().await;

    // Materials:

    // Doc: foo/1234 -> { value: 1, owner: "1234" }
    // Doc: foo/5678 -> { value: 4, owner: "5678" }
    // Doc: foo -> [foo/1234, foo/5678]
    // ExternalId: authority_agent_pub_key -> { id: 1234, display_name: "some-user-1" }
    // ExternalId: alice_agent_pub_key -> { id: 5678, display_name: "some-user-2" }

    // Recipe:
    // Calculate value share of caller
    // {
    //     "$arguments": [{ name" "greeting", type: "string" }],
    //     "foo_name_list_name": { inst: "get_doc", var_name: `"foo"` },
    //     "foo_name_list": { inst: "get_docs", var_name: `"foo"` },
    //     "foos": { inst: "get_docs", var_name: "foo_name_list" },
    //     "caller_external_id": { inst: "get_caller_external_id" },
    //     "$return": {
    //       inst: "jq",
    //       input_vars: ["foos", "caller_external_id", "greeting"],
    //       program: `
    //         .caller_external_id.external_id as $id |
    //         .foos as $foos |
    //         "\(.greeting) \(.caller_external_id.display_name)" as $msg |
    //         [$foos[].value] | add as $total |
    //         $foos[] | select(.owner==$id) | .value / $total |
    //         { share: ., msg: $msg }
    //       `
    //     }
    // }

    // Expected outputs:
    // Authority with greeting: 'Hi' -> { share: 0.2, msg: "Hi some-user-1" }
    // Alice with greeting: 'Hello' -> { share: 0.8, msg: "Hello some-user-2" }

    let _foo1_record: Record = setup
        .authority_call(
            "username_registry",
            "create_oracle_document",
            OracleDocument {
                name: "foo/1234".into(),
                json_data: "{\"value\":1,\"owner\":\"1234\"}".into(),
            },
        )
        .await
        .unwrap();

    let _foo2_record: Record = setup
        .authority_call(
            "username_registry",
            "create_oracle_document",
            OracleDocument {
                name: "foo/5678".into(),
                json_data: "{\"value\":4,\"owner\":\"5678\"}".into(),
            },
        )
        .await
        .unwrap();

    let _foo_name_list_record: Record = setup
        .authority_call(
            "username_registry",
            "create_oracle_document",
            OracleDocument {
                name: "foo".into(),
                json_data: "[\"foo/1234\",\"foo/5678\"]".into(),
            },
        )
        .await
        .unwrap();

    let res: ConductorApiResult<Record> = setup
        .authority_call(
            "username_registry",
            "create_external_id_attestation",
            ExternalIdAttestation {
                request_id: "".into(),
                internal_pubkey: setup.authority_pubkey(),
                external_id: "1234".into(),
                display_name: "some-user-1".into(),
            },
        )
        .await;
    assert!(res.is_ok());

    let res: ConductorApiResult<Record> = setup
        .authority_call(
            "username_registry",
            "create_external_id_attestation",
            ExternalIdAttestation {
                request_id: "".into(),
                internal_pubkey: setup.alice_pubkey(),
                external_id: "5678".into(),
                display_name: "some-user-2".into(),
            },
        )
        .await;
    assert!(res.is_ok());

    let recipe_record: Record = setup
        .authority_call(
            "username_registry",
            "create_recipe",
            Recipe {
                trusted_authors: vec![setup.authority_pubkey()],
                arguments: vec![("greeting".into(),RecipeArgumentType::String)],
                instructions: vec![
                    (
                        "foo_name_list_name".into(),
                        RecipeInstruction::Constant {
                            value: "\"foo\"".into(),
                        },
                    ),
                    (
                        "foo_name_list".into(),
                        RecipeInstruction::GetLatestDocWithIdentifier {
                            var_name: "foo_name_list_name".into(),
                        },
                    ),
                    (
                        "foos".into(),
                        RecipeInstruction::GetDocsListedByVar {
                            var_name: "foo_name_list".into(),
                        },
                    ),
                    (
                        "caller_external_id".into(),
                        RecipeInstruction::GetCallerExternalId,
                    ),
                    (
                        "$return".into(),
                        RecipeInstruction::Jq {
                            input_var_names: JqInstructionArgumentNames::List{var_names: vec!["foos".into(),"caller_external_id".into(), "greeting".into()]}, 
                            program: ".caller_external_id.external_id as $id | .foos as $foos | \"\\(.greeting) \\(.caller_external_id.display_name)\" as $msg | [$foos[].value] | add as $total | $foos[] | select(.owner==$id) | .value / $total | { share: ., msg: $msg }".into()
                        }
                    )
                ],
            },
        )
        .await
        .unwrap();

    // Make both agents know recipe
    setup.consistency().await;

    let authority_execution_record: Record = setup
        .authority_call(
            "username_registry",
            "execute_recipe",
            ExecuteRecipePayload {
                recipe_ah: recipe_record.action_address().clone(),
                arguments: vec![RecipeArgument::String { value: "Hi".into() }],
            },
        )
        .await
        .unwrap();

    let authority_execution: RecipeExecution =
        deserialize_record_entry(authority_execution_record).unwrap();
    assert_eq!(
        authority_execution.output,
        String::from("{\"share\":0.2,\"msg\":\"Hi some-user-1\"}")
    );

    let alice_execution_record: Record = setup
        .alice_call(
            "username_registry",
            "execute_recipe",
            ExecuteRecipePayload {
                recipe_ah: recipe_record.action_address().clone(),
                arguments: vec![RecipeArgument::String {
                    value: "Hello".into(),
                }],
            },
        )
        .await
        .unwrap();

    let alice_execution: RecipeExecution =
        deserialize_record_entry(alice_execution_record).unwrap();
    assert_eq!(
        alice_execution.output,
        String::from("{\"share\":0.8,\"msg\":\"Hello some-user-2\"}")
    );
}
