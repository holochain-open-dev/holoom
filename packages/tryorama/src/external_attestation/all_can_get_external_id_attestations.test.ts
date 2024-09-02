import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";

test("All can get external id attestations", async () => {
  await runScenario(async (scenario) => {
    const [authority, authorityCoordinators] = await setupPlayer(scenario);
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    // Authority creates a external_id Attestation
    const record =
      await authorityCoordinators.usernameRegistry.createExternalIdAttestation({
        request_id: "1234",
        internal_pubkey: alice.agentPubKey,
        external_id: "4546",
        display_name: "alice",
      });

    await dhtSync([authority, alice], authority.cells[0].cell_id[0]);

    // Authority gets the external_id Attestation
    await expect(
      authorityCoordinators.usernameRegistry.getExternalIdAttestation(
        record.signed_action.hashed.hash
      )
    ).resolves.toBeTruthy();

    // Alice gets the external_id Attestation
    await expect(
      aliceCoordinators.usernameRegistry.getExternalIdAttestation(
        record.signed_action.hashed.hash
      )
    ).resolves.toBeTruthy();
  });
});
