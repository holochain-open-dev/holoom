import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";

test("Agents can list as publishers", async () => {
  await runScenario(async (scenario) => {
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    const [bob, bobCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    // Authority creates a external_id Attestation
    await expect(
      aliceCoordinators.usernameRegistry.registerAsPublisher("some-topic")
    ).resolves.not.toThrow();

    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    // Authority gets the external_id Attestation
    await expect(
      bobCoordinators.usernameRegistry.getAllPublishers()
    ).resolves.toEqual([[alice.agentPubKey, "some-topic"]]);
  });
});
