import { runScenario } from "@holochain/tryorama";
import { expect, test } from "vitest";
import { setupPlayer } from "../utils/setup-happ";
import { AppClient, encodeHashToBase64 } from "@holochain/client";
import { QueryService } from "@holoom/authority";
import { forMs, HoloomClient } from "@holoom/client";
import { privateKeyToAccount } from "viem/accounts";

test("e2e evm wallet binding", async () => {
  await runScenario(async (scenario) => {
    const [authority] = await setupPlayer(scenario);
    const [alice] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    const aliceHoloomClient = new HoloomClient(
      alice.appWs as AppClient,
      authority.agentPubKey
    );
    const alicePubkeyB64 = encodeHashToBase64(alice.agentPubKey);

    // This service is is intended to be run as a sandboxed microservice, but
    // that is not a concern of this test, hence we cheat and instantiate
    // locally.
    const queryService = new QueryService(authority.appWs as AppClient);

    // Starts with no username
    await expect(aliceHoloomClient.getBoundWallets()).resolves.toEqual([]);

    await expect(queryService.getAgentWallets(alicePubkeyB64)).resolves.toEqual(
      {
        success: true,
        evm_addresses: [],
        solana_addresses: [],
      }
    );

    // Setup EVM signer in memory
    // First account of seed phrase:
    // test test test test test test test test test test test junk
    const account = privateKeyToAccount(
      "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    );

    // Get and sign the binding message
    const message = await aliceHoloomClient.getEvmWalletBindingMessage(
      account.address
    );
    const evmSignature = await account.signMessage({ message });

    // Submit the signature
    await expect(
      aliceHoloomClient.submitEvmWalletBinding(account.address, evmSignature)
    ).resolves.toBeUndefined();

    // Poll bound wallets until defined (gossiping)
    while (true) {
      const boundWallets = await aliceHoloomClient.getBoundWallets();
      if (boundWallets.length) {
        expect(boundWallets).toEqual([
          { type: "evm", checksummedAddress: account.address },
        ]);
        break;
      }
    }

    // Poll query until bound wallet gossiped
    while (true) {
      const data = await queryService.getAgentWallets(alicePubkeyB64);
      if (data.evm_addresses.length > 0) {
        expect(data).toEqual({
          success: true,
          evm_addresses: [account.address],
          solana_addresses: [],
        });
        break;
      }
      await forMs(500);
    }
  });
});
