export type BoundWallet_Evm = {
  type: "evm";
  checksummedAddress: string;
};
export type BoundWallet_Solana = {
  type: "solana";
  base58Address: string;
};
export type BoundWallet = BoundWallet_Evm | BoundWallet_Solana;

export type PickByType<T, K> = T extends { type: K } ? T : never;
