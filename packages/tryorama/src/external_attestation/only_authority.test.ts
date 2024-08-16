import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupBundleAndAuthorityPlayer } from "../utils/setup-happ.js";
import { bindCoordinators } from "../utils/bindings.js";

test("Only authority can create ExternalIdAttestations", async () => {
  await runScenario(async (scenario) => {
    const { authority, appBundleSource } =
      await setupBundleAndAuthorityPlayer(scenario);
    const alice = await scenario.addPlayerWithApp(appBundleSource);

    const authorityCoordinators = bindCoordinators(authority);
    const aliceCoordinators = bindCoordinators(alice);

    // Alice cannot create External ID Attestation
    await expect(
      aliceCoordinators.usernameRegistry.createExternalIdAttestation({
        request_id: "3563",
        internal_pubkey: alice.agentPubKey,
        external_id: "abcd",
        display_name: "Alice",
      })
    ).rejects.toSatisfy((err: Error) =>
      err.message.includes(
        "Only the Username Registry Authority can create external ID attestations"
      )
    );

    // Authority can create External ID Attestation
    await expect(
      authorityCoordinators.usernameRegistry.createExternalIdAttestation({
        request_id: "3563",
        internal_pubkey: alice.agentPubKey,
        external_id: "abcd",
        display_name: "Alice",
      })
    ).resolves.toBeTruthy();
  });
});
