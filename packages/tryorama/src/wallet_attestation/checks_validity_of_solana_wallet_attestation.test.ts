import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { encodeHashToBase64, fakeAgentPubKey } from "@holochain/client";
import b58 from "bs58";
import * as ed from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";

// Fixes CI Error: crypto.subtle or etc.sha512Async must be defined
// (I don't yet understand why this only occurs in CI)
ed.etc.sha512Async = (...m) =>
  Promise.resolve(sha512(ed.etc.concatBytes(...m)));

test("Checks validity of solana wallet attestation", async () => {
  await runScenario(async (scenario) => {
    const [_, aliceCoordinators] = await setupPlayer(scenario);

    // Create WalletAttestation for alice at address:
    // oeYf6KAJkLYhBuR8CiGc6L4D4Xtfepr85fuDgA9kq96

    // First account of seed phrase:
    // test test test test test test test test test test test junk
    const privateKey = b58
      .decode(
        "4Cfc4TJ6dsWwLcw8aJ5uhx7UJKPR5VGXTu2iJr5bVRoTDsxzb6qfJrzR5HNhBcwGwsXqGeHzDR3eUWLr7MRnska8"
      )
      // Solana appends pubkey on to end of private key
      .slice(0, 32);

    const solanaAddress = b58.decode(
      "oeYf6KAJkLYhBuR8CiGc6L4D4Xtfepr85fuDgA9kq96"
    );
    expect(await ed.getPublicKeyAsync(privateKey)).toEqual(solanaAddress);

    // Get and sign the binding message
    const message =
      await aliceCoordinators.usernameRegistry.getSolanaWalletBindingMessage(
        solanaAddress
      );
    const solanaSignature = await ed.signAsync(
      new TextEncoder().encode(message),
      privateKey
    );

    // Genuine attestation should be accepted
    const record =
      await aliceCoordinators.usernameRegistry.attestWalletSignature({
        Solana: {
          solana_address: solanaAddress,
          solana_signature: Array.from(solanaSignature),
        },
      });

    const prevAction = record.signed_action.hashed.hash;
    const maliciousMessage = `"Binding wallet:\n${b58.encode(
      solanaAddress
    )}\n\nTo Holochain public key:\n${encodeHashToBase64(
      await fakeAgentPubKey(0)
    )}\n\nCommitted after holochain action:\n${encodeHashToBase64(
      prevAction
    )}"`;
    const maliciousSignature = await ed.signAsync(
      new TextEncoder().encode(maliciousMessage),
      privateKey
    );

    // Malicious attestation should be rejected
    await expect(
      aliceCoordinators.usernameRegistry.attestWalletSignature({
        Solana: {
          solana_address: solanaAddress,
          solana_signature: Array.from(maliciousSignature),
        },
      })
    ).rejects.toThrow();
  });
});
