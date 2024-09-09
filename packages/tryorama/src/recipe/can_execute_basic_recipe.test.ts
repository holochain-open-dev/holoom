import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";
import { RecipeExecution } from "@holoom/types";

import { setupPlayer } from "../utils/setup-happ.js";
import { decodeAppEntry } from "@holoom/client";

test("Can execute basic recipe", async () => {
  await runScenario(async (scenario) => {
    const [authority, authorityCoordinators] = await setupPlayer(scenario);
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

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

    await authorityCoordinators.usernameRegistry.createOracleDocument({
      name: "foo/1234",
      json_data: JSON.stringify({ owner: "1234", value: 1 }),
    });

    await authorityCoordinators.usernameRegistry.createOracleDocument({
      name: "foo/5678",
      json_data: JSON.stringify({ owner: "5678", value: 4 }),
    });

    await authorityCoordinators.usernameRegistry.createOracleDocument({
      name: "foo",
      json_data: JSON.stringify(["foo/1234", "foo/5678"]),
    });

    await authorityCoordinators.usernameRegistry.createExternalIdAttestation({
      request_id: "",
      internal_pubkey: authority.agentPubKey,
      external_id: "1234",
      display_name: "some-user-1",
    });

    await authorityCoordinators.usernameRegistry.createExternalIdAttestation({
      request_id: "",
      internal_pubkey: alice.agentPubKey,
      external_id: "5678",
      display_name: "some-user-2",
    });

    const recipeRecord =
      await authorityCoordinators.usernameRegistry.createRecipe({
        trusted_authors: [authority.agentPubKey],
        arguments: [["greeting", { type: "String" }]],
        instructions: [
          [
            "foo_name_list_name",
            { type: "Constant", value: JSON.stringify("foo") },
          ],
          [
            "foo_name_list",
            {
              type: "GetLatestDocWithIdentifier",
              var_name: "foo_name_list_name",
            },
          ],
          ["foos", { type: "GetDocsListedByVar", var_name: "foo_name_list" }],
          [
            "caller_external_id",
            {
              type: "GetLatestCallerExternalId",
              trusted_author: authority.agentPubKey,
            },
          ],
          [
            "$return",
            {
              type: "Jq",
              input_var_names: {
                type: "List",
                var_names: ["foos", "caller_external_id", "greeting"],
              },
              program: `
                .caller_external_id.external_id as $id |
                .foos as $foos |
                "\\(.greeting) \\(.caller_external_id.display_name)" as $msg |
                [$foos[].value] |
                add as $total |
                $foos[] |
                select(.owner==$id) |
                .value / $total |
                { share: ., msg: $msg }
              `,
            },
          ],
        ],
      });

    // Make sure both agents know recipe
    await dhtSync([authority, alice], authority.cells[0].cell_id[0]);

    const authorityExecutionRecord =
      await authorityCoordinators.usernameRegistry.executeRecipe({
        recipe_ah: recipeRecord.signed_action.hashed.hash,
        arguments: [{ type: "String", value: "Hi" }],
      });
    const authorityExecution = decodeAppEntry<RecipeExecution>(
      authorityExecutionRecord
    );
    expect(authorityExecution.output).toBe(
      JSON.stringify({ share: 0.2, msg: "Hi some-user-1" })
    );

    const aliceExecutionRecord =
      await aliceCoordinators.usernameRegistry.executeRecipe({
        recipe_ah: recipeRecord.signed_action.hashed.hash,
        arguments: [{ type: "String", value: "Hello" }],
      });
    const aliceExecution =
      decodeAppEntry<RecipeExecution>(aliceExecutionRecord);
    expect(aliceExecution.output).toBe(
      JSON.stringify({ share: 0.8, msg: "Hello some-user-2" })
    );

    // Alice's untrusted document isn't able to censor the outcome
    await aliceCoordinators.usernameRegistry.createOracleDocument({
      name: "foo",
      json_data: JSON.stringify(["foo/5678"]),
    });

    const aliceExecutionRecord2 =
      await aliceCoordinators.usernameRegistry.executeRecipe({
        recipe_ah: recipeRecord.signed_action.hashed.hash,
        arguments: [{ type: "String", value: "Hello" }],
      });
    const aliceExecution2 = decodeAppEntry<RecipeExecution>(
      aliceExecutionRecord2
    );
    // Result should be unchanged, rather than the dishonestly attempted
    // alteration of:
    // { "share": 1, "msg": "Hello some-user-2" }
    expect(aliceExecution2.output).toBe(
      JSON.stringify({ share: 0.8, msg: "Hello some-user-2" })
    );
  });
});
