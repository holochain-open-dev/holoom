import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Cannot get username attestation for agent that doesn't exist", async () => {
  await runScenario(async (scenario) => {
    const [authority, authorityCoordinators] = await setupPlayer(scenario);

    // Authority tries to get UsernameAttestation
    await expect(
      authorityCoordinators.usernameRegistry.getUsernameAttestationForAgent({
        agent: await fakeAgentPubKey(1),
        trusted_authorities: [authority.agentPubKey],
      })
    ).resolves.toBe(null);
  });
});
