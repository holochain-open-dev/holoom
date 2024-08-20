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
} from "@holoom/types";

test("Direct user_metadata validation", async () => {
  await runScenario(async (scenario) => {
    const appBundleSource = await overrideHappBundle(await fakeAgentPubKey());
    const alice = await scenario.addPlayerWithApp(appBundleSource);
    const aliceCoordinators = bindCoordinators(alice);

    // AnyLinkableHash retypes AgentPubKey to EntryHash
    const intoEntryHash = (hash: HoloHash) =>
      hashFrom32AndType(sliceCore32(hash), "Entry");

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
