import type { AppSignal, AppClient } from "@holochain/client";
import { LocalHoloomSignal, UsernameRegistryCoordinator } from "@holoom/types";
import { AccessTokenAssessor } from "./access-token-assessor.js";

type PickByType<T, K> = T extends { type: K } ? T : never;
type ExternalIdAttestationRequested = PickByType<
  LocalHoloomSignal,
  "ExternalIdAttestationRequested"
>;

/**
 * ```mermaid
 * sequenceDiagram
 *  participant H as Holochain
 *  actor A as Authority
 *  participant T as TokenAssessor
 *  H->>A: Signal (ExternalIdAttestationRequested)
 *  A->>T: exchangeAccessToken (CodeVerifier, Code)
 *  T-->>A: AccessToken
 *  A->>T: fetchUserInfo (AccessToken)
 *  T-->>A: UserInfo (ExternalId, DisplayName)
 *  A->>H: Confirm Request (ConfirmIdRequestPayload)
 * ```
 */
export class ExternalIdAttestorClient {
  private usernameRegistryCoordinator: UsernameRegistryCoordinator;
  private unsubscribe: () => void;
  constructor(
    appClient: AppClient,
    readonly accessTokenAssessor: AccessTokenAssessor
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
    if (localSignal.type === "ExternalIdAttestationRequested") {
      this.handleExternalIdAttestationRequested(localSignal);
    }
  }

  async handleExternalIdAttestationRequested(
    signal: ExternalIdAttestationRequested
  ) {
    console.log("handleExternalIdAttestationRequested");
    try {
      const accessToken = await this.accessTokenAssessor.exchangeAccessToken(
        signal.code_verifier,
        signal.code
      );
      const { externalId, displayName } =
        await this.accessTokenAssessor.fetchUserInfo(accessToken);
      // Will node complain about this orphaned promise?
      console.log(`Confirmed request ${signal.request_id}`);
      this.usernameRegistryCoordinator.confirmExternalIdRequest({
        request_id: signal.request_id,
        requestor: signal.requestor_pubkey,
        external_id: externalId,
        display_name: displayName,
      });
    } catch (err) {
      console.error(`Rejected request ${signal.request_id}`, err);
      // Will node complain about this orphaned promise?
      this.usernameRegistryCoordinator.rejectExternalIdRequest({
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
