import { ActionHash, AppClient, Record } from "@holochain/client";
import {
  EvmSigningOffer,
  EvmU256Item,
  RecordsCoordinator,
  UsernameRegistryCoordinator,
} from "@holoom/types";
import { BytesSigner } from "./bytes-signer";

export class OfferCreator {
  private usernameRegistryCoordinator: UsernameRegistryCoordinator;
  private recordsCoordinator: RecordsCoordinator;
  constructor(
    appClient: AppClient,
    readonly bytesSigner: BytesSigner
  ) {
    this.usernameRegistryCoordinator = new UsernameRegistryCoordinator(
      appClient
    );
    this.recordsCoordinator = new RecordsCoordinator(appClient);
  }

  async createOffer(
    identifier: string,
    recipeAh: ActionHash,
    items: EvmU256Item[]
  ) {
    const offer: EvmSigningOffer = {
      recipe_ah: new Uint8Array(recipeAh),
      u256_items: items,
    };

    // Avoids source chain error: Awaiting deps
    await this.untilRecipeGossiped(offer.recipe_ah);

    const signature = await this.bytesSigner.sign_offer(offer);
    const record: Record =
      await this.usernameRegistryCoordinator.createSignedEvmSigningOffer({
        identifier,
        signed_offer: {
          signer: this.bytesSigner.address,
          signature,
          offer,
        },
      });
    console.log("Created record", record);
    return record;
  }

  private async untilRecipeGossiped(recipeAh: ActionHash) {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const record = await this.recordsCoordinator.getRecord(recipeAh);
      if (record) return;
      await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error("Recipe still not gossiped after 10s");
  }
}
