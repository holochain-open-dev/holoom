import type { AppAgentWebsocket, AppSignal } from "@holochain/client";
import { v4 as uuidV4 } from "uuid";
import {
  ExternalIdAttestation,
  LocalHoloomSignal,
  SendExternalIdAttestationRequestPayload,
} from "@holoom/types";
import { decodeAppEntry } from "./utils";
import { PickByType } from "./types";

type ExternalIdAttested = PickByType<LocalHoloomSignal, "ExternalIdAttested">;
type ExternalIdRejected = PickByType<LocalHoloomSignal, "ExternalIdRejected">;

class RequestResolver {
  resolve!: (attestation: ExternalIdAttestation) => void;
  reject!: (reason: string) => void;
  prom = new Promise<ExternalIdAttestation>((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
  until() {
    return this.prom;
  }
}

/**
 * This client is used for obtaining `ExternalIdAttestation`s from the holoom
 * network's authority agent. It should be invoked after receiving an
 * authorization code (by callback) from the identity provider in question.
 *
 * Currently the only PKCE Authorization Code flow is supported.
 */

export class ExternalIdAttestationRequestorClient {
  constructor(readonly appAgent: AppAgentWebsocket) {
    appAgent.on("signal", (signal) => this.handleAppSignal(signal));
  }

  resolvers: { [requestId: string]: RequestResolver } = {};

  /**
   *
   * Submits sign-in flow related secrets to the holoom network's authority
   * agent, which in turn makes use of them as evidence that the user controls
   * the corresponding external web2 account. The authority subsequently
   * creates an `ExternalIdAttestation` entry to attest this is so.
   *
   * @param codeVerifier The pre-image to the PKCE challenge that was submitted
   * to the identity provider's sign-in flow
   * @param code The secret received from the identity provider on sign-in
   * callback. The holoom network's authority agent exchanges this for an
   * access token.
   * @returns The `ExternalIdAttestation` entry created by the authority
   */
  async requestExternalIdAttestation(
    codeVerifier: string,
    code: string
  ): Promise<ExternalIdAttestation> {
    const requestId = uuidV4();
    const resolver = new RequestResolver();
    this.resolvers[requestId] = resolver;

    const payload: SendExternalIdAttestationRequestPayload = {
      request_id: requestId,
      code_verifier: codeVerifier,
      code,
    };
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "send_external_id_attestation_request",
      payload,
    });

    const attestation = await resolver.until();
    return attestation;
  }

  private handleAppSignal(signal: AppSignal) {
    if (signal.zome_name !== "username_registry") return;
    const localSignal = signal.payload as LocalHoloomSignal;
    switch (localSignal.type) {
      case "ExternalIdAttested": {
        this.handleExternalIdAttested(localSignal);
        break;
      }
      case "ExternalIdRejected": {
        this.handleExternalIdRejected(localSignal);
        break;
      }
    }
  }

  private handleExternalIdAttested(signal: ExternalIdAttested) {
    try {
      const attestation = decodeAppEntry<ExternalIdAttestation>(signal.record);

      const resolver = this.resolvers[signal.request_id];
      if (!resolver) {
        console.error(`Resolver for ${signal.request_id} not found`);
        return;
      }
      resolver.resolve(attestation);
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

  private handleExternalIdRejected(signal: ExternalIdRejected) {
    const resolver = this.resolvers[signal.request_id];
    if (!resolver) {
      console.error(`Resolver for ${signal.request_id} not found`);
      return;
    }
    resolver.reject(signal.reason);
  }
}
