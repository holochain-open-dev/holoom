import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { decodeAppEntry, UsernameAttestation } from "@holoom/client";

test("Can attest username via remote call", async () => {
  await runScenario(async (scenario) => {
    const [authority, authorityCoordinators] = await setupPlayer(scenario);
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    // Open authority to attestation requests
    await expect(
      authorityCoordinators.usernameRegistry.usernameAuthoritySetup()
    ).resolves.not.toThrow();

    // Alice requests creation of a UsernameAttestation
    const record =
      await aliceCoordinators.usernameRegistry.signUsernameAndRequestAttestation(
        {
          username: "asodijsadvjsadlkj",
          authority: authority.agentPubKey,
        }
      );

    await dhtSync([authority, alice], authority.cells[0].cell_id[0]);

    // UsernameAttestation has been created
    await expect(
      authorityCoordinators.usernameRegistry.getUsernameAttestation(
        record.signed_action.hashed.hash
      )
    ).resolves.toEqual(record);
    const entry = decodeAppEntry<UsernameAttestation>(record);
    expect(entry.agent).not.toEqual(authority.agentPubKey);
    expect(entry.agent).toEqual(alice.agentPubKey);
  });
});
