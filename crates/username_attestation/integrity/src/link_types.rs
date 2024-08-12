use hdi::prelude::*;
use crate::agent_username_attestation::*;
use crate::user_metadata::*;
//use external_attestation_validation::*;

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    AgentToUsernameAttestations,
    AgentMetadata,

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
            LinkTypes::AgentMetadata => {
                validate_create_link_user_metadata(action, base_address, target_address, tag)
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
            LinkTypes::AgentMetadata => validate_delete_link_user_metadata(
                action,
                original_action,
                base_address,
                target_address,
                tag,
            ),
        }
    }
}
