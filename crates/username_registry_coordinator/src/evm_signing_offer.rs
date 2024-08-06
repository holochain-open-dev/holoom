use hdk::prelude::*;
use holoom_types::{
    evm_signing_offer::{
        CreateEvmSigningOfferPayload, EvmSignatureOverRecipeExecutionRequest, EvmU256, EvmU256Item,
        RejectEvmSignatureOverRecipeExecutionRequestPayload,
        ResolveEvmSignatureOverRecipeExecutionRequestPayload, SignedEvmSigningOffer,
    },
    recipe::RecipeExecution,
    EvmAddress, LocalHoloomSignal, RemoteHoloomSignal,
};
use jaq_wrapper::{parse_single_json, Val};
use username_registry_integrity::{EntryTypes, LinkTypes};
use username_registry_utils::{deserialize_record_entry, hash_evm_address, hash_identifier};

#[hdk_extern]
fn create_signed_evm_signing_offer(payload: CreateEvmSigningOfferPayload) -> ExternResult<Record> {
    let action_hash = create_entry(EntryTypes::SignedEvmSigningOffer(
        payload.signed_offer.clone(),
    ))?;
    create_link(
        hash_identifier(payload.identifier)?,
        action_hash.clone(),
        LinkTypes::NameToSigningOffer,
        (),
    )?;
    create_link(
        hash_evm_address(payload.signed_offer.signer)?,
        action_hash.clone(),
        LinkTypes::EvmAddressToSigningOffer,
        (),
    )?;
    get(action_hash, GetOptions::network())?.ok_or(wasm_error!(WasmErrorInner::Guest(
        "Couldn't get newly created EvmSigningOffer Record".into()
    )))
}

#[hdk_extern]
pub fn get_latest_evm_signing_offer_ah_for_name(name: String) -> ExternResult<Option<ActionHash>> {
    let base_address = hash_identifier(name)?;
    let mut links = get_links(
        GetLinksInputBuilder::try_new(base_address, LinkTypes::NameToSigningOffer)?.build(),
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
pub fn get_signing_offer_ahs_for_evm_address(
    evm_address: EvmAddress,
) -> ExternResult<Vec<ActionHash>> {
    let base_address = hash_evm_address(evm_address)?;
    let mut links = get_links(
        GetLinksInputBuilder::try_new(base_address, LinkTypes::EvmAddressToSigningOffer)?.build(),
    )?;
    links.sort_by_key(|link| link.timestamp);
    let ahs = links
        .into_iter()
        .filter_map(|link| ActionHash::try_from(link.target).ok())
        .collect();
    Ok(ahs)
}

#[hdk_extern]
fn send_request_for_evm_signature_over_recipe_execution(
    request: EvmSignatureOverRecipeExecutionRequest,
) -> ExternResult<()> {
    let signing_offer_record = get(request.signing_offer_ah.clone(), GetOptions::network())?
        .ok_or(wasm_error!(WasmErrorInner::Guest(
            "EvmSigningOffer not found".into()
        )))?;
    let signing_agent = signing_offer_record.action().author().clone();
    let zome_name: ZomeName = zome_info()?.name;
    let fn_name = FunctionName::from("ingest_evm_signature_over_recipe_execution_request");
    let resp = call_remote(signing_agent, zome_name, fn_name, None, request)?;
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

#[hdk_extern]
fn ingest_evm_signature_over_recipe_execution_request(
    payload: EvmSignatureOverRecipeExecutionRequest,
) -> ExternResult<()> {
    let signing_offer_record = get(payload.signing_offer_ah, GetOptions::network())?.ok_or(
        wasm_error!(WasmErrorInner::Guest("EvmSigningOffer not found".into())),
    )?;
    let signed_signing_offer: SignedEvmSigningOffer =
        deserialize_record_entry(signing_offer_record)?;
    let recipe_execution_record = get(payload.recipe_execution_ah, GetOptions::network())?.ok_or(
        wasm_error!(WasmErrorInner::Guest("RecipeExecution not found".into())),
    )?;
    let recipe_execution: RecipeExecution = deserialize_record_entry(recipe_execution_record)?;

    if recipe_execution.recipe_ah != signed_signing_offer.offer.recipe_ah {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "Executed Recipe doesn't match signing offer".into()
        )));
    }
    let Val::Arr(output_vec) = parse_single_json(&recipe_execution.output)? else {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "Recipe output isn't an array".into()
        )))?;
    };
    if output_vec.len() != signed_signing_offer.offer.u256_items.len() {
        return Err(wasm_error!(WasmErrorInner::Guest(
            "Unexpected u256 count for signing".into()
        )))?;
    }
    let u256_array = output_vec
        .iter()
        .zip(signed_signing_offer.offer.u256_items.into_iter())
        .map(|pair| match pair {
            (Val::Str(hex_string), EvmU256Item::Hex) => EvmU256::from_str_radix(&hex_string, 16)
                .map_err(|_| wasm_error!(WasmErrorInner::Guest("Invalid hex string".into()))),
            (Val::Int(value), EvmU256Item::Uint) => {
                if *value < 0 {
                    Err(wasm_error!(WasmErrorInner::Guest(
                        "Negative ints unsupported".into()
                    )))
                } else {
                    Ok(EvmU256::from(*value))
                }
            }
            (Val::Str(b64_string), EvmU256Item::HoloAgent) => {
                let hash = AgentPubKey::try_from(b64_string.as_str()).map_err(|_| {
                    wasm_error!(WasmErrorInner::Guest(
                        "Invalid AgentPubKey b64 string".into()
                    ))
                })?;
                let value = EvmU256::from_be_slice(hash.get_raw_32());
                Ok(value)
            }
            _ => Err(wasm_error!(WasmErrorInner::Guest(
                "Invalid U256 array element".into()
            ))),
        })
        .collect::<ExternResult<Vec<_>>>()?;

    let signal = LocalHoloomSignal::EvmSignatureRequested {
        request_id: payload.request_id,
        requestor_pubkey: call_info()?.provenance,
        u256_array,
    };
    emit_signal(signal)?;
    Ok(())
}

#[hdk_extern]
pub fn resolve_evm_signature_over_recipe_execution_request(
    payload: ResolveEvmSignatureOverRecipeExecutionRequestPayload,
) -> ExternResult<()> {
    let signal = RemoteHoloomSignal::EvmSignatureProvided {
        request_id: payload.request_id,
        signed_u256_array: payload.signed_u256_array,
    };
    let signal_encoded = ExternIO::encode(signal)
        .map_err(|err: SerializedBytesError| wasm_error!(WasmErrorInner::Serialize(err)))?;
    let recipients = vec![payload.requestor];
    send_remote_signal(signal_encoded, recipients)?;

    Ok(())
}

#[hdk_extern]
pub fn reject_evm_signature_over_recipe_execution_request(
    payload: RejectEvmSignatureOverRecipeExecutionRequestPayload,
) -> ExternResult<()> {
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
