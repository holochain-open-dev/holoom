import { expect, test } from "vitest";
import { runScenario } from "@holochain/tryorama";

import { overrideHappBundle } from "../utils/setup-happ.js";
import { bindCoordinators } from "../utils/bindings.js";
import {
  fakeAgentPubKey,
  hashFrom32AndType,
  HoloHash,
  sliceCore32,
} from "@holochain/client";
import {
  ValidationRejectionDetail,
  CreateAgentMetadataLinkRejectionReason,
  ValidationError,
  IntegrityZomeIndex,
  UsernameRegistryIntegrityLinkTypeIndex,
  DeleteAgentMetadataLinkRejectionReason,
} from "@holoom/types";
import { encode } from "@msgpack/msgpack";
import { untilRecordKnown } from "../utils/gossip.js";

test("Direct user_metadata validation", async () => {
  await runScenario(async (scenario) => {
    const appBundleSource = await overrideHappBundle(await fakeAgentPubKey());
    const [alice, bob] = await scenario.addPlayersWithApps([
      { appBundleSource },
      { appBundleSource },
    ]);
    await scenario.shareAllAgents();
    const aliceCoordinators = bindCoordinators(alice);
    const bobCoordinators = bindCoordinators(bob);

    // AnyLinkableHash retypes AgentPubKey to EntryHash
    const intoEntryHash = (hash: HoloHash) =>
      hashFrom32AndType(sliceCore32(hash), "Entry");

    // Bob cannot create a metadata item for Alice's agent
    try {
      await bobCoordinators.records.createLinkRaw({
        base_address: intoEntryHash(alice.agentPubKey),
        target_address: intoEntryHash(alice.agentPubKey),
        zome_index: IntegrityZomeIndex.UsernameRegistryIntegrity,
        link_type: UsernameRegistryIntegrityLinkTypeIndex.AgentMetadata,
        tag: encode({ name: "foo", value: "bar" }),
      });
      expect.unreachable("Cannot create metadata for another user");
    } catch (err) {
      expect(ValidationError.getDetail(err)).toEqual<ValidationRejectionDetail>(
        {
          type: "CreateAgentMetadataLinkRejectionReasons",
          reasons: [
            CreateAgentMetadataLinkRejectionReason.BaseAddressMustBeOwner,
          ],
        }
      );
    }

    // Alice can create a metadata item for her agent
    const createLinkAh = await aliceCoordinators.records.createLinkRaw({
      base_address: intoEntryHash(alice.agentPubKey),
      target_address: intoEntryHash(alice.agentPubKey),
      zome_index: IntegrityZomeIndex.UsernameRegistryIntegrity,
      link_type: UsernameRegistryIntegrityLinkTypeIndex.AgentMetadata,
      tag: encode({ name: "foo", value: "bar" }),
    });

    await untilRecordKnown(createLinkAh, bobCoordinators);

    // Bob cannot delete Alice's metadata
    try {
      await bobCoordinators.records.deleteLinkRaw(createLinkAh);
      expect.unreachable("Cannot delete metadata you don't own");
    } catch (err) {
      expect(ValidationError.getDetail(err)).toEqual<ValidationRejectionDetail>(
        {
          type: "DeleteAgentMetadataLinkRejectionReasons",
          reasons: [DeleteAgentMetadataLinkRejectionReason.DeleterIsNotOwner],
        }
      );
    }

    // Alice can delete her metadata
    await expect(
      aliceCoordinators.records.deleteLinkRaw(createLinkAh)
    ).resolves.not.toThrow();

    // Cannot create badly encoded metadata
    try {
      await aliceCoordinators.records.createLinkRaw({
        base_address: intoEntryHash(alice.agentPubKey),
        target_address: intoEntryHash(alice.agentPubKey),
        zome_index: IntegrityZomeIndex.UsernameRegistryIntegrity,
        link_type: UsernameRegistryIntegrityLinkTypeIndex.AgentMetadata,
        tag: new Uint8Array([]),
      });
      expect.unreachable("Cannot create badly encoded metadata");
    } catch (err) {
      expect(ValidationError.getDetail(err)).toEqual<ValidationRejectionDetail>(
        {
          type: "CreateAgentMetadataLinkRejectionReasons",
          reasons: [CreateAgentMetadataLinkRejectionReason.BadTagSerialization],
        }
      );
    }
  });
});
