import type { AppAgentWebsocket, AppSignal } from "@holochain/client";
import {
  LocalHoloomSignal,
  ResolveEvmSignatureOverRecipeExecutionRequestPayload,
  RejectEvmSignatureOverRecipeExecutionRequestPayload,
} from "@holoom/types";
import { BytesSigner } from "./bytes-signer.js";

export type PickByType<T, K> = T extends { type: K } ? T : never;
type EvmSignatureRequested = PickByType<
  LocalHoloomSignal,
  "EvmSignatureRequested"
>;

export class EvmBytesSignerClient {
  constructor(
    readonly appAgent: AppAgentWebsocket,
    readonly bytesSigner: BytesSigner
  ) {
    appAgent.on("signal", (signal) => this.handleAppSignal(signal));
  }

  async confirmRequest(
    payload: ResolveEvmSignatureOverRecipeExecutionRequestPayload
  ): Promise<void> {
    console.log("confirmRequest", payload);
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "resolve_evm_signature_over_recipe_execution_request",
      payload,
    });
  }

  async rejectRequest(
    payload: RejectEvmSignatureOverRecipeExecutionRequestPayload
  ): Promise<void> {
    console.log("rejectRequest", payload);
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "reject_evm_signature_over_recipe_execution_request",
      payload,
    });
  }

  handleAppSignal(signal: AppSignal) {
    console.log("received signal", signal);
    if (signal.zome_name !== "username_registry") return;
    const localSignal = signal.payload as LocalHoloomSignal;
    if (localSignal.type === "EvmSignatureRequested") {
      this.handleEvmSignatureRequested(localSignal);
    }
  }

  async handleEvmSignatureRequested(signal: EvmSignatureRequested) {
    console.log("handleEvmSignatureRequested");
    try {
      const signature = await this.bytesSigner.sign(signal.u256_array);
      // Will node complain about this orphaned promise?
      this.confirmRequest({
        request_id: signal.request_id,
        requestor: signal.requestor_pubkey,
        signed_u256_array: {
          signature,
          signer: this.bytesSigner.address,
          raw: signal.u256_array,
        },
      });
    } catch (err) {
      console.error(err);
      // Will node complain about this orphaned promise?
      this.rejectRequest({
        request_id: signal.request_id,
        requestor: signal.requestor_pubkey,
        reason: unknownErrToString(err),
      });
    }
  }
}

function unknownErrToString(err: unknown) {
  if (typeof err === "string") return err;
  if (typeof err == "object") {
    if (!err) return "Unknown";
    if ("message" in err) return `${err.message}`;
  }
  return `${err}`;
}
