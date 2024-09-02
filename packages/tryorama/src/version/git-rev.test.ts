import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";
import { execSync } from "node:child_process";

import { setupPlayer } from "../utils/setup-happ.js";

test("Injected git revision matches monorepo's", async () => {
  await runScenario(async (scenario) => {
    const [_, aliceCoordinators] = await setupPlayer(scenario);

    const revision = await execSync("git rev-parse HEAD").toString().trim();
    expect(/^[a-f0-9]{40}/.test(revision)).toBe(true);

    await expect(aliceCoordinators.version.gitRev()).resolves.toBe(revision);
  });
});
