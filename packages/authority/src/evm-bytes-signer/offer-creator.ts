import { ActionHash, AppClient, Record } from "@holochain/client";
import {
  CreateEvmSigningOfferPayload,
  EvmSigningOffer,
  EvmU256Item,
} from "@holoom/types";
import { BytesSigner } from "./bytes-signer";

export class OfferCreator {
  constructor(
    readonly appClient: AppClient,
    readonly bytesSigner: BytesSigner
  ) {}

  async createOffer(
    identifier: string,
    recipeAh: number[],
    items: EvmU256Item[]
  ) {
    const offer: EvmSigningOffer = {
      recipe_ah: new Uint8Array(recipeAh),
      u256_items: items,
    };

    // Avoids source chain error: Awaiting deps
    await this.untilRecipeGossiped(offer.recipe_ah);

    const signature = await this.bytesSigner.sign_offer(offer);
    const payload: CreateEvmSigningOfferPayload = {
      identifier,
      signed_offer: {
        signer: this.bytesSigner.address,
        signature,
        offer,
      },
    };
    const record: Record = await this.appClient.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "create_signed_evm_signing_offer",
      payload,
    });
    console.log("Created record", record);
    const actionHash = Array.from(record.signed_action.hashed.hash);
    return actionHash;
  }

  private async untilRecipeGossiped(recipeAh: ActionHash) {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const record: Record = await this.appClient.callZome({
        role_name: "holoom",
        zome_name: "records",
        fn_name: "get_record",
        payload: recipeAh,
      });
      if (record) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Recipe still not gossiped after 10s");
  }
}
