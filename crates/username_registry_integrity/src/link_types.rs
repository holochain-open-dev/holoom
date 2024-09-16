use hdi::prelude::*;
use username_registry_validation::*;

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    AgentToUsernameAttestations,
    AgentMetadata,
    AgentToWalletAttestations,
    AgentToExternalIdAttestation,
    ExternalIdAttestor,
    ExternalIdToAttestation,
    Publisher,
    NameToOracleDocument,
    RelateOracleDocumentName,
    NameToRecipe,
    NameToSigningOffer,
    EvmAddressToSigningOffer,
}

impl LinkTypes {
    pub fn validate_create(
        self,
        action: CreateLink,
        base_address: AnyLinkableHash,
        target_address: AnyLinkableHash,
        tag: LinkTag,
    ) -> ExternResult<ValidateCallbackResult> {
        let validate_fn = match self {
            LinkTypes::AgentToUsernameAttestations => {
                validate_create_link_agent_to_username_attestations
            }
            LinkTypes::AgentMetadata => validate_create_link_user_metadata,
            LinkTypes::AgentToWalletAttestations => {
                validate_create_link_agent_to_wallet_attestations
            }
            LinkTypes::AgentToExternalIdAttestation => {
                validate_create_link_agent_to_external_id_attestations
            }
            LinkTypes::ExternalIdAttestor => validate_create_link_external_id_attestor,
            LinkTypes::ExternalIdToAttestation => validate_create_link_external_id_to_attestation,
            LinkTypes::Publisher => validate_create_link_publisher,
            LinkTypes::NameToOracleDocument => validate_create_link_name_to_oracle_document,
            LinkTypes::RelateOracleDocumentName => validate_create_link_relate_oracle_document_name,
            LinkTypes::NameToRecipe => validate_create_link_name_to_recipe,
            LinkTypes::NameToSigningOffer => validate_create_link_name_to_evm_signing_offer,
            LinkTypes::EvmAddressToSigningOffer => {
                validate_create_link_evm_address_to_signing_offer
            }
        };
        validate_fn(action, base_address, target_address, tag)
    }

    pub fn validate_delete(
        self,
        action: DeleteLink,
        original_action: CreateLink,
        base_address: AnyLinkableHash,
        target_address: AnyLinkableHash,
        tag: LinkTag,
    ) -> ExternResult<ValidateCallbackResult> {
        let validate_fn = match self {
            LinkTypes::AgentToUsernameAttestations => {
                validate_delete_link_agent_to_username_attestations
            }
            LinkTypes::AgentMetadata => validate_delete_link_user_metadata,
            LinkTypes::AgentToWalletAttestations => {
                validate_delete_link_agent_to_wallet_attestations
            }
            LinkTypes::ExternalIdAttestor => validate_delete_link_external_id_attestor,
            LinkTypes::AgentToExternalIdAttestation => {
                validate_delete_link_agent_to_external_id_attestations
            }
            LinkTypes::ExternalIdToAttestation => validate_delete_link_external_id_to_attestation,
            LinkTypes::Publisher => validate_delete_link_publisher,
            LinkTypes::NameToOracleDocument => validate_delete_link_name_to_oracle_document,
            LinkTypes::RelateOracleDocumentName => validate_delete_link_relate_oracle_document_name,
            LinkTypes::NameToRecipe => validate_delete_link_name_to_recipe,
            LinkTypes::NameToSigningOffer => validate_delete_link_name_to_evm_signing_offer,
            LinkTypes::EvmAddressToSigningOffer => {
                validate_delete_link_evm_address_to_signing_offer
            }
        };
        validate_fn(action, original_action, base_address, target_address, tag)
    }
}
