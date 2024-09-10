import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { encodeHashToBase64, fakeAgentPubKey } from "@holochain/client";

test("Cannot use untrusted external id attestor", async () => {
  await runScenario(async (scenario) => {
    const [alice, aliceCoordinators] = await setupPlayer(scenario);

    // Recipe that simply returns an ExternalIdAttestation via
    // `GetLatestCallerExternalId`
    const externalIdRecipeRecord =
      await aliceCoordinators.usernameRegistry.createRecipe({
        trusted_authors: [await fakeAgentPubKey(0)],
        arguments: [],
        instructions: [
          [
            "$return",
            {
              type: "GetLatestCallerExternalId",
              trusted_author: await fakeAgentPubKey(0),
            },
          ],
        ],
      });

    // An ExternalIdAttestation that wasn't created by the trusted author
    const externalIdAttestationRecord =
      await aliceCoordinators.usernameRegistry.createExternalIdAttestation({
        internal_pubkey: alice.agentPubKey,
        external_id: "whatever",
        display_name: "whatever",
        request_id: "1234",
      });

    // Cannot specify untrusted attestation in execution
    await expect(
      aliceCoordinators.usernameRegistry.createRecipeExecution({
        recipe_ah: externalIdRecipeRecord.signed_action.hashed.hash,
        arguments: [],
        instruction_executions: [
          {
            GetLatestCallerExternalId: {
              attestation_ah:
                externalIdAttestationRecord.signed_action.hashed.hash,
            },
          },
        ],
        output: JSON.stringify({
          agent_pubkey: encodeHashToBase64(alice.agentPubKey),
          external_id: "whatever",
          display_name: "whatever",
        }),
      })
    ).rejects.toSatisfy((err: Error) =>
      err.message.includes("ExternalIdAttestation is by untrusted author")
    );
  });
});
