import dotenv from "dotenv";
import { AdminWebsocket, AppWebsocket } from "@holochain/client";
import express, { Request, Response } from "express";
import { QueryService } from "./service";

export async function runQueryFromEnv() {
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
  const queryService = new QueryService(appAgentClient);

  const app = express();
  app.use(express.json());

  app.get("/username_registry", async (req: Request, res: Response) => {
    console.log("GET: /username_registry");

    try {
      const response = queryService.getUsernameRegistry();
      res.status(200).send(response);
    } catch (error) {
      console.error({ error });
      res.status(500).send({
        success: false,
        error_type: "TODO",
        message: (error as any).message,
      });
    }
  });

  app.get(
    "/username_registry/:agentPubkeyB64/wallets",
    async (req: Request, res: Response) => {
      const { agentPubkeyB64 } = req.params;
      console.log(`GET: /username_registry/${agentPubkeyB64}/wallets`);

      try {
        const response = queryService.getAgentWallets(agentPubkeyB64);
        res.status(200).send(response);
      } catch (error) {
        console.error({ error });
        res.status(500).send({
          success: false,
          error_type: "TODO",
          message: (error as any).message,
        });
      }
    }
  );

  app.get(
    "/username_registry/:agentPubkeyB64/metadata",
    async (req: Request, res: Response) => {
      const { agentPubkeyB64 } = req.params;
      console.log(`GET: /username_registry/${agentPubkeyB64}/metadata`);

      try {
        const response = queryService.getAgentMetadata(agentPubkeyB64);
        res.status(200).send(response);
      } catch (error) {
        console.error({ error });
        res.status(500).send({
          success: false,
          error_type: "TODO",
          message: (error as any).message,
        });
      }
    }
  );

  const port = getEnv("PORT");
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}
