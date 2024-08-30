import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAuthorityOnly } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Cannot use untrusted docs", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators } = await setupAuthorityOnly(scenario);

    // Recipe that return a doc called 'foo' via `GetLatestDocWithIdentifier`
    const singleDocRecipeRecord =
      await authorityCoordinators.usernameRegistry.createRecipe({
        trusted_authors: [await fakeAgentPubKey(0)],
        arguments: [],
        instructions: [
          ["doc_name", { type: "Constant", value: JSON.stringify("foo") }],
          [
            "$return",
            { type: "GetLatestDocWithIdentifier", var_name: "doc_name" },
          ],
        ],
      });

    // A doc that wasn't created by the trusted author
    const docRecord =
      await authorityCoordinators.usernameRegistry.createOracleDocument({
        name: "foo",
        json_data: JSON.stringify("suspicious"),
      });

    // Cannot specify untrusted doc in execution
    await expect(
      authorityCoordinators.usernameRegistry.createRecipeExecution({
        recipe_ah: singleDocRecipeRecord.signed_action.hashed.hash,
        arguments: [],
        instruction_executions: [
          "Constant",
          {
            GetLatestDocWithIdentifier: {
              doc_ah: docRecord.signed_action.hashed.hash,
            },
          },
        ],
        output: JSON.stringify("suspicious"),
      })
    ).rejects.toSatisfy((err: Error) =>
      err.message.includes("Untrusted author")
    );

    // Recipe that return a doc called 'foo' via `GetDocsListedByVar`
    // This part of the test basically checks the same behaviour again against
    // another instruction.
    const docListRecipeRecord =
      await authorityCoordinators.usernameRegistry.createRecipe({
        trusted_authors: [await fakeAgentPubKey(0)],
        arguments: [],
        instructions: [
          ["doc_names", { type: "Constant", value: JSON.stringify(["foo"]) }],
          ["$return", { type: "GetDocsListedByVar", var_name: "doc_names" }],
        ],
      });

    // Cannot list untrusted doc in execution
    await expect(
      authorityCoordinators.usernameRegistry.createRecipeExecution({
        recipe_ah: docListRecipeRecord.signed_action.hashed.hash,
        arguments: [],
        instruction_executions: [
          "Constant",
          {
            GetDocsListedByVar: {
              doc_ahs: [docRecord.signed_action.hashed.hash],
            },
          },
        ],
        output: JSON.stringify("suspicious"),
      })
    ).rejects.toSatisfy((err: Error) =>
      err.message.includes("Untrusted author")
    );
  });
});
