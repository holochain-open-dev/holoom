export enum UsernameRegistryIntegrityEntryTypeIndex {
  UsernameAttestation = 0,
  WalletAttestation = 1,
  ExternalIdAttestation = 2,
  OracleDocument = 3,
  Recipe = 4,
  RecipeExecution = 5,
  SignedEvmSigningOffer = 6,
}

export enum UsernameRegistryIntegrityLinkTypeIndex {
  AgentToUsernameAttestations = 0,
  AgentMetadata = 1,
  AgentToWalletAttestations = 2,
  AgentToExternalIdAttestation = 3,
  ExternalIdToAttestation = 4,
  NameToOracleDocument = 5,
  RelateOracleDocumentName = 6,
  NameToRecipe = 7,
  NameToSigningOffer = 8,
  EvmAddressToSigningOffer = 9,
}
