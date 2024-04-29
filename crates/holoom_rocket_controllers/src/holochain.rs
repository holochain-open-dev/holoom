use holoom_rocket_state::holochain::HolochainClientState;
use holoom_rocket_types::{endpoint::*, result::*};
use rocket::{get, serde::json::Json, State};
use rocket_okapi::openapi;

/// #
/// ## Get the App Info from the connected holochain conductor
///
/// *This is intended for internal testing only.*
///
#[openapi(tag = "holochain")]
#[get("/holochain/app_info")]
pub async fn app_info(
    holochain_state: &State<HolochainClientState>,
) -> JsonResult<AppInfoResponse> {
    let app_info = holochain_state.client.app_info.clone();

    Ok(Json(AppInfoResponse {
        installed_app_id: app_info.installed_app_id,
    }))
}

/// #
/// ## Call 'ping' on conductor via signed zome call
///
/// *This is intended for internal testing only.*
///
#[openapi(tag = "holochain")]
#[get("/holochain/ping")]
pub async fn ping(holochain_state: &State<HolochainClientState>) -> JsonResult<BlankResponse> {
    holochain_state
        .client
        .call_zome::<(), ()>("holoom", "ping", "ping", ())
        .await?;

    Ok(Json(BlankResponse { success: true }))
}
