import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { overrideHappBundle } from "../utils/setup-happ.js";
import { bindCoordinators } from "../utils/bindings.js";
import { fakeAgentPubKey } from "@holochain/client";
import {
  ValidationRejectionDetail,
  CreateAgentMetadataLinkRejectionReason,
  ValidationError,
} from "@holoom/types";

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

    // Alice sets an item
    await expect(
      aliceCoordinators.usernameRegistry.updateMetadataItem({
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
