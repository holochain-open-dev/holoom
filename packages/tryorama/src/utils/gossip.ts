import { ActionHash, encodeHashToBase64 } from "@holochain/client";
import { BoundCoordinators } from "./bindings";
import { untilMsLater } from "./time";

export async function untilRecordKnown(
  actionHash: ActionHash,
  playerCoordinators: BoundCoordinators,
  delay = 500,
  timeout = 10_000
) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const record = await playerCoordinators.bare.getRecord(actionHash);
    if (record) return;
    await untilMsLater(delay);
  }
  throw new Error(
    `${encodeHashToBase64(actionHash)} not gossiped after ${timeout}ms`
  );
}
