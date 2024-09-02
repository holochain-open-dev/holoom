import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Nobody can delete username attestation", async () => {
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

    // Authority cannot delete a UsernameAttestation
    await expect(
      authorityCoordinators.usernameRegistry.deleteUsernameAttestation(
        record.signed_action.hashed.hash
      )
    ).rejects.toThrow();

    // Alice cannot delete a UsernameAttestation
    await expect(
      aliceCoordinators.usernameRegistry.deleteUsernameAttestation(
        record.signed_action.hashed.hash
      )
    ).rejects.toThrow();
  });
});
