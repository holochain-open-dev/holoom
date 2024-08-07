use hdi::prelude::*;
use crate::agent_external_id_attestation::*;
use crate::external_id_to_attestation::*;
//use external_attestation_validation::*;

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    AgentToExternalIdAttestation,
    ExternalIdToAttestation,

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
        }
    }
}
