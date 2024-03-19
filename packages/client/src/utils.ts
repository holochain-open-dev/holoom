import type { Record } from "@holochain/client";

import { decode } from "@msgpack/msgpack";
import { EvmSignature } from "./types";

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

export function formatEvmSignature(hex: string): EvmSignature {
  const bytes = bytesFromPrefixedHex(hex);
  const r = new Uint8Array(bytes.slice(0, 32));
  const s = new Uint8Array(bytes.slice(32, 64));
  const v = bytes[64];
  return [r, s, v];
}

export function bytesFromPrefixedHex(hex: string) {
  if (!hex.match(/^0x([0-9a-f][0-9a-f])*$/i)) {
    throw new Error("Invalid hex string");
  }
  const result = new Uint8Array((hex.length - 2) / 2);
  let offset = 2;
  for (let i = 0; i < result.length; i++) {
    result[i] = parseInt(hex.substring(offset, offset + 2), 16);
    offset += 2;
  }
  return result;
}

const HEX_CHARACTERS = "0123456789abcdef";

export function prefixedHexFromBytes(bytes: Uint8Array): string {
  let result = "0x";
  for (let i = 0; i < bytes.length; i++) {
    const v = bytes[i];
    result += HEX_CHARACTERS[(v & 0xf0) >> 4] + HEX_CHARACTERS[v & 0x0f];
  }
  return result;
}
