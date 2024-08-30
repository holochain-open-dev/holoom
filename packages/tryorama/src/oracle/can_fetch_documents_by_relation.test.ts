import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAuthorityOnly } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Can fetch documents by relation", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators } = await setupAuthorityOnly(scenario);

    await expect(
      authorityCoordinators.usernameRegistry.createOracleDocument({
        name: "foo/1",
        json_data: JSON.stringify({ type: "foo", value: 1 }),
      })
    ).resolves.not.toThrow();

    await expect(
      authorityCoordinators.usernameRegistry.createOracleDocument({
        name: "foo/2",
        json_data: JSON.stringify({ type: "foo", value: 2 }),
      })
    ).resolves.not.toThrow();

    await expect(
      authorityCoordinators.usernameRegistry.relateOracleDocument({
        name: "foo/1",
        relation: "foo",
      })
    ).resolves.not.toThrow();

    await expect(
      authorityCoordinators.usernameRegistry.relateOracleDocument({
        name: "foo/2",
        relation: "foo",
      })
    ).resolves.not.toThrow();

    await expect(
      authorityCoordinators.usernameRegistry.getRelatedOracleDocumentNames(
        "foo"
      )
    ).resolves.toEqual(["foo/1", "foo/2"]);
  });
});
