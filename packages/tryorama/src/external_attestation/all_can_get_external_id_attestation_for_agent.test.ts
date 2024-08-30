import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupAuthorityAndAlice } from "../utils/setup-happ.js";
import { decodeAppEntry, ExternalIdAttestation } from "@holoom/client";

test("All can get external id attestation for agent", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators, authority, alice } =
      await setupAuthorityAndAlice(scenario);
    await scenario.shareAllAgents();

    // Authority's complete list of attestations initially empty
    await expect(
      authorityCoordinators.usernameRegistry.getAllExternalIdAhs()
    ).resolves.toEqual([]);

    // Authority creates an external_id Attestation
    await authorityCoordinators.usernameRegistry.createExternalIdAttestation({
      request_id: "1234",
      internal_pubkey: alice.agentPubKey,
      external_id: "4546",
      display_name: "alice",
    });

    // Authority gets the external_id Attestation
    const record1 =
      await authorityCoordinators.usernameRegistry.getAttestationForExternalId(
        "4546"
      );
    const entry1 = decodeAppEntry<ExternalIdAttestation>(record1);
    expect(entry1.external_id).toBe("4546");
    expect(entry1.internal_pubkey).toEqual(alice.agentPubKey);

    await dhtSync([authority, alice], authority.cells[0].cell_id[0]);

    // Alice gets the external_id Attestation
    const records =
      await authorityCoordinators.usernameRegistry.getExternalIdAttestationsForAgent(
        alice.agentPubKey
      );
    expect(records.length).toBe(1);
    const entry2 = decodeAppEntry<ExternalIdAttestation>(records[0]);
    expect(entry2.external_id).toBe("4546");
    expect(entry2.internal_pubkey).toEqual(alice.agentPubKey);

    // Authority can see the attestation in their complete list
    await expect(
      authorityCoordinators.usernameRegistry.getAllExternalIdAhs()
    ).resolves.toEqual([record1.signed_action.hashed.hash]);
  });
});
