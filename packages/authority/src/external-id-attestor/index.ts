import dotenv from "dotenv";
import { AdminWebsocket, AppWebsocket } from "@holochain/client";
import { AccessTokenAssessor } from "./access-token-assessor.js";
import { ExternalIdAttestorClient } from "./external-id-attestor-client.js";

export async function runExternalIdAttestorFromEnv() {
  dotenv.config();

  const getEnv = (name: string) => {
    const value = process.env[name];
    if (!value) {
      throw new Error(`${name} env var not defined`);
    }
    return value;
  };

  const hostName = getEnv("HOLOCHAIN_HOST_NAME");

  const adminWebsocket = await AdminWebsocket.connect({
    url: new URL(`ws://${hostName}:${getEnv("HOLOCHAIN_ADMIN_WS_PORT")}`),
    wsClientOptions: { origin: "holoom" },
  });
  const cellIds = await adminWebsocket.listCellIds();
  await adminWebsocket.authorizeSigningCredentials(cellIds[0]);
  const issuedToken = await adminWebsocket.issueAppAuthenticationToken({
    installed_app_id: getEnv("HOLOCHAIN_APP_ID"),
  });
  const appAgentClient = await AppWebsocket.connect({
    url: new URL(`ws://${hostName}:${getEnv("HOLOCHAIN_APP_WS_PORT")}`),
    wsClientOptions: { origin: "holoom" },
    token: issuedToken.token,
  });

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
