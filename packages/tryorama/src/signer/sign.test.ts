import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAliceOnly } from "../utils/setup-happ.js";
import { sha512 } from "@noble/hashes/sha512";
import * as ed from "@noble/ed25519";
import { encode } from "@msgpack/msgpack";

// Fixes CI Error: crypto.subtle or etc.sha512Async must be defined
// (I don't yet understand why this only occurs in CI)
ed.etc.sha512Async = (...m) =>
  Promise.resolve(sha512(ed.etc.concatBytes(...m)));

test("Sign message and verify signature", async () => {
  await runScenario(async (scenario) => {
    const { alice, aliceCoordinators } = await setupAliceOnly(scenario);

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
