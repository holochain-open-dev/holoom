use hdk::prelude::*;
use holoom_types::{DocumentRelationTag, OracleDocument};
use username_registry_integrity::{EntryTypes, LinkTypes};
use username_registry_utils::hash_identifier;

#[hdk_extern]
pub fn create_oracle_document(oracle_document: OracleDocument) -> ExternResult<Record> {
    let base_address = hash_identifier(oracle_document.name.clone())?;
    let link_tag = oracle_document.name.as_bytes().to_vec();
    let oracle_document_ah = create_entry(EntryTypes::OracleDocument(oracle_document))?;
    create_link(
        base_address,
        oracle_document_ah.clone(),
        LinkTypes::NameToOracleDocument,
        link_tag,
    )?;
    let record = get(oracle_document_ah, GetOptions::network())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from(
            "Could not find the newly created OracleDocument"
        ))
    ))?;

    Ok(record)
}
#[hdk_extern]
pub fn get_latest_oracle_document_ah_for_name(name: String) -> ExternResult<Option<ActionHash>> {
    let base_address = hash_identifier(name)?;
    let mut links = get_links(
        GetLinksInputBuilder::try_new(base_address, LinkTypes::NameToOracleDocument)?.build(),
    )?;
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
pub fn get_oracle_document_link_ahs_for_name(name: String) -> ExternResult<Vec<ActionHash>> {
    let base_address = hash_identifier(name)?;
    let mut links = get_links(
        GetLinksInputBuilder::try_new(base_address, LinkTypes::NameToOracleDocument)?.build(),
    )?;
    links.sort_by_key(|link| link.timestamp);
    let action_hashes = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.create_link_hash).ok())
        .collect();
    Ok(action_hashes)
}

#[hdk_extern]
pub fn get_latest_oracle_document_for_name(name: String) -> ExternResult<Option<Record>> {
    let Some(action_hash) = get_latest_oracle_document_ah_for_name(name)? else {
        return Ok(None);
    };
    get(action_hash, GetOptions::network())
}

#[hdk_extern]
pub fn relate_oracle_document(relation_tag: DocumentRelationTag) -> ExternResult<()> {
    let tag_bytes =
        ExternIO::encode(&relation_tag).expect("Couldn't serialize DocumentRelationTag");

    let base_address = hash_identifier(relation_tag.relation)?;
    let target_address = hash_identifier(relation_tag.name.clone())?;
    create_link(
        base_address,
        target_address,
        LinkTypes::RelateOracleDocumentName,
        tag_bytes.0,
    )?;

    Ok(())
}

#[hdk_extern]
pub fn get_related_oracle_document_names(relation_name: String) -> ExternResult<Vec<String>> {
    // BTreeSet ensures order an no repeats
    let identifiers: BTreeSet<String> = get_links(
        GetLinksInputBuilder::try_new(
            hash_identifier(relation_name)?,
            LinkTypes::RelateOracleDocumentName,
        )?
        .build(),
    )?
    .into_iter()
    .map(|link| {
        let document_relation: DocumentRelationTag = ExternIO(link.tag.into_inner())
            .decode()
            .map_err(|_| wasm_error!(WasmErrorInner::Guest("LinkTag isn't utf8".into())))?;
        Ok(document_relation.name)
    })
    .collect::<ExternResult<_>>()?;
    Ok(identifiers.into_iter().collect())
}

#[hdk_extern]
pub fn get_relation_link_ahs(relation_name: String) -> ExternResult<Vec<ActionHash>> {
    let mut links = get_links(
        GetLinksInputBuilder::try_new(
            hash_identifier(relation_name)?,
            LinkTypes::RelateOracleDocumentName,
        )?
        .build(),
    )?;
    links.sort_by_key(|link| link.timestamp);
    let action_hashes = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.create_link_hash).ok())
        .collect();
    Ok(action_hashes)
}
