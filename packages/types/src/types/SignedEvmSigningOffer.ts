// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.
import type { EvmSigningOffer } from "./EvmSigningOffer";

export type SignedEvmSigningOffer = {
  signer: Uint8Array;
  signature: [Uint8Array, Uint8Array, number];
  offer: EvmSigningOffer;
};
