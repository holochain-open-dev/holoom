import {
  AdminWebsocket,
  AppCallZomeRequest,
  AppWebsocket,
  encodeHashToBase64,
  getSigningCredentials,
  InstallAppRequest,
} from "@holochain/client";

export async function ensureHapp(
  adminWs: AdminWebsocket,
  happPath: string,
  networkSeed: string,
  allowedOrigins = "holoom"
): Promise<AppWebsocket> {
  const apps = await adminWs.listApps({});
  if (!apps.some((info) => info.installed_app_id === "holoom")) {
    // App not installed
    await installHapp(adminWs, happPath, networkSeed, allowedOrigins);
  }

  const appInterfaces = await adminWs.listAppInterfaces();
  const holoomAppInterface = appInterfaces.find(
    (appInterface) => appInterface.installed_app_id === "holoom"
  );
  if (!holoomAppInterface) {
    throw new Error("Could not find app interface for holoom");
  }

  const issuedToken = await adminWs.issueAppAuthenticationToken({
    installed_app_id: "holoom",
  });
  console.log("Issued token");

  const appWs = await AppWebsocket.connect({
    url: new URL(`http://localhost:${holoomAppInterface.port}`),
    wsClientOptions: { origin: "holoom" },
    token: issuedToken.token,
  });

  // set up automatic zome call signing
  const callZome = appWs.callZome.bind(appWs);
  appWs.callZome = async (req: AppCallZomeRequest, timeout?: number) => {
    let cellId;
    if ("role_name" in req) {
      if (!appWs.cachedAppInfo) {
        throw new Error("appWs.cachedAppInfo not set");
      }
      cellId = appWs.getCellIdFromRoleName(req.role_name, appWs.cachedAppInfo);
    } else {
      cellId = req.cell_id;
    }
    if (!getSigningCredentials(cellId)) {
      await adminWs.authorizeSigningCredentials(cellId);
    }
    return callZome(req, timeout);
  };

  return appWs;
}

async function installHapp(
  adminWs: AdminWebsocket,
  happPath: string,
  networkSeed: string,
  allowedOrigins: string
) {
  const agentPubkey = await adminWs.generateAgentPubKey();

  const installAppRequest: InstallAppRequest = {
    path: happPath,
    agent_key: agentPubkey,
    membrane_proofs: {},
    installed_app_id: "holoom",
    network_seed: networkSeed,
  };
  console.debug(
    `installing holoom for agent ${encodeHashToBase64(agentPubkey)}`
  );
  await adminWs.installApp(installAppRequest);
  const resp = await adminWs.enableApp({
    installed_app_id: "holoom",
  });
  console.log("enableApp", resp);
  await adminWs.attachAppInterface({
    allowed_origins: allowedOrigins,
    installed_app_id: "holoom",
  });
}
