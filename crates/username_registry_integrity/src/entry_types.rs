use hdi::prelude::*;
use holoom_types::{
    ExternalIdAttestation, JqExecution, OracleDocument, OracleDocumentListSnapshot,
    UsernameAttestation, WalletAttestation,
};
use username_registry_validation::*;

#[derive(Serialize, Deserialize)]
#[serde(tag = "type")]
#[hdk_entry_defs]
#[unit_enum(UnitEntryTypes)]
pub enum EntryTypes {
    UsernameAttestation(UsernameAttestation),
    WalletAttestation(WalletAttestation),
    ExternalIdAttestation(ExternalIdAttestation),
    OracleDocument(OracleDocument),
    OracleDocumentListSnapshot(OracleDocumentListSnapshot),
    JqExecution(JqExecution),
}

impl EntryTypes {
    pub fn validate_create(self, action: Create) -> ExternResult<ValidateCallbackResult> {
        match self {
            EntryTypes::UsernameAttestation(username_attestation) => {
                validate_create_username_attestation(
                    EntryCreationAction::Create(action),
                    username_attestation,
                )
            }
            EntryTypes::WalletAttestation(wallet_attestation) => {
                validate_create_wallet_attestation(
                    EntryCreationAction::Create(action),
                    wallet_attestation,
                )
            }
            EntryTypes::ExternalIdAttestation(external_id_attestation) => {
                validate_create_external_id_attestation(
                    EntryCreationAction::Create(action),
                    external_id_attestation,
                )
            }
            EntryTypes::OracleDocument(oracle_document) => validate_create_oracle_document(
                EntryCreationAction::Create(action),
                oracle_document,
            ),
            EntryTypes::OracleDocumentListSnapshot(oracle_document_list_snapshot) => {
                validate_create_oracle_document_list_snapshot(
                    EntryCreationAction::Create(action),
                    oracle_document_list_snapshot,
                )
            }
            EntryTypes::JqExecution(jq_execution) => {
                validate_create_jq_execution(EntryCreationAction::Create(action), jq_execution)
            }
        }
    }
}
