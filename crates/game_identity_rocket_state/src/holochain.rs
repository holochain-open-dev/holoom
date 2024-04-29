use game_identity_rocket_types::{error::*, result::*};

use holochain_client::{
    AdminWebsocket, AppAgentWebsocket, AppInfo, AppWebsocket, AuthorizeSigningCredentialsPayload,
    ClientAgentSigner,
};
use holochain_conductor_api::{CellInfo, ProvisionedCell};
use holochain_zome_types::{CellId, ExternIO};
use std::env;
use std::fmt::Debug;
use std::sync::Arc;

pub struct HolochainClient {
    pub app_agent_ws: AppAgentWebsocket,
    pub app_info: AppInfo,
}

#[derive(Clone)]
pub struct HolochainClientState {
    pub client: Arc<HolochainClient>,
}

pub async fn get_holochain_client_state() -> Result<HolochainClientState> {
    let client = HolochainClient::new_from_env().await?;
    let state = HolochainClientState {
        client: Arc::new(client),
    };
    Ok(state)
}

impl HolochainClient {
    pub async fn new_from_env() -> Result<Self> {
        let hostname =
            env::var("HOLOCHAIN_HOST_NAME").map_err(|_| ApiError::ServerConfigError {
                message: "env variable HOLOCHAIN_HOST_NAME is not defined".into(),
            })?;
        let admin_ws_port =
            env::var("HOLOCHAIN_ADMIN_WS_PORT").map_err(|_| ApiError::ServerConfigError {
                message: "env variable HOLOCHAIN_ADMIN_WS_PORT is not defined".into(),
            })?;
        let admin_ws_url = format!("ws://{}:{}", hostname, admin_ws_port);
        let app_ws_port =
            env::var("HOLOCHAIN_APP_WS_PORT").map_err(|_| ApiError::ServerConfigError {
                message: "env variable HOLOCHAIN_APP_WS_PORT is not defined".into(),
            })?;
        let app_ws_url = format!("ws://{}:{}", hostname, app_ws_port);
        let app_id = env::var("HOLOCHAIN_APP_ID").map_err(|_| ApiError::ServerConfigError {
            message: "env variable HOLOCHAIN_APP_ID is not defined".into(),
        })?;
        let role_names: Vec<String> = env::var("HOLOCHAIN_CELL_ROLES")
            .map_err(|_| ApiError::ServerConfigError {
                message: "env variable HOLOCHAIN_CELL_ROLES is not defined".into(),
            })?
            .split(',')
            .map(String::from)
            .collect();
        if role_names.is_empty() {
            return Err(ApiError::ServerConfigError {
                message: "HOLOCHAIN_CELL_ROLES is empty".into(),
            });
        }

        Self::new(admin_ws_url, app_ws_url, app_id, role_names).await
    }

    pub async fn new(
        admin_ws_url: String,
        app_ws_url: String,
        app_id: String,
        role_names: Vec<String>,
    ) -> Result<Self> {
        // Setup AdminWebsocket
        rocket::debug!("Connecting to AdminWebsocket: {}", &admin_ws_url);
        let mut admin_ws =
            AdminWebsocket::connect(admin_ws_url)
                .await
                .map_err(|err| ApiError::Holochain {
                    message: format!(
                        "Failed to connect to holochain admin websocket with error: {:?}",
                        err
                    ),
                })?;

        // Setup AppWebsocket
        rocket::debug!("Connecting to AppWebsocket: {}", &app_ws_url);
        let mut app_ws =
            AppWebsocket::connect(app_ws_url)
                .await
                .map_err(|err| ApiError::Holochain {
                    message: format!(
                        "Failed to connect to holochain app websocket with error: {:?}",
                        err
                    ),
                })?;

        // Get app info & agent pub key
        let app_info = app_ws
            .app_info(app_id.clone())
            .await
            .map_err(|e| ApiError::Holochain {
                message: format!("Failed to get app info for app-id '{}': {:?}", &app_id, e),
            })?
            .ok_or(ApiError::Holochain {
                message: "App info is None".into(),
            })?;

        // Setup signing credentials
        let mut signer = ClientAgentSigner::default();
        for role_name in role_names {
            let cell_id = Self::role_name_to_cell_id(&app_info, role_name)?;

            let credentials = admin_ws
                .authorize_signing_credentials(AuthorizeSigningCredentialsPayload {
                    cell_id: cell_id.clone(),
                    functions: None,
                })
                .await
                .unwrap();
            signer.add_credentials(cell_id, credentials);
        }

        let app_agent_ws = AppAgentWebsocket::from_existing(app_ws, app_id, signer.into())
            .await
            .unwrap();
        Ok(HolochainClient {
            app_agent_ws,
            app_info,
        })
    }

    pub async fn call_zome<'a, I, O>(
        &self,
        role_name: &str,
        zome_name: &str,
        fn_name: &str,
        payload: I,
    ) -> Result<O>
    where
        I: serde::Serialize + Debug,
        O: serde::de::DeserializeOwned + Debug,
    {
        rocket::debug!("CALL ZOME:\nrole: {role_name}\nzome: {zome_name}\nfn: {fn_name}\n payload: {payload:#?}");

        // Prepare Unsigned Zome Call
        let cell_id = Self::role_name_to_cell_id(&self.app_info, role_name.into())?;

        let payload = ExternIO::encode(payload).map_err(|_| ApiError::Holochain {
            message: "Failed to encode zome call payload".into(),
        })?;

        // Send Zome Call

        let result = self
            .app_agent_ws
            .clone()
            .call_zome(cell_id.into(), zome_name.into(), fn_name.into(), payload)
            .await
            .map_err(|e| ApiError::HolochainConductor {
                message: format!("{:?}", e),
            })?;

        let output = ExternIO::decode(&result).map_err(|_| ApiError::Holochain {
            message: "Failed to decode zome call result".into(),
        })?;

        Ok(output)
    }

    fn role_name_to_cell_id(app_info: &AppInfo, role_name: String) -> Result<CellId> {
        let cell_info = &app_info
            .cell_info
            .get(&role_name)
            .ok_or(ApiError::Holochain {
                message: format!("Cell with role_name {} not found", role_name),
            })?
            .clone();

        let provisioned_cell_info: Vec<ProvisionedCell> = cell_info
            .iter()
            .filter_map(|ci| -> Option<ProvisionedCell> {
                match ci {
                    CellInfo::Provisioned(provisioned_cell) => Some(provisioned_cell.clone()),
                    _ => None,
                }
            })
            .collect();

        let first_provisioned_cell_info =
            provisioned_cell_info.first().ok_or(ApiError::Holochain {
                message: format!("Provisioned Cell with role_name {} not found", role_name),
            })?;

        Ok(first_provisioned_cell_info.clone().cell_id)
    }
}
