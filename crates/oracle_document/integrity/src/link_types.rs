use hdi::prelude::*;
use crate::name_oracle_document::*;
use crate::relate_oracle_document_name::*;

#[derive(Serialize, Deserialize)]
#[hdk_link_types]
pub enum LinkTypes {
    NameToOracleDocument,
    RelateOracleDocumentName,
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
        }
    }
}
