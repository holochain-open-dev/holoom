use hdi::prelude::*;
use metadata_types::InjectMetadataLinkTypes;
use username_registry_validation::*;

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    AgentToUsernameAttestations,
    AgentMetadata,
    AgentToWalletAttestations,
    AgentToExternalIdAttestation,
    ExternalIdToAttestation,
    NameToOracleDocument,
    RelateOracleDocumentName,
    NameToRecipe,
    NameToSigningOffer,
    EvmAddressToSigningOffer,
}

impl InjectMetadataLinkTypes for LinkTypes {
    type LinkType = LinkTypes;
    fn agent_metadata() -> Self::LinkType {
        Self::AgentMetadata
    }
}

impl LinkTypes {
    pub fn validate_create(
        self,
        action: CreateLink,
        base_address: AnyLinkableHash,
        target_address: AnyLinkableHash,
        tag: LinkTag,
    ) -> ExternResult<ValidateCallbackResult> {
        match self {
            LinkTypes::AgentToUsernameAttestations => {
                validate_create_link_agent_to_username_attestations(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::AgentMetadata => metadata_validation::validate_create_link_user_metadata(
                action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::AgentToWalletAttestations => {
                validate_create_link_agent_to_wallet_attestations(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::AgentToExternalIdAttestation => {
                validate_create_link_agent_to_external_id_attestations(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::ExternalIdToAttestation => validate_create_link_external_id_to_attestation(
                action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::NameToOracleDocument => validate_create_link_name_to_oracle_document(
                action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::RelateOracleDocumentName => {
                validate_create_link_relate_oracle_document_name(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::NameToRecipe => {
                validate_create_link_name_to_recipe(action, base_address, target_address, tag)
            }
            LinkTypes::NameToSigningOffer => validate_create_link_name_to_evm_signing_offer(
                action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::EvmAddressToSigningOffer => {
                validate_create_link_evm_address_to_signing_offer(
                    action,
                    base_address,
                    target_address,
                    tag,
                )
            }
        }
    }

    pub fn validate_delete(
        self,
        action: DeleteLink,
        original_action: CreateLink,
        base_address: AnyLinkableHash,
        target_address: AnyLinkableHash,
        tag: LinkTag,
    ) -> ExternResult<ValidateCallbackResult> {
        match self {
            LinkTypes::AgentToUsernameAttestations => {
                validate_delete_link_agent_to_username_attestations(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::AgentMetadata => metadata_validation::validate_delete_link_user_metadata(
                action,
                original_action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::AgentToWalletAttestations => {
                validate_delete_link_agent_to_wallet_attestations(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::AgentToExternalIdAttestation => {
                validate_delete_link_agent_to_external_id_attestations(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
            LinkTypes::ExternalIdToAttestation => validate_delete_link_external_id_to_attestation(
                action,
                original_action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::NameToOracleDocument => validate_delete_link_name_to_oracle_document(
                action,
                original_action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::RelateOracleDocumentName => {
                validate_delete_link_relate_oracle_document_name(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }

            LinkTypes::NameToRecipe => validate_delete_link_name_to_recipe(
                action,
                original_action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::NameToSigningOffer => validate_delete_link_name_to_evm_signing_offer(
                action,
                original_action,
                base_address,
                target_address,
                tag,
            ),
            LinkTypes::EvmAddressToSigningOffer => {
                validate_delete_link_evm_address_to_signing_offer(
                    action,
                    original_action,
                    base_address,
                    target_address,
                    tag,
                )
            }
        }
    }
}
