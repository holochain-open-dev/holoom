import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("All can get username attestations", async () => {
  await runScenario(async (scenario) => {
    const [authority, authorityCoordinators] = await setupPlayer(scenario);
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    // Authority creates a UsernameAttestation
    const record =
      await authorityCoordinators.usernameRegistry.createUsernameAttestation({
        username: "asodijsadvjsadlkj",
        agent: await fakeAgentPubKey(1),
      });

    await dhtSync([authority, alice], authority.cells[0].cell_id[0]);

    // Authority gets the UsernameAttestation
    await expect(
      authorityCoordinators.usernameRegistry.getUsernameAttestation(
        record.signed_action.hashed.hash
      )
    ).resolves.toBeTruthy();

    // Alice gets the UsernameAttestation
    await expect(
      aliceCoordinators.usernameRegistry.getUsernameAttestation(
        record.signed_action.hashed.hash
      )
    ).resolves.toBeTruthy();
  });
});
