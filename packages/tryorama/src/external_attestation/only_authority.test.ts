import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { setupAuthorityAndAlice } from "../utils/setup-happ.js";
import { bindCoordinators } from "../utils/bindings.js";

test("Only authority can create ExternalIdAttestations", async () => {
  await runScenario(async (scenario) => {
    const { authority, alice } = await setupAuthorityAndAlice(scenario);

    const authorityCoordinators = bindCoordinators(authority);
    const aliceCoordinators = bindCoordinators(alice);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();
    //---------------------------------------------------------------
    console.log(
      "\n************************* START TEST ****************************\n"
    );

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
    console.log("Checked Alice cannot create external ID attestation");

    await expect(
      authorityCoordinators.usernameRegistry.createExternalIdAttestation({
        request_id: "3563",
        internal_pubkey: alice.agentPubKey,
        external_id: "abcd",
        display_name: "Alice",
      })
    ).resolves.toBeTruthy();
    console.log("Checked authority can create external ID attestation");
  });
});
