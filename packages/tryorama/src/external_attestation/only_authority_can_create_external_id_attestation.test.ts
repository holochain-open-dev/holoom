import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAuthorityAndAlice } from "../utils/setup-happ.js";

test("Only authority can create external id attestation", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators, aliceCoordinators, alice } =
      await setupAuthorityAndAlice(scenario);
    await scenario.shareAllAgents();

    // Authority creates a external id Attestation for alice
    await expect(
      authorityCoordinators.usernameRegistry.createExternalIdAttestation({
        request_id: "1234",
        internal_pubkey: alice.agentPubKey,
        external_id: "4546",
        display_name: "alice",
      })
    ).resolves.not.toThrow();

    // Alice cannot create an external id Attestation
    await expect(
      aliceCoordinators.usernameRegistry.createExternalIdAttestation({
        request_id: "9876",
        internal_pubkey: alice.agentPubKey,
        external_id: "abcd",
        display_name: "alice2",
      })
    ).rejects.toThrow();
  });
});
