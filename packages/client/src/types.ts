import { AgentPubKey } from "@holochain/client";

export interface UsernameAttestation {
  agent: AgentPubKey;
  username: string;
}
