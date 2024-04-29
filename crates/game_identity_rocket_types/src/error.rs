use holochain_client::ConductorApiError;
use rocket::debug;
use rocket::{
    http::{ContentType, Status},
    response::{self, Responder, Response},
    serde::{json::serde_json, Serialize},
    Request,
};
use rocket_okapi::okapi::openapi3::Responses;
use rocket_okapi::okapi::schemars::{self, Map};
use rocket_okapi::{gen::OpenApiGenerator, response::OpenApiResponderInner, OpenApiError};
use schemars::JsonSchema;
use serde_variant::to_variant_name;
use snafu::prelude::*;
use strum::IntoEnumIterator;
use strum_macros::EnumIter;

#[derive(Debug, Snafu, JsonSchema, EnumIter, Serialize)]
pub enum ApiError {
    #[snafu(display("AgentPubKey is not valid {}", agent_pubkey_b64))]
    AgentPubKeyB64Invalid { agent_pubkey_b64: String },

    #[snafu(display("Holochain Error: {}", message))]
    Holochain { message: String },

    #[snafu(display("Holochain Conductor Api Error: {}", message))]
    HolochainConductor { message: String },

    #[snafu(display("Api IO Error"))]
    IoError,

    #[snafu(display("Api Parse Error"))]
    ParseError,

    #[snafu(display("Server Config Error: {}", message))]
    ServerConfigError { message: String },
}

#[allow(clippy::all)]
impl OpenApiResponderInner for ApiError {
    fn responses(_generator: &mut OpenApiGenerator) -> Result<Responses, OpenApiError> {
        use rocket_okapi::okapi::openapi3::{RefOr, Response as OpenApiReponse};

        let mut responses = Map::new();

        let error_descriptions: Vec<String> = ApiError::iter()
            .map(|e| format!("| {} | {} |", to_variant_name(&e).unwrap().to_string(), e))
            .collect();

        responses.insert(
            "400".to_string(),
            RefOr::Object(OpenApiReponse {
                description: format!(
                    "
### Application Error Responses (HTTP Error Code 400)

JSON Response Format:
```json
{{
    success: false,
    error_type: \"InvalidAuthToken\",
    message: \"Invalid auth token\"
}}
```

</br>
</br>
### All Error Types
| error_type | message |
| ----- | ------- |
{}

",
                    error_descriptions.join("\n")
                ),
                ..Default::default()
            }),
        );

        Ok(Responses {
            responses,
            ..Default::default()
        })
    }
}

#[derive(Serialize, Debug, Clone)]
struct ApiErrorJson {
    success: bool,
    error_type: String,
    message: String,
}

impl<'r> Responder<'r, 'static> for ApiError {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        // Prepare error
        let error = ApiErrorJson {
            success: false,
            error_type: to_variant_name(&self).unwrap().to_string(),
            message: format!("{}", self),
        };

        // Convert object to json
        let body = serde_json::to_string(&error).unwrap();

        debug!("RESPONSE API ERROR {:?}", error);

        Response::build()
            .sized_body(body.len(), std::io::Cursor::new(body))
            .header(ContentType::JSON)
            .status(Status::new(400))
            .ok()
    }
}

impl From<rocket::serde::json::Error<'_>> for ApiError {
    fn from(err: rocket::serde::json::Error) -> Self {
        use rocket::serde::json::Error::*;
        match err {
            Io(_io_error) => ApiError::IoError,
            Parse(_raw_data, _parse_error) => ApiError::ParseError,
        }
    }
}

impl From<ConductorApiError> for ApiError {
    fn from(err: ConductorApiError) -> Self {
        ApiError::Holochain {
            message: format!("{:?}", err),
        }
    }
}
