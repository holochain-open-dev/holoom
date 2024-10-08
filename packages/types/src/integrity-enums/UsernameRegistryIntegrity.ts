/**
 * Generated by scripts/extract-integrity-enums.ts
 */

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
  ExternalIdAttestor = 4,
  ExternalIdToAttestation = 5,
  Publisher = 6,
  NameToOracleDocument = 7,
  RelateOracleDocumentName = 8,
  NameToRecipe = 9,
  NameToSigningOffer = 10,
  EvmAddressToSigningOffer = 11,
}
