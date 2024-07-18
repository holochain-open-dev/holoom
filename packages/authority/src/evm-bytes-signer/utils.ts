import { Hex, hexToBytes } from "viem";

export function formatEvmSignature(hex: Hex): [Uint8Array, Uint8Array, number] {
  const bytes = hexToBytes(hex);
  const r = new Uint8Array(bytes.slice(0, 32));
  const s = new Uint8Array(bytes.slice(32, 64));
  const v = bytes[64];
  return [r, s, v];
}
