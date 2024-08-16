import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { overrideHappBundle } from "../utils/setup-happ.js";
import { bindCoordinators } from "../utils/bindings.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Users can only update their own metadata", async () => {
  await runScenario(async (scenario) => {
    const appBundleSource = await overrideHappBundle(await fakeAgentPubKey());
    const [alice, bob] = await scenario.addPlayersWithApps([
      { appBundleSource },
      { appBundleSource },
    ]);
    const aliceCoordinators = bindCoordinators(alice);
    const bobCoordinators = bindCoordinators(bob);
    await scenario.shareAllAgents();

    // Alice starts with no metadata
    await expect(
      aliceCoordinators.usernameRegistry.getMetadata(alice.agentPubKey)
    ).resolves.toEqual({});

    // Bob cannot set Alice's metadata
    await expect(
      bobCoordinators.usernameRegistry.updateMetadataItem({
        agent_pubkey: alice.agentPubKey,
        name: "foo",
        value: "bar",
      })
    ).rejects.toSatisfy((err: Error) =>
      err.message.includes(
        "Only the owner can embed metadata in their link tags"
      )
    );

    // Alice sets an item
    await expect(
      aliceCoordinators.usernameRegistry.updateMetadataItem({
        agent_pubkey: alice.agentPubKey,
        name: "foo",
        value: "bar2",
      })
    ).resolves.not.toThrow();

    // Bob sees new item once gossiped
    while (true) {
      const value = await bobCoordinators.usernameRegistry.getMetadataItemValue(
        {
          agent_pubkey: alice.agentPubKey,
          name: "foo",
        }
      );
      if (value) {
        expect(value).toBe("bar2");
        break;
      }
      await new Promise((r) => setTimeout(r, 500));
    }
  });
});
