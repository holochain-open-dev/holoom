use game_identity_rocket_controllers as controllers;
use game_identity_rocket_state as state;
use rocket_cors::catch_all_options_routes;
use rocket_okapi::openapi_get_routes;
use rocket_okapi::swagger_ui::{make_swagger_ui, SwaggerUIConfig};
use std::env;
use std::error::Error;

mod utils;

fn get_docs() -> SwaggerUIConfig {
    SwaggerUIConfig {
        url: "/openapi.json".to_string(),
        deep_linking: true,
        ..Default::default()
    }
}

#[rocket::main]
async fn main() -> Result<(), Box<dyn Error>> {
    // Setup Holochain app agent
    let holochain_state = state::holochain::get_holochain_client_state().await?;

    // Setup CORs fairing
    let cors = utils::cors::create_cors_fairing()?;

    // Setup & Create rocket app
    rocket::build()
        .attach(cors.clone())
        .manage(cors)
        .manage(holochain_state)
        .mount(
            "/",
            openapi_get_routes![
                controllers::username_registry::bare,
                controllers::username_registry::wallets,
                controllers::username_registry::metadata,
                controllers::health::bare,
                controllers::holochain::app_info,
                controllers::holochain::ping,
            ],
        )
        .mount("/swagger", make_swagger_ui(&get_docs()))
        .mount("/", catch_all_options_routes())
        .mount("/", rocket::routes![controllers::health::home])
        .launch()
        .await?;

    Ok(())
}
