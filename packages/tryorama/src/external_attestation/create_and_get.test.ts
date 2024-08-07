import { assert, test } from "vitest";
import { fakeAgentPubKey, HoloHash, HoloHashB64, Record } from "@holochain/client"
import { runScenario, pause, CallableCell, dhtSync } from '@holochain/tryorama';
//import { decode } from '@msgpack/msgpack';

import {  create_attestation } from './common.js';
import { ExternalIdAttestation  } from "../../../types/src/types";

test('TEST CASE 1, all can get get external_id_attestations', async () => {
  await runScenario(async scenario => {
    // Construct proper paths for your app.
    // This assumes app bundle created by the `hc app pack` command.
    const testAppPath = process.cwd() + '/../../workdir/holoom.happ';

    // Set up the app to be installed 
    const appSource_alice = { appBundleSource: { path: testAppPath }}
    const appSource_bob = { appBundleSource: { path: testAppPath }}

    // Add 2 players with the test app to the Scenario. The returned players
    // can be destructured.
    const [alice,bob] = await scenario.addPlayersWithApps([appSource_alice,appSource_bob]);

    // Shortcut peer discovery through gossip and register all agents in every
    // conductor of the scenario.
    await scenario.shareAllAgents();
    //---------------------------------------------------------------
    console.log("\n************************* START TEST ****************************\n")
    
    console.log("\nAlice creates an external attestation")

    const fakepubkey = await fakeAgentPubKey()
    let input:ExternalIdAttestation = {
      request_id: "3563",
      internal_pubkey: fakepubkey,
      external_id: "abcd",
      display_name: "Alice"
    }
    const response: Record = await create_attestation(alice.cells[0], input);
    console.log(response)//decode((record.entry as any).Present.entry as any))
    assert.ok(response);
    
  });
})

