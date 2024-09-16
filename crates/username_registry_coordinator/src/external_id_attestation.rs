use core::str;
use hdk::prelude::*;
use holoom_types::{
    ConfirmExternalIdRequestPayload, ExternalIdAttestation, GetAttestationForExternalIdPayload,
    GetExternalIdAttestationsForAgentPayload, IngestExternalIdAttestationRequestPayload,
    LocalHoloomSignal, RejectExternalIdRequestPayload, RemoteHoloomSignal,
    SendExternalIdAttestationRequestPayload,
};
use username_registry_integrity::{EntryTypes, LinkTypes, UnitEntryTypes};
use username_registry_utils::hash_identifier;

/// To be called once by agents that intend to act as an authority of `ExternalIdAttestation`s.
/// Adds a `CapGrant` for ingesting username attestation requests.
#[hdk_extern]
pub fn external_id_authority_setup(_: ()) -> ExternResult<()> {
    let zome_name = zome_info()?.name;
    let functions = BTreeSet::from([(
        zome_name.clone(),
        FunctionName("ingest_external_id_attestation_request".into()),
    )]);
    create_cap_grant(CapGrantEntry {
        tag: "".into(),
        access: ().into(),
        functions: GrantedFunctions::Listed(functions),
    })?;

    Ok(())
}

/// Forwards an external ID attestation request to the specified authority.
#[hdk_extern]
pub fn send_external_id_attestation_request(
    payload: SendExternalIdAttestationRequestPayload,
) -> ExternResult<()> {
    let authority_agent = payload.authority;
    let payload = IngestExternalIdAttestationRequestPayload {
        request_id: payload.request_id,
        code_verifier: payload.code_verifier,
        code: payload.code,
    };

    let zome_name = zome_info()?.name;
    let fn_name = FunctionName::from("ingest_external_id_attestation_request");
    let resp = call_remote(authority_agent, zome_name, fn_name, None, payload)?;
    match resp {
        ZomeCallResponse::Ok(result) => result.decode().map_err(|err| wasm_error!(err)),
        ZomeCallResponse::NetworkError(err) => Err(wasm_error!(WasmErrorInner::Guest(format!(
            "There was a network error: {:?}",
            err
        )))),
        ZomeCallResponse::Unauthorized(..) => {
            Err(wasm_error!(WasmErrorInner::Guest("Unauthorized".into())))
        }
        ZomeCallResponse::CountersigningSession(_) => Err(wasm_error!(WasmErrorInner::Guest(
            "Unexpected countersigning session".into()
        ))),
    }
}

/// Remote called by user seeking attestation
///
/// Whether or not the request is successful is messaged via a callback
#[hdk_extern]
pub fn ingest_external_id_attestation_request(
    payload: IngestExternalIdAttestationRequestPayload,
) -> ExternResult<()> {
    let signal = LocalHoloomSignal::ExternalIdAttestationRequested {
        request_id: payload.request_id,
        requestor_pubkey: call_info()?.provenance,
        code_verifier: payload.code_verifier,
        code: payload.code,
    };
    emit_signal(signal)?;
    Ok(())
}

//authority confirms the users request
#[hdk_extern]
pub fn confirm_external_id_request(
    payload: ConfirmExternalIdRequestPayload,
) -> ExternResult<Record> {
    let attestation = ExternalIdAttestation {
        request_id: payload.request_id.clone(),
        internal_pubkey: payload.requestor.clone(),
        external_id: payload.external_id,
        display_name: payload.display_name,
    };
    let result = create_external_id_attestation(attestation);
    let signal = match &result {
        Ok(record) => RemoteHoloomSignal::ExternalIdAttested {
            request_id: payload.request_id,
            record: record.clone(),
        },
        Err(err) => RemoteHoloomSignal::ExternalIdRejected {
            request_id: payload.request_id,
            reason: err.to_string(),
        },
    };
    let signal_encoded = ExternIO::encode(signal)
        .map_err(|err: SerializedBytesError| wasm_error!(WasmErrorInner::Serialize(err)))?;
    let recipients = vec![payload.requestor];
    send_remote_signal(signal_encoded, recipients)?;

    result
}

#[hdk_extern]
pub fn reject_external_id_request(payload: RejectExternalIdRequestPayload) -> ExternResult<()> {
    let signal = RemoteHoloomSignal::ExternalIdRejected {
        request_id: payload.request_id,
        reason: payload.reason,
    };
    let signal_encoded = ExternIO::encode(signal)
        .map_err(|err: SerializedBytesError| wasm_error!(WasmErrorInner::Serialize(err)))?;
    let recipients = vec![payload.requestor];
    send_remote_signal(signal_encoded, recipients)?;

    Ok(())
}

#[hdk_extern]
pub fn create_external_id_attestation(attestation: ExternalIdAttestation) -> ExternResult<Record> {
    let agent = attestation.internal_pubkey.clone();
    let external_id_hash = hash_identifier(attestation.external_id.clone())?;
    let attestation_action_hash = create_entry(EntryTypes::ExternalIdAttestation(attestation))?;
    create_link(
        agent,
        attestation_action_hash.clone(),
        LinkTypes::AgentToExternalIdAttestation,
        (),
    )?;
    create_link(
        external_id_hash,
        attestation_action_hash.clone(),
        LinkTypes::ExternalIdToAttestation,
        (),
    )?;
    let record = get(attestation_action_hash, GetOptions::network())?.ok_or(wasm_error!(
        WasmErrorInner::Guest(String::from(
            "Could not find the newly created ExternalIdAttestation"
        ))
    ))?;

    Ok(record)
}

#[hdk_extern]
pub fn get_external_id_attestation(external_id_ah: ActionHash) -> ExternResult<Option<Record>> {
    get(external_id_ah, GetOptions::network())
}

/// Gets any `ExternalIdAttestation`s known for the specified agent, ignoring and attestation by
/// non-trusted authorities.
#[hdk_extern]
pub fn get_external_id_attestations_for_agent(
    payload: GetExternalIdAttestationsForAgentPayload,
) -> ExternResult<Vec<Record>> {
    let mut links = get_links(
        GetLinksInputBuilder::try_new(
            payload.agent_pubkey,
            LinkTypes::AgentToExternalIdAttestation,
        )?
        .build(),
    )?;
    links.sort_by_key(|link| link.timestamp);
    let maybe_records = links
        .into_iter()
        .map(|link| {
            let action_hash = ActionHash::try_from(link.target).map_err(|_| {
                wasm_error!(WasmErrorInner::Guest(
                    "ExternalIdToAttestation link doesn't point at action".into()
                ))
            })?;
            get(action_hash, GetOptions::network())
        })
        .collect::<ExternResult<Vec<_>>>()?;
    Ok(maybe_records.into_iter().flatten().collect())
}

/// Gets the `ExternalIdAttestation` for the specified external ID, provided that the attestation
/// exists and was attested by a trusted author.
#[hdk_extern]
pub fn get_attestation_for_external_id(
    payload: GetAttestationForExternalIdPayload,
) -> ExternResult<Option<Record>> {
    let base = hash_identifier(payload.external_id)?;
    let mut links = get_links(
        GetLinksInputBuilder::try_new(base, LinkTypes::ExternalIdToAttestation)?.build(),
    )?;
    links.sort_by_key(|link| link.timestamp);

    let Some(link) = links
        .into_iter()
        .filter(|link| payload.trusted_authorities.contains(&link.author))
        .last()
    else {
        return Ok(None);
    };
    let action_hash = ActionHash::try_from(link.target).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "ExternalIdToAttestation link doesn't point at action".into()
        ))
    })?;
    get(action_hash, GetOptions::network())
}

/// Gets a `ExternalIdAttestation` `Record`s authored by the calling agent. This is intended to be
/// called by agents acting a authorities.
#[hdk_extern]
pub fn get_all_authored_external_id_ahs(_: ()) -> ExternResult<Vec<ActionHash>> {
    let entry_type: EntryType = UnitEntryTypes::ExternalIdAttestation
        .try_into()
        .expect("ExternalIdAttestation is an entry type");
    let filter = ChainQueryFilter::default()
        .entry_type(entry_type)
        .include_entries(false);
    let ahs = query(filter)?
        .into_iter()
        .map(|record| record.action_address().to_owned())
        .collect();
    Ok(ahs)
}

#[hdk_extern]
pub fn delete_external_id_attestation(
    original_attestation_hash: ActionHash,
) -> ExternResult<ActionHash> {
    delete_entry(original_attestation_hash)
}

/// Add your agent to the global external ID attestors list. The tag is used to indicate the
/// identity provider for which you attest identities.
#[hdk_extern]
pub fn register_as_external_id_attestor(tag: String) -> ExternResult<ActionHash> {
    create_link(
        hash_identifier("all_external_id_attestors".into())?,
        agent_info()?.agent_initial_pubkey,
        LinkTypes::ExternalIdAttestor,
        tag,
    )
}

/// Gets a list of `(agent, provider_name)` pairs representing all globally listed external ID
/// attestors.
///
/// The `agent` is the attestor, and the `provider_name` is a `String` that names the identity
/// provider for which they are attesting identities.
#[hdk_extern]
pub fn get_all_external_id_attestors(_: ()) -> ExternResult<Vec<(AgentPubKey, String)>> {
    let pairs = get_links(
        GetLinksInputBuilder::try_new(
            hash_identifier("all_external_id_attestors".into())?,
            LinkTypes::ExternalIdAttestor,
        )?
        .build(),
    )?
    .into_iter()
    .filter_map(|link| {
        let agent = AgentPubKey::try_from(link.target).ok()?;
        let provider_name = str::from_utf8(&link.tag.into_inner()).ok()?.to_string();
        Some((agent, provider_name))
    })
    .collect();
    Ok(pairs)
}
