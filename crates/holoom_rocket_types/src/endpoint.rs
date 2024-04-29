use std::collections::HashMap;

use rocket_okapi::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, JsonSchema, PartialEq, Eq, Debug)]
pub struct BlankRequest {
    pub auth_token: String,
}

#[derive(Serialize, Deserialize, JsonSchema, PartialEq, Eq, Debug)]
pub struct BlankResponse {
    pub success: bool,
}
unsafe impl Send for BlankResponse {}

#[derive(Serialize, Deserialize, JsonSchema, PartialEq, Eq, Debug)]
pub struct AppInfoResponse {
    pub installed_app_id: String,
}
unsafe impl Send for AppInfoResponse {}

#[derive(Serialize, Deserialize, JsonSchema, PartialEq, Eq, Debug)]
pub struct UsernameRegistryItem {
    pub agent_pubkey_b64: String,
    pub username: String,
}

#[derive(Serialize, Deserialize, JsonSchema, PartialEq, Eq, Debug)]
pub struct UsernameRegistryResponse {
    pub success: bool,
    pub items: Vec<UsernameRegistryItem>,
}
unsafe impl Send for UsernameRegistryResponse {}

#[derive(Serialize, Deserialize, JsonSchema, PartialEq, Eq, Debug)]
pub struct UsernameRegistryWalletsResponse {
    pub success: bool,
    pub evm_addresses: Vec<String>,
    pub solana_addresses: Vec<String>,
}
unsafe impl Send for UsernameRegistryWalletsResponse {}

#[derive(Serialize, Deserialize, JsonSchema, PartialEq, Eq, Debug)]
pub struct UsernameRegistryMetadataResponse {
    pub success: bool,
    pub metadata: HashMap<String, String>,
}
unsafe impl Send for UsernameRegistryMetadataResponse {}
