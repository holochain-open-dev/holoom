import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAliceOnly } from "../utils/setup-happ.js";
import { formatEvmSignature } from "@holoom/client";
import { privateKeyToAccount } from "viem/accounts";
import { hexToBytes } from "viem";
import { encodeHashToBase64, fakeAgentPubKey } from "@holochain/client";

test("Checks validity of evm wallet attestation", async () => {
  await runScenario(async (scenario) => {
    const { aliceCoordinators } = await setupAliceOnly(scenario);

    // Create WalletAttestation for alice at address:
    // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

    // First account of seed phrase:
    // test test test test test test test test test test test junk
    const account = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );
    const evmAddress = hexToBytes(account.address);
    expect(account.address).toBe("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");

    // Get and sign the binding message
    const message =
      await aliceCoordinators.usernameRegistry.getEvmWalletBindingMessage(
        evmAddress
      );
    const evmSignature = formatEvmSignature(
      await account.signMessage({ message })
    );

    // Genuine attestation should be accepted
    const record =
      await aliceCoordinators.usernameRegistry.attestWalletSignature({
        Evm: {
          evm_address: evmAddress,
          evm_signature: evmSignature,
        },
      });

    const prevAction = record.signed_action.hashed.hash;
    const maliciousMessage = `"Binding wallet:\n${
      account.address
    }\n\nTo Holochain public key:\n${encodeHashToBase64(
      await fakeAgentPubKey(0)
    )}\n\nCommitted after holochain action:\n${encodeHashToBase64(
      prevAction
    )}"`;
    const maliciousSignature = formatEvmSignature(
      await account.signMessage({ message: maliciousMessage })
    );

    // Malicious attestation should be rejected
    await expect(
      aliceCoordinators.usernameRegistry.attestWalletSignature({
        Evm: {
          evm_address: evmAddress,
          evm_signature: maliciousSignature,
        },
      })
    ).rejects.toThrow();
  });
});
