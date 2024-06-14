use hdk::prelude::*;
use holoom_types::{OracleDocument, RelateOracleDocumentPayload};
use username_registry_integrity::{EntryTypes, LinkTypes};
use username_registry_utils::hash_identifier;

#[hdk_extern]
pub fn create_oracle_document(oracle_document: OracleDocument) -> ExternResult<Record> {
    let base_address = hash_identifier(oracle_document.name.clone())?;
    let oracle_document_ah = create_entry(EntryTypes::OracleDocument(oracle_document))?;
    create_link(
        base_address,
        oracle_document_ah.clone(),
        LinkTypes::NameToOracleDocument,
        (),
    )?;
    let record = get(oracle_document_ah, GetOptions::default())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from(
            "Could not find the newly created OracleDocument"
        ))
    ))?;

    Ok(record)
}

#[hdk_extern]
pub fn get_latest_oracle_document_ah_for_name(name: String) -> ExternResult<Option<ActionHash>> {
    let base_address = hash_identifier(name)?;
    let mut links = get_links(base_address, LinkTypes::NameToOracleDocument, None)?;
    links.sort_by_key(|link| link.timestamp);
    let Some(link) = links.pop() else {
        return Ok(None);
    };
    let action_hash = ActionHash::try_from(link.target).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "Link target isn't an ActionHash".into()
        ))
    })?;
    Ok(Some(action_hash))
}

#[hdk_extern]
pub fn get_latest_oracle_document_for_name(name: String) -> ExternResult<Option<Record>> {
    let Some(action_hash) = get_latest_oracle_document_ah_for_name(name)? else {
        return Ok(None);
    };
    get(action_hash, GetOptions::default())
}

#[hdk_extern]
pub fn relate_oracle_document(payload: RelateOracleDocumentPayload) -> ExternResult<()> {
    let base_address = hash_identifier(payload.relation)?;
    let target_address = hash_identifier(payload.name.clone())?;
    create_link(
        base_address,
        target_address,
        LinkTypes::RelateOracleDocumentName,
        payload.name.as_bytes().to_vec(),
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_related_oracle_document(relation_name: String) -> ExternResult<Vec<String>> {
    // BTreeSet ensures order an no repeats
    let identifiers: BTreeSet<String> = get_links(
        hash_identifier(relation_name)?,
        LinkTypes::RelateOracleDocumentName,
        None,
    )?
    .into_iter()
    .map(|link| {
        String::from_utf8(link.tag.into_inner())
            .map_err(|_| wasm_error!(WasmErrorInner::Guest("LinkTag isn't utf8".into())))
    })
    .collect::<ExternResult<_>>()?;
    Ok(identifiers.into_iter().collect())
}
