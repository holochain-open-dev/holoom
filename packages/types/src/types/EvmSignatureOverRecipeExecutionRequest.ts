import { ActionHash, Signature } from "@holochain/client";
// This file was generated by [ts-rs](https://github.com/Aleph-Alpha/ts-rs). Do not edit this file manually.

export type EvmSignatureOverRecipeExecutionRequest = {
  request_id: string;
  recipe_execution_ah: ActionHash;
  signing_offer_ah: ActionHash;
};
