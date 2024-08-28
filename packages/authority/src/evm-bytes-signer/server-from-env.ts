import dotenv from "dotenv";
import { AdminWebsocket, AppWebsocket } from "@holochain/client";
import { BytesSigner } from "./bytes-signer.js";
import { EvmBytesSignerClient } from "./evm-bytes-signer-client.js";
import express, { Request, Response } from "express";
import { OfferCreator } from "./offer-creator.js";

export async function runEvmBytesSignerFromEnv() {
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

  const bytesSigner = new BytesSigner(getEnv("EVM_PRIVATE_KEY"));

  const _evmBytesSignerClient = new EvmBytesSignerClient(
    appAgentClient,
    bytesSigner
  );

  const offerCreator = new OfferCreator(appAgentClient, bytesSigner);

  console.log("EvmBytesSignerClient listening for incoming requests");

  const app = express();
  app.use(express.json());
  app.post("/evm-signing-offer", async (req: Request, res: Response) => {
    if (req.headers.authorization !== `Bearer ${getEnv("ADMIN_TOKEN")}`) {
      console.log("Unauthorized");
      return res.status(401).send();
    }
    console.log("POST: /evm-signing-offer", req.body);

    try {
      const actionHash = await offerCreator.createOffer(
        req.body.identifier,
        req.body.evm_signing_offer.recipe_ah,
        req.body.evm_signing_offer.u256_items
      );
      res.status(200).send({ actionHash });
    } catch (err) {
      console.error(err);
      res.status(500).send({ err });
    }
  });
  const port = getEnv("PORT");
  app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });
}
