import dotenv from "dotenv";
import { AdminWebsocket, AppAgentWebsocket } from "@holochain/client";
// import { AccessTokenAssessor, ExternalIdAttestorClient } from "@holoom/client";
import { AccessTokenAssessor } from "./access-token-assessor.js";
import { ExternalIdAttestorClient } from "./external-id-attestor-client.js";
async function main() {
  dotenv.config();

  const getEnv = (name: string) => {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} env var not defined`);
    }
    return value;
  };

  const hostName = getEnv("HOLOCHAIN_HOST_NAME");

  const adminWebsocket = await AdminWebsocket.connect(
    new URL(`ws://${hostName}:${getEnv("HOLOCHAIN_ADMIN_WS_PORT")}`)
  );
  const _ = await adminWebsocket.listApps({}); // Is this necessary?
  const cellIds = await adminWebsocket.listCellIds();
  await adminWebsocket.authorizeSigningCredentials(cellIds[0]);

  const appAgentClient = await AppAgentWebsocket.connect(
    new URL(`ws://${hostName}:${getEnv("HOLOCHAIN_APP_WS_PORT")}`),
    getEnv("HOLOCHAIN_APP_ID")
  );

  const accessTokenAssessor = new AccessTokenAssessor({
    tokenEndpoint: getEnv("AUTH_TOKEN_ENDPOINT"),
    clientSecret: getEnv("AUTH_CLIENT_SECRET"),
    redirectUri: getEnv("AUTH_REDIRECT_URI"),
    userInfoEndpoint: getEnv("AUTH_USER_INFO_ENDPOINT"),
    externalIdFieldName: getEnv("AUTH_EXTERNAL_ID_FIELD_NAME"),
    displayNameFieldName: getEnv("AUTH_DISPLAY_NAME_FIELD_NAME"),
  });

  const _externalIdAttestorClient = new ExternalIdAttestorClient(
    appAgentClient,
    accessTokenAssessor
  );

  console.log("ExternalIdAttestorClient listening for incoming requests");
}

main().catch((err) => console.error(err));
