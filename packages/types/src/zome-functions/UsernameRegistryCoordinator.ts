import { ActionHash, AgentPubKey, AppClient, Record } from "@holochain/client";
import {
  ChainWalletSignature,
  ConfirmExternalIdRequestPayload,
  CreateEvmSigningOfferPayload,
  DocumentRelationTag,
  EvmSignatureOverRecipeExecutionRequest,
  ExecuteRecipePayload,
  ExternalIdAttestation,
  GetMetadataItemValuePayload,
  IngestExternalIdAttestationRequestPayload,
  OracleDocument,
  Recipe,
  RecipeExecution,
  RejectEvmSignatureOverRecipeExecutionRequestPayload,
  RejectExternalIdRequestPayload,
  ResolveEvmSignatureOverRecipeExecutionRequestPayload,
  SendExternalIdAttestationRequestPayload,
  SignedUsername,
  UpdateMetadataItemPayload,
  UsernameAttestation,
  WalletAttestation,
} from "../types";

export class UsernameRegistryCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "username_registry",
  ) {}

  async attestWalletSignature(payload: ChainWalletSignature): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "attest_wallet_signature",
      payload,
    });
  }

  async confirmExternalIdRequest(
    payload: ConfirmExternalIdRequestPayload,
  ): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "confirm_external_id_request",
      payload,
    });
  }

  async createExternalIdAttestation(
    payload: ExternalIdAttestation,
  ): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "create_external_id_attestation",
      payload,
    });
  }

  async createOracleDocument(payload: OracleDocument): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "create_oracle_document",
      payload,
    });
  }

  async createRecipe(payload: Recipe): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "create_recipe",
      payload,
    });
  }

  async createRecipeExecution(payload: RecipeExecution): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "create_recipe_execution",
      payload,
    });
  }

  async createSignedEvmSigningOffer(
    payload: CreateEvmSigningOfferPayload,
  ): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "create_signed_evm_signing_offer",
      payload,
    });
  }

  async createUsernameAttestation(
    payload: UsernameAttestation,
  ): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "create_username_attestation",
      payload,
    });
  }

  async createWalletAttestation(payload: WalletAttestation): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "create_wallet_attestation",
      payload,
    });
  }

  async deleteExternalIdAttestation(payload: ActionHash): Promise<ActionHash> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "delete_external_id_attestation",
      payload,
    });
  }

  async deleteUsernameAttestation(payload: ActionHash): Promise<ActionHash> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "delete_username_attestation",
      payload,
    });
  }

  async doesAgentHaveUsername(payload: AgentPubKey): Promise<boolean> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "does_agent_have_username",
      payload,
    });
  }

  async executeRecipe(payload: ExecuteRecipePayload): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "execute_recipe",
      payload,
    });
  }

  async getAllExternalIdAhs(): Promise<ActionHash[]> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_all_external_id_ahs",
      payload: null,
    });
  }

  async getAllUsernameAttestations(): Promise<Record[]> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_all_username_attestations",
      payload: null,
    });
  }

  async getAttestationForExternalId(payload: string): Promise<Record | null> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_attestation_for_external_id",
      payload,
    });
  }

  async getAuthority(): Promise<AgentPubKey> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_authority",
      payload: null,
    });
  }

  async getEvmWalletBindingMessage(payload: Uint8Array): Promise<string> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_evm_wallet_binding_message",
      payload,
    });
  }

  async getExternalIdAttestation(payload: ActionHash): Promise<Record | null> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_external_id_attestation",
      payload,
    });
  }

  async getExternalIdAttestationsForAgent(
    payload: AgentPubKey,
  ): Promise<Record[]> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_external_id_attestations_for_agent",
      payload,
    });
  }

  async getLatestEvmSigningOfferAhForName(
    payload: string,
  ): Promise<ActionHash | null> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_latest_evm_signing_offer_ah_for_name",
      payload,
    });
  }

  async getMetadata(payload: AgentPubKey): Promise<{ [key: string]: string }> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_metadata",
      payload,
    });
  }

  async getMetadataItemValue(
    payload: GetMetadataItemValuePayload,
  ): Promise<string | null> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_metadata_item_value",
      payload,
    });
  }

  async getOracleDocumentLinkAhsForName(
    payload: string,
  ): Promise<ActionHash[]> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_oracle_document_link_ahs_for_name",
      payload,
    });
  }

  async getRelatedOracleDocumentNames(payload: string): Promise<string[]> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_related_oracle_document_names",
      payload,
    });
  }

  async getRelationLinkAhs(payload: string): Promise<ActionHash[]> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_relation_link_ahs",
      payload,
    });
  }

  async getSigningOfferAhsForEvmAddress(
    payload: Uint8Array,
  ): Promise<ActionHash[]> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_signing_offer_ahs_for_evm_address",
      payload,
    });
  }

  async getSolanaWalletBindingMessage(payload: Uint8Array): Promise<string> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_solana_wallet_binding_message",
      payload,
    });
  }

  async getUsernameAttestation(payload: ActionHash): Promise<Record | null> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_username_attestation",
      payload,
    });
  }

  async getUsernameAttestationForAgent(
    payload: AgentPubKey,
  ): Promise<Record | null> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_username_attestation_for_agent",
      payload,
    });
  }

  async getWalletAttestation(payload: ActionHash): Promise<Record | null> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_wallet_attestation",
      payload,
    });
  }

  async getWalletAttestationsForAgent(payload: AgentPubKey): Promise<Record[]> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "get_wallet_attestations_for_agent",
      payload,
    });
  }

  async ingestEvmSignatureOverRecipeExecutionRequest(
    payload: EvmSignatureOverRecipeExecutionRequest,
  ): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "ingest_evm_signature_over_recipe_execution_request",
      payload,
    });
  }

  async ingestExternalIdAttestationRequest(
    payload: IngestExternalIdAttestationRequestPayload,
  ): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "ingest_external_id_attestation_request",
      payload,
    });
  }

  async ingestSignedUsername(payload: SignedUsername): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "ingest_signed_username",
      payload,
    });
  }

  async rejectEvmSignatureOverRecipeExecutionRequest(
    payload: RejectEvmSignatureOverRecipeExecutionRequestPayload,
  ): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "reject_evm_signature_over_recipe_execution_request",
      payload,
    });
  }

  async rejectExternalIdRequest(
    payload: RejectExternalIdRequestPayload,
  ): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "reject_external_id_request",
      payload,
    });
  }

  async relateOracleDocument(payload: DocumentRelationTag): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "relate_oracle_document",
      payload,
    });
  }

  async resolveEvmSignatureOverRecipeExecutionRequest(
    payload: ResolveEvmSignatureOverRecipeExecutionRequestPayload,
  ): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "resolve_evm_signature_over_recipe_execution_request",
      payload,
    });
  }

  async sendExternalIdAttestationRequest(
    payload: SendExternalIdAttestationRequestPayload,
  ): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "send_external_id_attestation_request",
      payload,
    });
  }

  async sendRequestForEvmSignatureOverRecipeExecution(
    payload: EvmSignatureOverRecipeExecutionRequest,
  ): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "send_request_for_evm_signature_over_recipe_execution",
      payload,
    });
  }

  async signUsernameToAttest(payload: string): Promise<Record> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "sign_username_to_attest",
      payload,
    });
  }

  async updateMetadataItem(payload: UpdateMetadataItemPayload): Promise<void> {
    return this.client.callZome({
      role_name: this.roleName,
      zome_name: this.zomeName,
      fn_name: "update_metadata_item",
      payload,
    });
  }
}
