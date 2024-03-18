import type { Record } from "@holochain/client";

import { decode } from "@msgpack/msgpack";

export function decodeAppEntry<T>(record: Record): T {
  if (!("Present" in record.entry)) {
    throw new Error("Empty Record");
  }
  if (record.entry.Present.entry_type != "App") {
    throw new Error(
      `Expected 'App' entry but found '${record.entry.Present.entry_type}'`
    );
  }
  return decode(record.entry.Present.entry) as T;
}
