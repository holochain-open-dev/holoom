import type { AppSignal, AppClient } from "@holochain/client";
import { LocalHoloomSignal, UsernameRegistryCoordinator } from "@holoom/types";
import { BytesSigner } from "./bytes-signer.js";

export type PickByType<T, K> = T extends { type: K } ? T : never;
type EvmSignatureRequested = PickByType<
  LocalHoloomSignal,
  "EvmSignatureRequested"
>;

export class EvmBytesSignerClient {
  private usernameRegistryCoordinator: UsernameRegistryCoordinator;
  private unsubscribe: () => void;
  constructor(
    appClient: AppClient,
    readonly bytesSigner: BytesSigner
  ) {
    this.usernameRegistryCoordinator = new UsernameRegistryCoordinator(
      appClient
    );
    this.unsubscribe = appClient.on("signal", (signal) =>
      this.handleAppSignal(signal)
    );
  }

  destroy() {
    this.unsubscribe();
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
      const signature = await this.bytesSigner.sign_u256_array(
        signal.u256_array
      );
      // Will node complain about this orphaned promise?
      console.log(`Signed request ${signal.request_id}`);
      this.usernameRegistryCoordinator.resolveEvmSignatureOverRecipeExecutionRequest(
        {
          request_id: signal.request_id,
          requestor: signal.requestor_pubkey,
          signed_u256_array: {
            signature,
            signer: this.bytesSigner.address,
            raw: signal.u256_array,
          },
        }
      );
    } catch (err) {
      console.error(`Rejected request ${signal.request_id}`, err);
      // Will node complain about this orphaned promise?
      this.usernameRegistryCoordinator.rejectEvmSignatureOverRecipeExecutionRequest(
        {
          request_id: signal.request_id,
          requestor: signal.requestor_pubkey,
          reason: unknownErrToString(err),
        }
      );
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
