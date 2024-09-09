import { callZomeFnHelper } from "../utils";
import { ActionHash, AgentPubKey, AppClient, Record } from "@holochain/client";
import {
  ChainWalletSignature,
  ConfirmExternalIdRequestPayload,
  CreateEvmSigningOfferPayload,
  DocumentRelationTag,
  EvmSignatureOverRecipeExecutionRequest,
  ExecuteRecipePayload,
  ExternalIdAttestation,
  GetAttestationForExternalIdPayload,
  GetExternalIdAttestationsForAgentPayload,
  GetMetadataItemValuePayload,
  GetUsernameAttestationForAgentPayload,
  IngestExternalIdAttestationRequestPayload,
  OracleDocument,
  Recipe,
  RecipeExecution,
  RejectEvmSignatureOverRecipeExecutionRequestPayload,
  RejectExternalIdRequestPayload,
  ResolveEvmSignatureOverRecipeExecutionRequestPayload,
  SendExternalIdAttestationRequestPayload,
  SignUsernameAndRequestAttestationInput,
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

  callZomeFn(fnName: string, payload?: unknown) {
    return callZomeFnHelper(
      this.client,
      this.roleName,
      this.zomeName,
      fnName,
      payload,
    );
  }

  async attestWalletSignature(
    chainWalletSignature: ChainWalletSignature,
  ): Promise<Record> {
    return this.callZomeFn("attest_wallet_signature", chainWalletSignature);
  }

  async confirmExternalIdRequest(
    payload: ConfirmExternalIdRequestPayload,
  ): Promise<Record> {
    return this.callZomeFn("confirm_external_id_request", payload);
  }

  async createExternalIdAttestation(
    attestation: ExternalIdAttestation,
  ): Promise<Record> {
    return this.callZomeFn("create_external_id_attestation", attestation);
  }

  async createOracleDocument(oracleDocument: OracleDocument): Promise<Record> {
    return this.callZomeFn("create_oracle_document", oracleDocument);
  }

  async createRecipe(recipe: Recipe): Promise<Record> {
    return this.callZomeFn("create_recipe", recipe);
  }

  async createRecipeExecution(
    recipeExecution: RecipeExecution,
  ): Promise<Record> {
    return this.callZomeFn("create_recipe_execution", recipeExecution);
  }

  async createSignedEvmSigningOffer(
    payload: CreateEvmSigningOfferPayload,
  ): Promise<Record> {
    return this.callZomeFn("create_signed_evm_signing_offer", payload);
  }

  async createUsernameAttestation(
    usernameAttestation: UsernameAttestation,
  ): Promise<Record> {
    return this.callZomeFn("create_username_attestation", usernameAttestation);
  }

  async createWalletAttestation(
    walletAttestation: WalletAttestation,
  ): Promise<Record> {
    return this.callZomeFn("create_wallet_attestation", walletAttestation);
  }

  async deleteExternalIdAttestation(
    originalAttestationHash: ActionHash,
  ): Promise<ActionHash> {
    return this.callZomeFn(
      "delete_external_id_attestation",
      originalAttestationHash,
    );
  }

  async deleteUsernameAttestation(
    originalUsernameAttestationHash: ActionHash,
  ): Promise<ActionHash> {
    return this.callZomeFn(
      "delete_username_attestation",
      originalUsernameAttestationHash,
    );
  }

  async doesAgentHaveUsername(agent: AgentPubKey): Promise<boolean> {
    return this.callZomeFn("does_agent_have_username", agent);
  }

  async evmSignatureProviderSetup(): Promise<void> {
    return this.callZomeFn("evm_signature_provider_setup");
  }

  async executeRecipe(payload: ExecuteRecipePayload): Promise<Record> {
    return this.callZomeFn("execute_recipe", payload);
  }

  async externalIdAuthoritySetup(): Promise<void> {
    return this.callZomeFn("external_id_authority_setup");
  }

  async getAllAuthoredExternalIdAhs(): Promise<ActionHash[]> {
    return this.callZomeFn("get_all_authored_external_id_ahs");
  }

  async getAllAuthoredUsernameAttestations(): Promise<Record[]> {
    return this.callZomeFn("get_all_authored_username_attestations");
  }

  async getAllPublishers(): Promise<[AgentPubKey, string][]> {
    return this.callZomeFn("get_all_publishers");
  }

  async getAttestationForExternalId(
    payload: GetAttestationForExternalIdPayload,
  ): Promise<Record | null> {
    return this.callZomeFn("get_attestation_for_external_id", payload);
  }

  async getEvmWalletBindingMessage(evmAddress: Uint8Array): Promise<string> {
    return this.callZomeFn("get_evm_wallet_binding_message", evmAddress);
  }

  async getExternalIdAttestation(
    externalIdAh: ActionHash,
  ): Promise<Record | null> {
    return this.callZomeFn("get_external_id_attestation", externalIdAh);
  }

  async getExternalIdAttestationsForAgent(
    payload: GetExternalIdAttestationsForAgentPayload,
  ): Promise<Record[]> {
    return this.callZomeFn("get_external_id_attestations_for_agent", payload);
  }

  async getLatestEvmSigningOfferAhForName(
    name: string,
  ): Promise<ActionHash | null> {
    return this.callZomeFn("get_latest_evm_signing_offer_ah_for_name", name);
  }

  async getMetadata(
    agentPubkey: AgentPubKey,
  ): Promise<{ [key: string]: string }> {
    return this.callZomeFn("get_metadata", agentPubkey);
  }

  async getMetadataItemValue(
    payload: GetMetadataItemValuePayload,
  ): Promise<string | null> {
    return this.callZomeFn("get_metadata_item_value", payload);
  }

  async getOracleDocumentLinkAhsForName(name: string): Promise<ActionHash[]> {
    return this.callZomeFn("get_oracle_document_link_ahs_for_name", name);
  }

  async getRelatedOracleDocumentNames(relationName: string): Promise<string[]> {
    return this.callZomeFn("get_related_oracle_document_names", relationName);
  }

  async getRelationLinkAhs(relationName: string): Promise<ActionHash[]> {
    return this.callZomeFn("get_relation_link_ahs", relationName);
  }

  async getSigningOfferAhsForEvmAddress(
    evmAddress: Uint8Array,
  ): Promise<ActionHash[]> {
    return this.callZomeFn("get_signing_offer_ahs_for_evm_address", evmAddress);
  }

  async getSolanaWalletBindingMessage(
    solanaAddress: Uint8Array,
  ): Promise<string> {
    return this.callZomeFn("get_solana_wallet_binding_message", solanaAddress);
  }

  async getUsernameAttestation(
    usernameAttestationHash: ActionHash,
  ): Promise<Record | null> {
    return this.callZomeFn("get_username_attestation", usernameAttestationHash);
  }

  async getUsernameAttestationForAgent(
    payload: GetUsernameAttestationForAgentPayload,
  ): Promise<Record | null> {
    return this.callZomeFn("get_username_attestation_for_agent", payload);
  }

  async getWalletAttestation(
    walletAttestationHash: ActionHash,
  ): Promise<Record | null> {
    return this.callZomeFn("get_wallet_attestation", walletAttestationHash);
  }

  async getWalletAttestationsForAgent(agent: AgentPubKey): Promise<Record[]> {
    return this.callZomeFn("get_wallet_attestations_for_agent", agent);
  }

  async ingestEvmSignatureOverRecipeExecutionRequest(
    payload: EvmSignatureOverRecipeExecutionRequest,
  ): Promise<void> {
    return this.callZomeFn(
      "ingest_evm_signature_over_recipe_execution_request",
      payload,
    );
  }

  async ingestExternalIdAttestationRequest(
    payload: IngestExternalIdAttestationRequestPayload,
  ): Promise<void> {
    return this.callZomeFn("ingest_external_id_attestation_request", payload);
  }

  async ingestSignedUsername(signedUsername: SignedUsername): Promise<Record> {
    return this.callZomeFn("ingest_signed_username", signedUsername);
  }

  async registerAsPublisher(tag: string): Promise<ActionHash> {
    return this.callZomeFn("register_as_publisher", tag);
  }

  async rejectEvmSignatureOverRecipeExecutionRequest(
    payload: RejectEvmSignatureOverRecipeExecutionRequestPayload,
  ): Promise<void> {
    return this.callZomeFn(
      "reject_evm_signature_over_recipe_execution_request",
      payload,
    );
  }

  async rejectExternalIdRequest(
    payload: RejectExternalIdRequestPayload,
  ): Promise<void> {
    return this.callZomeFn("reject_external_id_request", payload);
  }

  async relateOracleDocument(relationTag: DocumentRelationTag): Promise<void> {
    return this.callZomeFn("relate_oracle_document", relationTag);
  }

  async resolveEvmSignatureOverRecipeExecutionRequest(
    payload: ResolveEvmSignatureOverRecipeExecutionRequestPayload,
  ): Promise<void> {
    return this.callZomeFn(
      "resolve_evm_signature_over_recipe_execution_request",
      payload,
    );
  }

  async sendExternalIdAttestationRequest(
    payload: SendExternalIdAttestationRequestPayload,
  ): Promise<void> {
    return this.callZomeFn("send_external_id_attestation_request", payload);
  }

  async sendRequestForEvmSignatureOverRecipeExecution(
    request: EvmSignatureOverRecipeExecutionRequest,
  ): Promise<void> {
    return this.callZomeFn(
      "send_request_for_evm_signature_over_recipe_execution",
      request,
    );
  }

  async signUsernameAndRequestAttestation(
    input: SignUsernameAndRequestAttestationInput,
  ): Promise<Record> {
    return this.callZomeFn("sign_username_and_request_attestation", input);
  }

  async updateMetadataItem(payload: UpdateMetadataItemPayload): Promise<void> {
    return this.callZomeFn("update_metadata_item", payload);
  }

  async usernameAuthoritySetup(): Promise<void> {
    return this.callZomeFn("username_authority_setup");
  }
}
