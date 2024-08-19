use hdi::prelude::*;
use typeshare::typeshare;
use user_metadata_validation::{
    CreateAgentMetadataLinkRejectionReason, DeleteAgentMetadataLinkRejectionReason,
};

#[derive(Serialize)]
#[serde(tag = "type", content = "reasons")]
#[typeshare]
pub enum ValidationRejectionDetail {
    CreateAgentMetadataLinkRejectionReasons(Vec<CreateAgentMetadataLinkRejectionReason>),
    DeleteAgentMetadataLinkRejectionReasons(Vec<DeleteAgentMetadataLinkRejectionReason>),
}

impl ValidationRejectionDetail {
    pub fn to_validation_result(self) -> ExternResult<ValidateCallbackResult> {
        let is_valid = match &self {
            ValidationRejectionDetail::CreateAgentMetadataLinkRejectionReasons(reasons) => {
                reasons.is_empty()
            }
            ValidationRejectionDetail::DeleteAgentMetadataLinkRejectionReasons(reasons) => {
                reasons.is_empty()
            }
        };
        if is_valid {
            Ok(ValidateCallbackResult::Valid)
        } else {
            Ok(ValidateCallbackResult::Invalid(format!(
                "__REASONS_START__{}__REASONS_END__",
                serde_json::to_string(&self)
                    .map_err(|_| wasm_error!("Couldn't serialize rejection reasons".to_string()))?
            )))
        }
    }
}
