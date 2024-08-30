import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAuthorityAndAlice } from "../utils/setup-happ.js";

test("Only authority can create username attestations", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators, aliceCoordinators, alice } =
      await setupAuthorityAndAlice(scenario);

    // Authority creates a UsernameAttestation for alice
    await expect(
      authorityCoordinators.usernameRegistry.createUsernameAttestation({
        username: "a_cool_guy1",
        agent: alice.agentPubKey,
      })
    ).resolves.not.toThrow();

    // Alice cannot create an UsernameAttestation
    await expect(
      aliceCoordinators.usernameRegistry.createUsernameAttestation({
        username: "a_cool_guy2",
        agent: alice.agentPubKey,
      })
    ).rejects.toThrow();
  });
});
