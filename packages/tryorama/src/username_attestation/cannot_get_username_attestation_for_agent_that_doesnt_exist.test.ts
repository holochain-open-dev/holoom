import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAuthorityOnly } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Cannot get username attestation for agent that doesn't exist", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators } = await setupAuthorityOnly(scenario);

    // Authority tries to get UsernameAttestation
    await expect(
      authorityCoordinators.usernameRegistry.getUsernameAttestationForAgent(
        await fakeAgentPubKey(1)
      )
    ).resolves.toBe(null);
  });
});
