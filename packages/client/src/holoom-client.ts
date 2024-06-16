import type { AppAgentWebsocket, Record } from "@holochain/client";
import type { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import {
  BoundWallet,
  ChainWalletSignature_Evm,
  ChainWalletSignature_Solana,
  JqExecution,
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

export class HoloomClient {
  constructor(readonly appAgent: AppAgentWebsocket) {}

  async ping(): Promise<void> {
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "ping",
      fn_name: "ping",
      payload: null,
    });
  }

  async untilReady(interval = 1000, timeout = 30_000) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        await this.ping();
        return;
      } catch {
        await new Promise((r) => setTimeout(r, interval));
      }
    }
    throw new Error("HoloomClient.untilReady timed out");
  }
  /** 
   * usernames are verified for uniqueness by the authority agent
  */
  async getUsername(): Promise<string | null> {
    const record = await this.appAgent.callZome({
      role_name: "holoom",
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
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "sign_username_to_attest",
      payload: username,
    });
  }

  async setMetadata(name: string, value: string) {
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "update_metadata_item",
      payload: { agent_pubkey: this.appAgent.myPubKey, name, value },
    });
  }

  async getMetadata(name: string): Promise<string | null> {
    const value = await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "get_metadata_item_value",
      payload: { agent_pubkey: this.appAgent.myPubKey, name },
    });
    if (!value) return null;
    return value;
  }

  async getEvmWalletBindingMessage(evmAddress: Hex) {
    const message: string = await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "get_evm_wallet_binding_message",
      payload: hexToBytes(evmAddress),
    });
    return message;
  }

  async submitEvmWalletBinding(evmAddress: Hex, evmSignature: Hex) {
    const chain_wallet_signature: ChainWalletSignature_Evm = {
      Evm: {
        evm_address: hexToBytes(evmAddress),
        evm_signature: formatEvmSignature(evmSignature),
      },
    };
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "attest_wallet_signature",
      payload: chain_wallet_signature,
    });
  }

  async getSolanaWalletBindingMessage(solanaPublicKey: SolanaPublicKey) {
    const message: string = await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "get_solana_wallet_binding_message",
      payload: solanaPublicKey.toBytes(),
    });
    return message;
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
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "attest_wallet_signature",
      payload: chain_wallet_signature,
    });
  }

  async getBoundWallets(): Promise<BoundWallet[]> {
    const records: Record[] = await this.appAgent.callZome({
      role_name: "holoom",
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

  async refreshJq(arg: {
    program: string;
    input: { collection: string };
  }): Promise<unknown> {
    const record: Record = await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "refresh_jq_execution_for_named_relation",
      payload: { program: arg.program, relation_name: arg.input.collection },
    });
    return JSON.parse(decodeAppEntry<JqExecution>(record).output);
  }
}
