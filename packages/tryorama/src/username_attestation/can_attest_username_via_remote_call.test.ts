import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupAuthorityAndAlice } from "../utils/setup-happ.js";
import { decodeAppEntry, UsernameAttestation } from "@holoom/client";

test("Can attest username via remote call", async () => {
  await runScenario(async (scenario) => {
    const { authorityCoordinators, aliceCoordinators, authority, alice } =
      await setupAuthorityAndAlice(scenario);
    await scenario.shareAllAgents();

    // Alice requests creation of a UsernameAttestation
    const record =
      await aliceCoordinators.usernameRegistry.signUsernameToAttest(
        "asodijsadvjsadlkj"
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
