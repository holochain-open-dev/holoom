import { runScenario } from "@holochain/tryorama";
import { expect, test } from "vitest";
import { setupAuthorityAndAlice } from "../utils/setup-happ";
import { AppClient, encodeHashToBase64 } from "@holochain/client";
import { QueryService, UsernameRegistryResponse } from "@holoom/authority";
import { HoloomClient } from "@holoom/client";

test("e2e username", async () => {
  await runScenario(async (scenario) => {
    const { authority, alice } = await setupAuthorityAndAlice(scenario);
    await scenario.shareAllAgents();
    const aliceHoloomClient = new HoloomClient(alice.appWs as AppClient);
    const alicePubkeyB64 = encodeHashToBase64(alice.agentPubKey);

    // This service is is intended to be run as a sandboxed microservice, but
    // that is not a concern of this test, hence we cheat and instantiate
    // locally.
    const queryService = new QueryService(authority.appWs as AppClient);

    // Starts with no username
    await expect(aliceHoloomClient.getUsername()).resolves.toBeNull();

    await expect(queryService.getUsernameRegistry()).resolves.toEqual({
      success: true,
      items: [],
    });

    // First register succeeds
    await expect(
      aliceHoloomClient.registerUsername("test1234")
    ).resolves.not.toThrow();

    // Poll username until defined (gossiping)
    while (true) {
      const result = await aliceHoloomClient.getUsername();
      if (result) {
        expect(result).toBe("test1234");
        break;
      }
    }

    // Second registration fails
    await expect(
      aliceHoloomClient.registerUsername("test1234")
    ).rejects.toSatisfy((error: Error) =>
      error.message.includes("InvalidCommit")
    );

    await expect(queryService.getUsernameRegistry()).resolves.toSatisfy(
      (data: UsernameRegistryResponse) =>
        data.items.length === 1 && data.items[0].username === "test1234"
    );
  });
});
