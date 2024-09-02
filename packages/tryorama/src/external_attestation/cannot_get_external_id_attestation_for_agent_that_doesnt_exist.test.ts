import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Cannot get external id attestation for agent that doesn't exist", async () => {
  await runScenario(async (scenario) => {
    const [authority, authorityCoordinators] = await setupPlayer(scenario);

    // Authority tries to get external_id Attestation
    await expect(
      authorityCoordinators.usernameRegistry.getExternalIdAttestationsForAgent({
        agent_pubkey: await fakeAgentPubKey(0),
        trusted_authorities: [authority.agentPubKey],
      })
    ).resolves.toEqual([]);
  });
});
