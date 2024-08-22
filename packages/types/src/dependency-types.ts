// typeshare isn't able to generate types outside scope of the source code
// being parsed. Instead, we hand-author them here. We don't currently have a
// strategy for ensuring that these types stay in sync with the external rust
// crates that they represent types from.

import {
  ActionHash,
  AgentPubKey,
  Warrant as WarrantProof,
} from "@holochain/client";

// Type alias for `alloy_primitives::Address`
export type EthAddress = Uint8Array;

// (I don't know why these aren't exported from @holochain/client)

export type EntryDefIndex = number;

export type SerializedBytes = Uint8Array;
export interface HighestObserved {
  action_seq: number;
  hash: ActionHash[];
}

export interface ChainHead {
  action_seq: number;
  hash: ActionHash;
}

export interface ChainFork {
  fork_seq: number;
  first_action: ActionHash;
  second_action: ActionHash;
}

export type ChainStatus =
  | "Empty"
  | { Valid: ChainHead }
  | { Forked: ChainFork }
  | { Invalid: ChainHead };

export interface Warrant {
  proof: WarrantProof;
  author: AgentPubKey;
  timestamp: Date;
}

export interface AgentActivity {
  valid_activity: [number, ActionHash][];
  rejected_activity: [number, ActionHash][];
  status: ChainStatus;
  highest_observed: HighestObserved;
  warrants: Warrant;
}
