import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupAuthorityAndAlice } from "../utils/setup-happ.js";

test("Nobody can delete external id attestation", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators, aliceCoordinators, authority, alice } =
      await setupAuthorityAndAlice(scenario);
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

    // Authority cannot delete a external_id Attestation
    await expect(
      authorityCoordinators.usernameRegistry.deleteExternalIdAttestation(
        record.signed_action.hashed.hash
      )
    ).rejects.toThrow();

    // Alice cannot delete a external_id Attestation
    await expect(
      aliceCoordinators.usernameRegistry.deleteExternalIdAttestation(
        record.signed_action.hashed.hash
      )
    ).rejects.toThrow();
  });
});
