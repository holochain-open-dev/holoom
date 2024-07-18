import type {
  ActionHash,
  AppAgentWebsocket,
  AppSignal,
} from "@holochain/client";
import { v4 as uuidV4 } from "uuid";
import {
  EvmSignatureOverRecipeExecutionRequest,
  LocalHoloomSignal,
  SignedEvmU256Array,
} from "@holoom/types";
import { PickByType } from "./types";

type EvmSignatureProvided = PickByType<
  LocalHoloomSignal,
  "EvmSignatureProvided"
>;
type EvmSignatureRequestRejected = PickByType<
  LocalHoloomSignal,
  "EvmSignatureRequestRejected"
>;

class RequestResolver {
  resolve!: (signedU256Array: SignedEvmU256Array) => void;
  reject!: (reason: string) => void;
  prom = new Promise<SignedEvmU256Array>((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
  until() {
    return this.prom;
  }
}

export class EvmBytesSignatureRequestorClient {
  constructor(readonly appAgent: AppAgentWebsocket) {
    appAgent.on("signal", (signal) => this.handleAppSignal(signal));
  }

  resolvers: { [requestId: string]: RequestResolver } = {};

  async requestEvmSignature(arg: {
    recipeExecutionAh: ActionHash;
    signingOfferAh: ActionHash;
  }): Promise<SignedEvmU256Array> {
    const requestId = uuidV4();
    const resolver = new RequestResolver();
    this.resolvers[requestId] = resolver;

    const payload: EvmSignatureOverRecipeExecutionRequest = {
      request_id: requestId,
      recipe_execution_ah: arg.recipeExecutionAh,
      signing_offer_ah: arg.signingOfferAh,
    };
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "send_request_for_evm_signature_over_recipe_execution",
      payload,
    });

    const signedEvmU256Array = await resolver.until();
    return signedEvmU256Array;
  }

  private handleAppSignal(signal: AppSignal) {
    if (signal.zome_name !== "username_registry") return;
    const localSignal = signal.payload as LocalHoloomSignal;
    switch (localSignal.type) {
      case "EvmSignatureProvided": {
        this.handleEvmSignatureProvided(localSignal);
        break;
      }
      case "EvmSignatureRequestRejected": {
        this.handleEvmSignatureRequestRejected(localSignal);
        break;
      }
    }
  }

  private handleEvmSignatureProvided(signal: EvmSignatureProvided) {
    try {
      const resolver = this.resolvers[signal.request_id];
      if (!resolver) {
        console.error(`Resolver for ${signal.request_id} not found`);
        return;
      }
      resolver.resolve(signal.signed_u256_array);
    } catch (err) {
      console.error(
        "ExternalIdAttestationRequestorClient failed to decode ExternalIdAttestation"
      );
      const resolver = this.resolvers[signal.request_id];
      if (!resolver) {
        console.error(`Resolver for ${signal.request_id} not found`);
        return;
      }
      resolver.reject("Failed to decode ExternalIdAttestation");
    }
  }

  private handleEvmSignatureRequestRejected(
    signal: EvmSignatureRequestRejected
  ) {
    const resolver = this.resolvers[signal.request_id];
    if (!resolver) {
      console.error(`Resolver for ${signal.request_id} not found`);
      return;
    }
    resolver.reject(signal.reason);
  }
}
