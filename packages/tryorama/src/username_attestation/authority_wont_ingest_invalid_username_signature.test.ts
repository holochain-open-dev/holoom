import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";

test("Can attest username via remote call", async () => {
  await runScenario(async (scenario) => {
    const [_, authorityCoordinators] = await setupPlayer(scenario);
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    // Alice signs username
    const signature = await aliceCoordinators.signer.signMessage(
      Array.from(new TextEncoder().encode("whatever"))
    );

    expect(
      authorityCoordinators.usernameRegistry.ingestSignedUsername({
        username: "a_different_name",
        signature,
        signer: alice.agentPubKey,
      })
    ).rejects.toThrow();
  });
});
