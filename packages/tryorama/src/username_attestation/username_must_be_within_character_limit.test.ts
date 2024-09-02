import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Same username cannot be registered twice", async () => {
  await runScenario(async (scenario) => {
    const [_, authorityCoordinators] = await setupPlayer(scenario);

    // Authority creates an username of 5 characters
    await expect(
      authorityCoordinators.usernameRegistry.createUsernameAttestation({
        username: "abcde",
        agent: await fakeAgentPubKey(1),
      })
    ).rejects.toThrow();

    // Alice creates an username of 33 characters
    await expect(
      authorityCoordinators.usernameRegistry.createUsernameAttestation({
        username: "abcdeabcdeabcdeabcdeabcdeabcdeabc",
        agent: await fakeAgentPubKey(1),
      })
    ).rejects.toThrow();

    // Alice creates an username of 15 characters
    await expect(
      authorityCoordinators.usernameRegistry.createUsernameAttestation({
        username: "abcdeabcdeabcde",
        agent: await fakeAgentPubKey(1),
      })
    ).resolves.not.toThrow();
  });
});
