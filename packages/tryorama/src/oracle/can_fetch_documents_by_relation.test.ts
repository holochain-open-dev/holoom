import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";

test("Can fetch documents by relation", async () => {
  await runScenario(async (scenario) => {
    const [_, authorityCoordinators] = await setupPlayer(scenario);

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
