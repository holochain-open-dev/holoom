import type { AppAgentWebsocket, Record } from "@holochain/client";

import { decode } from "@msgpack/msgpack";
import { UsernameAttestation } from "./types";

export class HolochainGameIdentityClient {
  constructor(readonly appAgent: AppAgentWebsocket) {}

  async getUsername() {
    const record: Record | null = await this.appAgent.callZome({
      role_name: "game_identity",
      zome_name: "username_registry",
      fn_name: "get_username_attestation_for_agent",
      payload: this.appAgent.myPubKey,
    });
    if (!record) {
      throw new Error("No username registered");
    }
    const entry = decode(
      (record.entry as any).Present.entry
    ) as UsernameAttestation;

    return entry.username;
  }
}
