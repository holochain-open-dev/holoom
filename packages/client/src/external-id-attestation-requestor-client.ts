import type { AppAgentWebsocket, AppSignal } from "@holochain/client";
import { v4 as uuidV4 } from "uuid";
import {
  ExternalIdAttestation,
  ExternalIdAttested,
  ExternalIdRejected,
  LocalHoloomSignal,
  SendExternalIdAttestationRequestPayload,
} from "./types";
import { decodeAppEntry } from "./utils";

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

export class ExternalIdAttestationRequestorClient {
  constructor(readonly appAgent: AppAgentWebsocket) {
    appAgent.on("signal", (signal) => this.handleAppSignal(signal));
  }

  resolvers: { [requestId: string]: RequestResolver } = {};

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

  handleAppSignal(signal: AppSignal) {
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

  handleExternalIdAttested(signal: ExternalIdAttested) {
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

  handleExternalIdRejected(signal: ExternalIdRejected) {
    const resolver = this.resolvers[signal.request_id];
    if (!resolver) {
      console.error(`Resolver for ${signal.request_id} not found`);
      return;
    }
    resolver.reject(signal.reason);
  }
}
