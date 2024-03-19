import {
  encodeHashToBase64,
  type AppAgentWebsocket,
  Record,
} from "@holochain/client";
import type { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import {
  BoundWallet,
  ChainWalletSignature_Evm,
  ChainWalletSignature_Solana,
  UsernameAttestation,
  WalletAttestation,
} from "./types";
import { decodeAppEntry, formatEvmSignature } from "./utils";
import {
  getAddress as checksumCaseAddress,
  bytesToHex,
  hexToBytes,
  Hex,
} from "viem";
import bs58 from "bs58";

export class HolochainGameIdentityClient {
  constructor(readonly appAgent: AppAgentWebsocket) {}

  async getUsername(): Promise<string | null> {
    const record = await this.appAgent.callZome({
      role_name: "game_identity",
      zome_name: "username_registry",
      fn_name: "get_username_attestation_for_agent",
      payload: this.appAgent.myPubKey,
    });
    if (!record) {
      return null;
    }
    const entry = decodeAppEntry<UsernameAttestation>(record);

    return entry.username;
  }

  async registerUsername(username: string) {
    await this.appAgent.callZome({
      role_name: "game_identity",
      zome_name: "username_registry",
      fn_name: "sign_username_to_attest",
      payload: username,
    });
  }

  getEvmWalletBindingMessage(evmAddress: Hex) {
    const checksummed = checksumCaseAddress(evmAddress);
    const agentB64 = encodeHashToBase64(this.appAgent.myPubKey);
    return `Bind wallet ${checksummed} to Holochain public key ${agentB64}`;
  }

  async submitEvmWalletBinding(evmAddress: Hex, evmSignature: Hex) {
    const chain_wallet_signature: ChainWalletSignature_Evm = {
      Evm: {
        evm_address: hexToBytes(evmAddress),
        evm_signature: formatEvmSignature(evmSignature),
      },
    };
    await this.appAgent.callZome({
      role_name: "game_identity",
      zome_name: "username_registry",
      fn_name: "create_wallet_attestation",
      payload: {
        agent: this.appAgent.myPubKey,
        chain_wallet_signature,
      },
    });
  }

  getSolanaWalletBindingMessage(solanaPublicKey: SolanaPublicKey) {
    const base58Address = solanaPublicKey.toBase58();
    const agentB64 = encodeHashToBase64(this.appAgent.myPubKey);
    return `Bind wallet ${base58Address} to Holochain public key ${agentB64}`;
  }

  async submitSolanaWalletBinding(
    solanaPublicKey: SolanaPublicKey,
    solanaSignature: Uint8Array
  ) {
    const chain_wallet_signature: ChainWalletSignature_Solana = {
      Solana: {
        solana_address: solanaPublicKey.toBytes(),
        solana_signature: Array.from(solanaSignature),
      },
    };
    await this.appAgent.callZome({
      role_name: "game_identity",
      zome_name: "username_registry",
      fn_name: "create_wallet_attestation",
      payload: {
        agent: this.appAgent.myPubKey,
        chain_wallet_signature,
      },
    });
  }

  async getBoundWallets(): Promise<BoundWallet[]> {
    const records: Record[] = await this.appAgent.callZome({
      role_name: "game_identity",
      zome_name: "username_registry",
      fn_name: "get_wallet_attestations_for_agent",
      payload: this.appAgent.myPubKey,
    });

    return records.map((record) => {
      const entry = decodeAppEntry<WalletAttestation>(record);
      if ("Evm" in entry.chain_wallet_signature) {
        const { evm_address } = entry.chain_wallet_signature.Evm;
        const checksummedAddress = checksumCaseAddress(bytesToHex(evm_address));
        return { type: "evm", checksummedAddress };
      } else {
        const { solana_address } = entry.chain_wallet_signature.Solana;
        const base58Address = bs58.encode(solana_address);
        return { type: "solana", base58Address };
      }
    });
  }
}
