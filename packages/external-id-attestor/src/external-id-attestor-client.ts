import type { AppAgentWebsocket, AppSignal } from "@holochain/client";
import {
  ConfirmExternalIdRequestPayload,
  LocalHoloomSignal,
  ExternalIdAttestationRequested,
  RejectExternalIdRequestPayload,
} from "./types.js";
import { AccessTokenAssessor } from "./access-token-assessor.js";

export class ExternalIdAttestorClient {
  constructor(
    readonly appAgent: AppAgentWebsocket,
    readonly accessTokenAssessor: AccessTokenAssessor
  ) {
    appAgent.on("signal", (signal) => this.handleAppSignal(signal));
  }

  async confirmRequest(
    payload: ConfirmExternalIdRequestPayload
  ): Promise<void> {
    console.log("confirmRequest", payload);
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "confirm_external_id_request",
      payload,
    });
  }

  async rejectRequest(payload: RejectExternalIdRequestPayload): Promise<void> {
    console.log("rejectRequest", payload);
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "reject_external_id_request",
      payload,
    });
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
      this.confirmRequest({
        request_id: signal.request_id,
        requestor: signal.requestor_pubkey,
        external_id: externalId,
        display_name: displayName,
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
