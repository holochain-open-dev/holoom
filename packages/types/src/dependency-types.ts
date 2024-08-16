// typeshare isn't able to generate types outside scope of the source code
// being parsed. Instead, we hand-author them here. We don't currently have a
// strategy for ensuring that these types stay in sync with the external rust
// crates that they represent types from.

export type EthAddress = Uint8Array;
