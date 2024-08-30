import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAuthorityOnly } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Cannot get external id attestation for agent that doesn't exist", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators } = await setupAuthorityOnly(scenario);

    // Authority tries to get external_id Attestation
    await expect(
      authorityCoordinators.usernameRegistry.getExternalIdAttestationsForAgent(
        await fakeAgentPubKey(0)
      )
    ).resolves.toEqual([]);
  });
});
