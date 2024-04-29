use rocket::http::Method;
use rocket_cors::{AllowedOrigins, Cors, Error};

pub fn create_cors_fairing() -> Result<Cors, Error> {
    rocket_cors::CorsOptions {
        allowed_origins: AllowedOrigins::all(),
        allowed_methods: vec![
            Method::Get,
            Method::Post,
            Method::Patch,
            Method::Options,
            Method::Put,
        ]
        .into_iter()
        .map(From::from)
        .collect(),
        send_wildcard: true,
        allow_credentials: false,
        ..Default::default()
    }
    .to_cors()
}
