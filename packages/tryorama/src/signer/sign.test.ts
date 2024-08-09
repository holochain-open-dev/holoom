import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { overrideHappBundle } from "../utils/setup-happ.js";
import { bindCoordinators } from "../utils/bindings.js";
import { fakeAgentPubKey } from "@holochain/client";
import * as ed from "@noble/ed25519";
import { encode } from "@msgpack/msgpack";

test("Sign message and verify signature", async () => {
  await runScenario(async (scenario) => {
    const alice = await scenario.addPlayerWithApp(
      await overrideHappBundle(await fakeAgentPubKey())
    );
    const aliceCoordinators = bindCoordinators(alice);

    const message = new Array<number>(2048).fill(0);
    const signature = await aliceCoordinators.signer.signMessage(message);
    await expect(
      ed.verifyAsync(
        signature,
        encode(message), // signed as serialised :-/
        alice.agentPubKey.slice(3, 35) // get_raw_32()
      )
    ).resolves.toBe(true);
  });
});
