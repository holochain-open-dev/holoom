import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";

test("Users can only update their own metadata", async () => {
  await runScenario(async (scenario) => {
    const [authority, authorityCoordinators] = await setupPlayer(scenario);
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    // Alice starts with no metadata
    await expect(
      aliceCoordinators.usernameRegistry.getMetadata(alice.agentPubKey)
    ).resolves.toEqual({});

    // Authority cannot set Alice's metadata
    await expect(
      authorityCoordinators.usernameRegistry.updateMetadataItem({
        agent_pubkey: alice.agentPubKey,
        name: "foo",
        value: "bar",
      })
    ).rejects.toThrow();

    // Alice sets an item
    await expect(
      aliceCoordinators.usernameRegistry.updateMetadataItem({
        agent_pubkey: alice.agentPubKey,
        name: "foo",
        value: "bar2",
      })
    ).resolves.not.toThrow();

    await dhtSync([authority, alice], authority.cells[0].cell_id[0]);

    // Authority sees new item
    await expect(
      authorityCoordinators.usernameRegistry.getMetadataItemValue({
        agent_pubkey: alice.agentPubKey,
        name: "foo",
      })
    ).resolves.toEqual("bar2");
  });
});
