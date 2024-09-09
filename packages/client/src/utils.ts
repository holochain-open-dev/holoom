import type { Record } from "@holochain/client";
import { convertBuffersToUint8Arrays } from "@holoom/types";

import { decode } from "@msgpack/msgpack";
import { bytesToHex, Hex, hexToBytes } from "viem";

export function decodeAppEntry<T>(record: Record): T {
  if (!("Present" in record.entry)) {
    throw new Error("Empty Record");
  }
  if (record.entry.Present.entry_type != "App") {
    throw new Error(
      `Expected 'App' entry but found '${record.entry.Present.entry_type}'`
    );
  }
  return convertBuffersToUint8Arrays(decode(record.entry.Present.entry)) as T;
}

export function formatEvmSignature(hex: Hex): [Uint8Array, Uint8Array, number] {
  const bytes = hexToBytes(hex);
  const r = new Uint8Array(bytes.slice(0, 32));
  const s = new Uint8Array(bytes.slice(32, 64));
  const v = bytes[64];
  return [r, s, v];
}

export function flattenEvmSignatureToHex([r, s, v]: [
  Uint8Array,
  Uint8Array,
  number,
]): Hex {
  return bytesToHex(new Uint8Array([...r, ...s, v]));
}

export function forMs(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function retryUntilIf<T>(
  action: () => Promise<T>,
  timeout: number,
  retryDelay: number,
  predicate: (err: Error) => boolean
): Promise<T> {
  type Outcome = { timedOut: true } | { timedOut: false; result: T };
  const loop = async (): Promise<Outcome> => {
    const deadline = Date.now() + timeout;
    while (Date.now() < deadline) {
      try {
        const result = await action();
        return { timedOut: false, result };
      } catch (err) {
        if (err instanceof Error && predicate(err)) {
          await forMs(retryDelay);
        } else {
          throw err;
        }
      }
    }
    return { timedOut: true };
  };
  const outcome = await Promise.race([
    loop(),
    forMs(timeout).then((): Outcome => ({ timedOut: true })),
  ]);
  if (outcome.timedOut) throw new Error("Timed out");
  return outcome.result;
}
