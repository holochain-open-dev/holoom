import dotenv from "dotenv";
import { AdminWebsocket, AppWebsocket } from "@holochain/client";
import express, { Request, Response } from "express";

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

  const app = express();
  app.use(express.json());

  app.post("/webhook-ingress", async (req: Request, res: Response) => {
    console.log("Incoming webhook invocation");
    const payload = req.body;
    if (!("type" in payload) || !("data" in payload)) {
      res.status(400).send();
    }
    const identifier = getIdentifier(payload.type)(payload.data);
    const relations = getRelations(payload.type)(payload.data);
    await appAgentClient.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "create_oracle_document",
      payload: {
        name: identifier,
        json_data: JSON.stringify(payload.data),
      },
    });
    console.log("Created oracle document");
    for (const relation of relations) {
      await appAgentClient.callZome({
        role_name: "holoom",
        zome_name: "username_registry",
        fn_name: "relate_oracle_document",
        payload: {
          relation,
          identifier,
          name: identifier,
        },
      });
      console.log("Added oracle document relation");
    }
    res.status(200).send();
  });

  const PORT = getEnv("PORT");
  app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
  });
}

const getIdentifier = (type: string) => {
  switch (type) {
    case "match_created":
    case "match_updated":
    case "match_finished":
      return (data: { id: string }) => `match/${data.id}`;
    case "tournament_created":
    case "tournament_updated":
    case "tournament_finished":
      return (data: { id: string }) => `tournament/${data.id}`;
    default:
      throw new Error("Unknown event type");
  }
};

const getRelations = (type: string) => {
  switch (type) {
    case "match_created":
    case "match_updated":
    case "match_finished":
      return (data: { tournament_id: string }) => [
        `tournament/${data.tournament_id}/match`,
      ];
    case "tournament_created":
    case "tournament_updated":
    case "tournament_finished":
      return () => ["tournaments"];
    default:
      throw new Error("Unknown event type");
  }
};

main().catch((err) => console.error(err));
