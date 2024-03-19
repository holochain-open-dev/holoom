import type { Record } from "@holochain/client";

import { decode } from "@msgpack/msgpack";
import { EvmSignature } from "./types";
import { Hex, hexToBytes } from "viem";

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

export function formatEvmSignature(hex: Hex): EvmSignature {
  const bytes = hexToBytes(hex);
  const r = new Uint8Array(bytes.slice(0, 32));
  const s = new Uint8Array(bytes.slice(32, 64));
  const v = bytes[64];
  return [r, s, v];
}
