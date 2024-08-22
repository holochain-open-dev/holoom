import { ActionHash, AgentPubKey, AppClient, Record } from "@holochain/client";
import {
  GetMetadataItemValueInput,
  UpdateMetadataItemInput,
} from "../typeshare-generated";
import {
  ChainWalletSignature,
  ConfirmExternalIdRequestPayload,
  CreateEvmSigningOfferPayload,
  DocumentRelationTag,
  EvmSignatureOverRecipeExecutionRequest,
  ExecuteRecipePayload,
  ExternalIdAttestation,
  IngestExternalIdAttestationRequestPayload,
  OracleDocument,
  Recipe,
  RecipeExecution,
  RejectEvmSignatureOverRecipeExecutionRequestPayload,
  RejectExternalIdRequestPayload,
  ResolveEvmSignatureOverRecipeExecutionRequestPayload,
  SendExternalIdAttestationRequestPayload,
  SignedUsername,
  UsernameAttestation,
  WalletAttestation,
} from "../types";
import { ValidationError } from "../errors";

export class UsernameRegistryCoordinator {
  constructor(
    private readonly client: AppClient,
    private readonly roleName = "holoom",
    private readonly zomeName = "username_registry",
  ) {}

  callFn(fn_name: string, payload?: unknown) {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name,
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async attestWalletSignature(
    chainWalletSignature: ChainWalletSignature,
  ): Promise<Record> {
    return this.callFn("attest_wallet_signature", chainWalletSignature);
  }

  async confirmExternalIdRequest(
    payload: ConfirmExternalIdRequestPayload,
  ): Promise<Record> {
    return this.callFn("confirm_external_id_request", payload);
  }

  async createExternalIdAttestation(
    attestation: ExternalIdAttestation,
  ): Promise<Record> {
    return this.callFn("create_external_id_attestation", attestation);
  }

  async createOracleDocument(oracleDocument: OracleDocument): Promise<Record> {
    return this.callFn("create_oracle_document", oracleDocument);
  }

  async createRecipe(recipe: Recipe): Promise<Record> {
    return this.callFn("create_recipe", recipe);
  }

  async createRecipeExecution(
    recipeExecution: RecipeExecution,
  ): Promise<Record> {
    return this.callFn("create_recipe_execution", recipeExecution);
  }

  async createSignedEvmSigningOffer(
    payload: CreateEvmSigningOfferPayload,
  ): Promise<Record> {
    return this.callFn("create_signed_evm_signing_offer", payload);
  }

  async createUsernameAttestation(
    usernameAttestation: UsernameAttestation,
  ): Promise<Record> {
    return this.callFn("create_username_attestation", usernameAttestation);
  }

  async createWalletAttestation(
    walletAttestation: WalletAttestation,
  ): Promise<Record> {
    return this.callFn("create_wallet_attestation", walletAttestation);
  }

  async deleteExternalIdAttestation(
    originalAttestationHash: ActionHash,
  ): Promise<ActionHash> {
    return this.callFn(
      "delete_external_id_attestation",
      originalAttestationHash,
    );
  }

  async deleteUsernameAttestation(
    originalUsernameAttestationHash: ActionHash,
  ): Promise<ActionHash> {
    return this.callFn(
      "delete_username_attestation",
      originalUsernameAttestationHash,
    );
  }

  async doesAgentHaveUsername(agent: AgentPubKey): Promise<boolean> {
    return this.callFn("does_agent_have_username", agent);
  }

  async executeRecipe(payload: ExecuteRecipePayload): Promise<Record> {
    return this.callFn("execute_recipe", payload);
  }

  async getAllExternalIdAhs(): Promise<ActionHash[]> {
    return this.callFn("get_all_external_id_ahs");
  }

  async getAllUsernameAttestations(): Promise<Record[]> {
    return this.callFn("get_all_username_attestations");
  }

  async getAttestationForExternalId(
    externalId: string,
  ): Promise<Record | null> {
    return this.callFn("get_attestation_for_external_id", externalId);
  }

  async getAuthority(): Promise<AgentPubKey> {
    return this.callFn("get_authority");
  }

  async getEvmWalletBindingMessage(evmAddress: Uint8Array): Promise<string> {
    return this.callFn("get_evm_wallet_binding_message", evmAddress);
  }

  async getExternalIdAttestation(
    externalIdAh: ActionHash,
  ): Promise<Record | null> {
    return this.callFn("get_external_id_attestation", externalIdAh);
  }

  async getExternalIdAttestationsForAgent(
    agentPubkey: AgentPubKey,
  ): Promise<Record[]> {
    return this.callFn("get_external_id_attestations_for_agent", agentPubkey);
  }

  async getLatestEvmSigningOfferAhForName(
    name: string,
  ): Promise<ActionHash | null> {
    return this.callFn("get_latest_evm_signing_offer_ah_for_name", name);
  }

  async getMetadata(
    agentPubkey: AgentPubKey,
  ): Promise<{ [key: string]: string }> {
    return this.callFn("get_metadata", agentPubkey);
  }

  async getMetadataItemValue(
    input: GetMetadataItemValueInput,
  ): Promise<string | null> {
    return this.callFn("get_metadata_item_value", input);
  }

  async getOracleDocumentLinkAhsForName(name: string): Promise<ActionHash[]> {
    return this.callFn("get_oracle_document_link_ahs_for_name", name);
  }

  async getRelatedOracleDocumentNames(relationName: string): Promise<string[]> {
    return this.callFn("get_related_oracle_document_names", relationName);
  }

  async getRelationLinkAhs(relationName: string): Promise<ActionHash[]> {
    return this.callFn("get_relation_link_ahs", relationName);
  }

  async getSigningOfferAhsForEvmAddress(
    evmAddress: Uint8Array,
  ): Promise<ActionHash[]> {
    return this.callFn("get_signing_offer_ahs_for_evm_address", evmAddress);
  }

  async getSolanaWalletBindingMessage(
    solanaAddress: Uint8Array,
  ): Promise<string> {
    return this.callFn("get_solana_wallet_binding_message", solanaAddress);
  }

  async getUsernameAttestation(
    usernameAttestationHash: ActionHash,
  ): Promise<Record | null> {
    return this.callFn("get_username_attestation", usernameAttestationHash);
  }

  async getUsernameAttestationForAgent(
    agent: AgentPubKey,
  ): Promise<Record | null> {
    return this.callFn("get_username_attestation_for_agent", agent);
  }

  async getWalletAttestation(
    walletAttestationHash: ActionHash,
  ): Promise<Record | null> {
    return this.callFn("get_wallet_attestation", walletAttestationHash);
  }

  async getWalletAttestationsForAgent(agent: AgentPubKey): Promise<Record[]> {
    return this.callFn("get_wallet_attestations_for_agent", agent);
  }

  async ingestEvmSignatureOverRecipeExecutionRequest(
    payload: EvmSignatureOverRecipeExecutionRequest,
  ): Promise<void> {
    return this.callFn(
      "ingest_evm_signature_over_recipe_execution_request",
      payload,
    );
  }

  async ingestExternalIdAttestationRequest(
    payload: IngestExternalIdAttestationRequestPayload,
  ): Promise<void> {
    return this.callFn("ingest_external_id_attestation_request", payload);
  }

  async ingestSignedUsername(signedUsername: SignedUsername): Promise<Record> {
    return this.callFn("ingest_signed_username", signedUsername);
  }

  async rejectEvmSignatureOverRecipeExecutionRequest(
    payload: RejectEvmSignatureOverRecipeExecutionRequestPayload,
  ): Promise<void> {
    return this.callFn(
      "reject_evm_signature_over_recipe_execution_request",
      payload,
    );
  }

  async rejectExternalIdRequest(
    payload: RejectExternalIdRequestPayload,
  ): Promise<void> {
    return this.callFn("reject_external_id_request", payload);
  }

  async relateOracleDocument(relationTag: DocumentRelationTag): Promise<void> {
    return this.callFn("relate_oracle_document", relationTag);
  }

  async resolveEvmSignatureOverRecipeExecutionRequest(
    payload: ResolveEvmSignatureOverRecipeExecutionRequestPayload,
  ): Promise<void> {
    return this.callFn(
      "resolve_evm_signature_over_recipe_execution_request",
      payload,
    );
  }

  async sendExternalIdAttestationRequest(
    payload: SendExternalIdAttestationRequestPayload,
  ): Promise<void> {
    return this.callFn("send_external_id_attestation_request", payload);
  }

  async sendRequestForEvmSignatureOverRecipeExecution(
    request: EvmSignatureOverRecipeExecutionRequest,
  ): Promise<void> {
    return this.callFn(
      "send_request_for_evm_signature_over_recipe_execution",
      request,
    );
  }

  async signUsernameToAttest(username: string): Promise<Record> {
    return this.callFn("sign_username_to_attest", username);
  }

  async updateMetadataItem(input: UpdateMetadataItemInput): Promise<void> {
    return this.callFn("update_metadata_item", input);
  }
}
