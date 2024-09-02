import { expect, test } from "vitest";
import { dhtSync, runScenario } from "@holochain/tryorama";

import { setupPlayer } from "../utils/setup-happ.js";
import { fakeAgentPubKey } from "@holochain/client";
import { decodeAppEntry, UsernameAttestation } from "@holoom/client";

test("All can get username attestation for agent", async () => {
  await runScenario(async (scenario) => {
    const [authority, authorityCoordinators] = await setupPlayer(scenario);
    const [alice, aliceCoordinators] = await setupPlayer(scenario);
    await scenario.shareAllAgents();

    // Authority's complete list of attestations initially empty
    await expect(
      authorityCoordinators.usernameRegistry.getAllAuthoredUsernameAttestations()
    ).resolves.toEqual([]);

    // Authority creates a UsernameAttestation
    await authorityCoordinators.usernameRegistry.createUsernameAttestation({
      username: "username1",
      agent: await fakeAgentPubKey(1),
    });

    // Authority gets the UsernameAttestation
    const record1 =
      await authorityCoordinators.usernameRegistry.getUsernameAttestationForAgent(
        {
          agent: await fakeAgentPubKey(1),
          trusted_authorities: [authority.agentPubKey],
        }
      );
    const entry1 = decodeAppEntry<UsernameAttestation>(record1);
    expect(entry1).toEqual({
      username: "username1",
      agent: await fakeAgentPubKey(1),
    });

    await dhtSync([authority, alice], authority.cells[0].cell_id[0]);

    // Alice gets the UsernameAttestation
    const record2 =
      await aliceCoordinators.usernameRegistry.getUsernameAttestationForAgent({
        agent: await fakeAgentPubKey(1),
        trusted_authorities: [authority.agentPubKey],
      });
    const entry2 = decodeAppEntry<UsernameAttestation>(record2);
    expect(entry2).toEqual({
      username: "username1",
      agent: await fakeAgentPubKey(1),
    });

    // Authority can see the attestation in their complete list
    await expect(
      authorityCoordinators.usernameRegistry.getAllAuthoredUsernameAttestations()
    ).resolves.toEqual([record2]);
  });
});
