use hdi::prelude::*;
use crate::evm_address_to_signing_offer::*;
use crate::name_to_evm_signing_offer::*;

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
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
        match self {
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
