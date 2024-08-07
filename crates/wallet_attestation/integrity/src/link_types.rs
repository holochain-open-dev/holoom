use hdi::prelude::*;
use crate::agent_wallet_attestation::*;

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    AgentToWalletAttestations
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
            LinkTypes::AgentToWalletAttestations => {
                validate_create_link_agent_to_wallet_attestations(
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
            LinkTypes::AgentToWalletAttestations => {
                validate_delete_link_agent_to_wallet_attestations(
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
