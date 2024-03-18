import type { AppAgentWebsocket } from "@holochain/client";

import { UsernameAttestation } from "./types";
import { decodeAppEntry } from "./utils";

export class HolochainGameIdentityClient {
  constructor(readonly appAgent: AppAgentWebsocket) {}

  async getUsername(): Promise<string | null> {
    const record = await this.appAgent.callZome({
      role_name: "game_identity",
      zome_name: "username_registry",
      fn_name: "get_username_attestation_for_agent",
      payload: this.appAgent.myPubKey,
    });
    if (!record) {
      return null;
    }
    const entry = decodeAppEntry<UsernameAttestation>(record);

    return entry.username;
  }

  async registerUsername(username: string) {
    await this.appAgent.callZome({
      role_name: "game_identity",
      zome_name: "username_registry",
      fn_name: "sign_username_to_attest",
      payload: username,
    });
  }
}
