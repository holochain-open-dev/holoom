import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAuthorityOnly } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Same username cannot be registered twice", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators } = await setupAuthorityOnly(scenario);

    // Authority creates an UsernameAttestation
    await expect(
      authorityCoordinators.usernameRegistry.createUsernameAttestation({
        username: "a_cool_guy",
        agent: await fakeAgentPubKey(0),
      })
    ).resolves.not.toThrow();

    // Authority creates a UsernameAttestation with an identical username
    await expect(
      authorityCoordinators.usernameRegistry.createUsernameAttestation({
        username: "a_cool_guy",
        agent: await fakeAgentPubKey(1),
      })
    ).rejects.toThrow();

    // Authority creates a UsernameAttestation with a different username
    await expect(
      authorityCoordinators.usernameRegistry.createUsernameAttestation({
        username: "a_cool_guy2",
        agent: await fakeAgentPubKey(2),
      })
    ).resolves.not.toThrow();
  });
});
