import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAuthorityAndAlice } from "../utils/setup-happ.js";

test("Only authority can confirm request", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators, aliceCoordinators, alice, authority } =
      await setupAuthorityAndAlice(scenario);
    await scenario.shareAllAgents();

    // Authority confirms a request
    await expect(
      authorityCoordinators.usernameRegistry.confirmExternalIdRequest({
        request_id: "1234",
        external_id: "4567",
        display_name: "alice",
        requestor: alice.agentPubKey,
      })
    ).resolves.not.toThrow();

    // Alice cannot confirm a request
    await expect(
      aliceCoordinators.usernameRegistry.confirmExternalIdRequest({
        request_id: "1234",
        external_id: "4567",
        display_name: "alice",
        requestor: alice.agentPubKey,
      })
    ).rejects.toThrow();
  });
});
