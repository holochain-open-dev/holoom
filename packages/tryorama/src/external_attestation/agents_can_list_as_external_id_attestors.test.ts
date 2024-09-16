import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";

test("Agents can list as external id attestors", async () => {
  await runScenario(async (scenario) => {
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    const [bob, bobCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    await expect(
      aliceCoordinators.usernameRegistry.registerAsExternalIdAttestor(
        "some-identity-provider"
      )
    ).resolves.not.toThrow();

    await dhtSync([alice, bob], alice.cells[0].cell_id[0]);

    await expect(
      bobCoordinators.usernameRegistry.getAllExternalIdAttestors()
    ).resolves.toEqual([[alice.agentPubKey, "some-identity-provider"]]);
  });
});
