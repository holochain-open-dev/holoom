import { AgentPubKey, encodeHashToBase64 } from "@holochain/client";
import { BoundCoordinators } from "./bindings";
import { untilMsLater } from "./time";

export async function untilCoordinatorsReady(
  coordinators: BoundCoordinators,
  agentPubkey: AgentPubKey
) {
  while (true) {
    try {
      const status = await coordinators.records.getChainStatus(agentPubkey);
      const record = await coordinators.records.getRecord(
        status.highest_observed.hash[0]
      );
      if (!record) {
        throw new Error(
          `Chain head record not found for ${encodeHashToBase64(agentPubkey)}`
        );
      }
      break;
    } catch (err) {
      console.error(err);
      await untilMsLater(500);
    }
  }
}
