import dotenv from "dotenv";
import {
  AdminWebsocket,
  AgentPubKey,
  AppWebsocket,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
import express, { Request, Response } from "express";
import {
  UsernameRegistryMetadataResponse,
  UsernameRegistryResponse,
  UsernameRegistryWalletsResponse,
} from "./types";
import { decodeAppEntry } from "./utils";
import { UsernameRegistryCoordinator, WalletAttestation } from "@holoom/types";
import { bytesToHex, checksumAddress, Hex } from "viem";
import bs58 from "bs58";

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
  const usernameRegistryCoordinator = new UsernameRegistryCoordinator(
    appAgentClient
  );

  console.log("EvmBytesSignerClient listening for incoming requests");

  const app = express();
  app.use(express.json());

  app.get("/username_registry", async (req: Request, res: Response) => {
    console.log("GET: /username_registry");

    try {
      const records =
        await usernameRegistryCoordinator.getAllUsernameAttestations();
      const response: UsernameRegistryResponse = {
        success: true,
        items: records.map((record) => {
          const { username, agent } = decodeAppEntry<{
            username: string;
            agent: AgentPubKey;
          }>(record);
          return { username, agent_pubkey_b64: encodeHashToBase64(agent) };
        }),
      };
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
        const records =
          await usernameRegistryCoordinator.getWalletAttestationsForAgent(
            decodeHashFromBase64(agentPubkeyB64)
          );

        const attestations = records.map(decodeAppEntry<WalletAttestation>);

        const evm_addresses = attestations
          .map((a) =>
            "Evm" in a.chain_wallet_signature
              ? checksumAddress(
                  bytesToHex(a.chain_wallet_signature.Evm.evm_address)
                )
              : null
          )
          .filter((address): address is Hex => !!address);

        const solana_addresses = attestations
          .map((a) =>
            "Solana" in a.chain_wallet_signature
              ? bs58.encode(a.chain_wallet_signature.Solana.solana_address)
              : null
          )
          .filter((address): address is string => !!address);

        const response: UsernameRegistryWalletsResponse = {
          success: true,
          evm_addresses,
          solana_addresses,
        };
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
        const metadata = await usernameRegistryCoordinator.getMetadata(
          decodeHashFromBase64(agentPubkeyB64)
        );

        const response: UsernameRegistryMetadataResponse = {
          success: true,
          metadata,
        };
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
