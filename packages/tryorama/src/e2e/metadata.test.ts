import { runScenario, dhtSync } from "@holochain/tryorama";
import { expect, test } from "vitest";
import { setupBundleAndAuthorityPlayer } from "../utils/setup-happ";
import { AppClient, encodeHashToBase64 } from "@holochain/client";
import { QueryService } from "@holoom/authority";
import { forMs, HoloomClient } from "@holoom/client";

test("e2e metadata", async () => {
  await runScenario(async (scenario) => {
    const { authority, appBundleSource } =
      await setupBundleAndAuthorityPlayer(scenario);
    const alice = await scenario.addPlayerWithApp(appBundleSource);
    await scenario.shareAllAgents();
    const aliceHoloomClient = new HoloomClient(alice.appWs as AppClient);
    const alicePubkeyB64 = encodeHashToBase64(alice.agentPubKey);

    // This service is is intended to be run as a sandboxed microservice, but
    // that is not a concern of this test, hence we cheat and instantiate
    // locally.
    const queryService = new QueryService(authority.appWs as AppClient);

    await expect(
      aliceHoloomClient.getMetadata("profile-picture")
    ).resolves.toBeNull();

    await expect(
      queryService.getAgentMetadata(alicePubkeyB64)
    ).resolves.toEqual({
      success: true,
      metadata: {},
    });

    await expect(
      aliceHoloomClient.setMetadata("profile-picture", "image1.jpg")
    ).resolves.not.toThrow();

    await expect(
      aliceHoloomClient.getMetadata("profile-picture")
    ).resolves.toBe("image1.jpg");

    await expect(
      aliceHoloomClient.setMetadata("location", "moon")
    ).resolves.not.toThrow();

    await expect(aliceHoloomClient.getMetadata("location")).resolves.toBe(
      "moon"
    );

    await expect(
      aliceHoloomClient.setMetadata("profile-picture", "image2.jpg")
    ).resolves.not.toThrow();

    await expect(
      aliceHoloomClient.getMetadata("profile-picture")
    ).resolves.toBe("image2.jpg");

    await expect(aliceHoloomClient.getMetadata("location")).resolves.toBe(
      "moon"
    );

    // Poll metadata until defined (gossiping)
    while (true) {
      const data = await queryService.getAgentMetadata(alicePubkeyB64);
      if (
        data.metadata.location === "moon" &&
        data.metadata["profile-picture"] === "image2.jpg"
      ) {
        break;
      }
      await forMs(500);
    }
  });
});
