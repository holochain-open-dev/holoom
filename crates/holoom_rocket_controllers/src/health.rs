use holoom_rocket_types::{endpoint::BlankResponse, result::JsonResult};
use rocket::{get, serde::json::Json};
use rocket_okapi::openapi;

/// #
/// ## Confirm the API is alive
///
/// *This is intended to be called by tests or monitoring services.*
///
/// Always returns a blank success response.
#[openapi(tag = "health")]
#[get("/health")]
pub fn bare() -> JsonResult<BlankResponse> {
    Ok(Json(BlankResponse { success: true }))
}

#[get("/")]
pub fn home() -> String {
    String::from("OK")
}
