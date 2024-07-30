use hdk::prelude::*;
use holoom_types::{
    ConfirmExternalIdRequestPayload, ExternalIdAttestation,
    IngestExternalIdAttestationRequestPayload, LocalHoloomSignal, RejectExternalIdRequestPayload,
    RemoteHoloomSignal, SendExternalIdAttestationRequestPayload,
};
use username_registry_integrity::{EntryTypes, LinkTypes, UnitEntryTypes};
use username_registry_utils::{get_authority_agent, hash_identifier};

#[hdk_extern]
pub fn send_external_id_attestation_request(
    payload: SendExternalIdAttestationRequestPayload,
) -> ExternResult<()> {
    let payload = IngestExternalIdAttestationRequestPayload {
        request_id: payload.request_id,
        code_verifier: payload.code_verifier,
        code: payload.code,
    };

    let authority_agent = get_authority_agent()?;

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

#[hdk_extern]
pub fn get_external_id_attestations_for_agent(
    agent_pubkey: AgentPubKey,
) -> ExternResult<Vec<Record>> {
    let links = get_links(
        GetLinksInputBuilder::try_new(agent_pubkey, LinkTypes::AgentToExternalIdAttestation)?
            .build(),
    )?;
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

#[hdk_extern]
pub fn get_attestation_for_external_id(external_id: String) -> ExternResult<Option<Record>> {
    let base = hash_identifier(external_id)?;
    let mut links = get_links(
        GetLinksInputBuilder::try_new(base, LinkTypes::ExternalIdToAttestation)?.build(),
    )?;
    links.sort_by_key(|link| link.timestamp);
    let Some(link) = links.pop() else {
        return Ok(None);
    };
    let action_hash = ActionHash::try_from(link.target).map_err(|_| {
        wasm_error!(WasmErrorInner::Guest(
            "ExternalIdToAttestation link doesn't point at action".into()
        ))
    })?;
    get(action_hash, GetOptions::network())
}

#[hdk_extern]
pub fn get_all_external_id_ahs(_: ()) -> ExternResult<Vec<ActionHash>> {
    if agent_info()?.agent_initial_pubkey != get_authority_agent()? {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "Only callable by authority agent".into()
        )));
    }
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
