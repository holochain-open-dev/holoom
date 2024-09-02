import {
  AppClient,
  decodeHashFromBase64,
  encodeHashToBase64,
} from "@holochain/client";
import {
  UsernameRegistryMetadataResponse,
  UsernameRegistryResponse,
  UsernameRegistryWalletsResponse,
} from "./types";
import { decodeAppEntry } from "./utils";
import {
  UsernameAttestation,
  UsernameRegistryCoordinator,
  WalletAttestation,
} from "@holoom/types";
import { bytesToHex, checksumAddress, Hex } from "viem";
import bs58 from "bs58";

export class QueryService {
  private usernameRegistryCoordinator: UsernameRegistryCoordinator;
  constructor(appClient: AppClient) {
    this.usernameRegistryCoordinator = new UsernameRegistryCoordinator(
      appClient
    );
  }

  async getUsernameRegistry() {
    const records =
      await this.usernameRegistryCoordinator.getAllAuthoredUsernameAttestations();
    const response: UsernameRegistryResponse = {
      success: true,
      items: records.map((record) => {
        const { username, agent } = decodeAppEntry<UsernameAttestation>(record);
        return { username, agent_pubkey_b64: encodeHashToBase64(agent) };
      }),
    };
    return response;
  }

  async getAgentWallets(agentPubkeyB64: string) {
    const records =
      await this.usernameRegistryCoordinator.getWalletAttestationsForAgent(
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
    return response;
  }

  async getAgentMetadata(agentPubkeyB64: string) {
    const metadata = await this.usernameRegistryCoordinator.getMetadata(
      decodeHashFromBase64(agentPubkeyB64)
    );

    const response: UsernameRegistryMetadataResponse = {
      success: true,
      metadata,
    };
    return response;
  }
}
