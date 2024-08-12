use hdi::prelude::*;
use crate::name_to_recipe::*;

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    NameToRecipe
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
            LinkTypes::NameToRecipe => {
                validate_create_link_name_to_recipe(action, base_address, target_address, tag)
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
            LinkTypes::NameToRecipe => validate_delete_link_name_to_recipe(
                action,
                original_action,
                base_address,
                target_address,
                tag,
            ),
        }
    }
}
