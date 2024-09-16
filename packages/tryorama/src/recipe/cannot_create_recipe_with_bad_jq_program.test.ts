import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";

test("Cannot create recipe with bad jq program", async () => {
  await runScenario(async (scenario) => {
    const [_, authorityCoordinators] = await setupPlayer(scenario);

    await expect(
      authorityCoordinators.usernameRegistry.createRecipe({
        trusted_authors: [await fakeAgentPubKey(0)],
        arguments: [],
        instructions: [
          [
            "$return",
            {
              type: "Jq",
              input_var_names: {
                type: "List",
                var_names: [],
              },
              program: "bad syntax",
            },
          ],
        ],
      })
    ).rejects.toSatisfy((err: Error) =>
      err.message.includes("jq program compilation failed with error(s):")
    );
  });
});
