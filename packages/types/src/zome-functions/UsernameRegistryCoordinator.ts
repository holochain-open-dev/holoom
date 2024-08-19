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

  async attestWalletSignature(payload: ChainWalletSignature): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "attest_wallet_signature",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async confirmExternalIdRequest(
    payload: ConfirmExternalIdRequestPayload,
  ): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "confirm_external_id_request",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async createExternalIdAttestation(
    payload: ExternalIdAttestation,
  ): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "create_external_id_attestation",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async createOracleDocument(payload: OracleDocument): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "create_oracle_document",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async createRecipe(payload: Recipe): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "create_recipe",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async createRecipeExecution(payload: RecipeExecution): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "create_recipe_execution",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async createSignedEvmSigningOffer(
    payload: CreateEvmSigningOfferPayload,
  ): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "create_signed_evm_signing_offer",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async createUsernameAttestation(
    payload: UsernameAttestation,
  ): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "create_username_attestation",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async createWalletAttestation(payload: WalletAttestation): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "create_wallet_attestation",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async deleteExternalIdAttestation(payload: ActionHash): Promise<ActionHash> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "delete_external_id_attestation",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async deleteUsernameAttestation(payload: ActionHash): Promise<ActionHash> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "delete_username_attestation",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async doesAgentHaveUsername(payload: AgentPubKey): Promise<boolean> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "does_agent_have_username",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async executeRecipe(payload: ExecuteRecipePayload): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "execute_recipe",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
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
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_attestation_for_external_id",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
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
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_evm_wallet_binding_message",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getExternalIdAttestation(payload: ActionHash): Promise<Record | null> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_external_id_attestation",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getExternalIdAttestationsForAgent(
    payload: AgentPubKey,
  ): Promise<Record[]> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_external_id_attestations_for_agent",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getLatestEvmSigningOfferAhForName(
    payload: string,
  ): Promise<ActionHash | null> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_latest_evm_signing_offer_ah_for_name",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getMetadata(payload: AgentPubKey): Promise<{ [key: string]: string }> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_metadata",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getMetadataItemValue(
    payload: GetMetadataItemValueInput,
  ): Promise<string | null> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_metadata_item_value",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getOracleDocumentLinkAhsForName(
    payload: string,
  ): Promise<ActionHash[]> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_oracle_document_link_ahs_for_name",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getRelatedOracleDocumentNames(payload: string): Promise<string[]> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_related_oracle_document_names",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getRelationLinkAhs(payload: string): Promise<ActionHash[]> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_relation_link_ahs",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getSigningOfferAhsForEvmAddress(
    payload: Uint8Array,
  ): Promise<ActionHash[]> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_signing_offer_ahs_for_evm_address",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getSolanaWalletBindingMessage(payload: Uint8Array): Promise<string> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_solana_wallet_binding_message",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getUsernameAttestation(payload: ActionHash): Promise<Record | null> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_username_attestation",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getUsernameAttestationForAgent(
    payload: AgentPubKey,
  ): Promise<Record | null> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_username_attestation_for_agent",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getWalletAttestation(payload: ActionHash): Promise<Record | null> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_wallet_attestation",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async getWalletAttestationsForAgent(payload: AgentPubKey): Promise<Record[]> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "get_wallet_attestations_for_agent",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async ingestEvmSignatureOverRecipeExecutionRequest(
    payload: EvmSignatureOverRecipeExecutionRequest,
  ): Promise<void> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "ingest_evm_signature_over_recipe_execution_request",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async ingestExternalIdAttestationRequest(
    payload: IngestExternalIdAttestationRequestPayload,
  ): Promise<void> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "ingest_external_id_attestation_request",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async ingestSignedUsername(payload: SignedUsername): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "ingest_signed_username",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async rejectEvmSignatureOverRecipeExecutionRequest(
    payload: RejectEvmSignatureOverRecipeExecutionRequestPayload,
  ): Promise<void> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "reject_evm_signature_over_recipe_execution_request",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async rejectExternalIdRequest(
    payload: RejectExternalIdRequestPayload,
  ): Promise<void> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "reject_external_id_request",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async relateOracleDocument(payload: DocumentRelationTag): Promise<void> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "relate_oracle_document",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async resolveEvmSignatureOverRecipeExecutionRequest(
    payload: ResolveEvmSignatureOverRecipeExecutionRequestPayload,
  ): Promise<void> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "resolve_evm_signature_over_recipe_execution_request",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async sendExternalIdAttestationRequest(
    payload: SendExternalIdAttestationRequestPayload,
  ): Promise<void> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "send_external_id_attestation_request",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async sendRequestForEvmSignatureOverRecipeExecution(
    payload: EvmSignatureOverRecipeExecutionRequest,
  ): Promise<void> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "send_request_for_evm_signature_over_recipe_execution",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async signUsernameToAttest(payload: string): Promise<Record> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "sign_username_to_attest",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }

  async updateMetadataItem(payload: UpdateMetadataItemInput): Promise<void> {
    return this.client
      .callZome({
        role_name: this.roleName,
        zome_name: this.zomeName,
        fn_name: "update_metadata_item",
        payload,
      })
      .catch(ValidationError.tryCastThrow);
  }
}
