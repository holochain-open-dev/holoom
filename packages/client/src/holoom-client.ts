import type { AppAgentWebsocket, Record } from "@holochain/client";
import type { PublicKey as SolanaPublicKey } from "@solana/web3.js";
import {
  ChainWalletSignature,
  ExecuteRecipePayload,
  JqExecution,
  Recipe,
  RecipeExecution,
  UsernameAttestation,
  WalletAttestation,
} from "@holoom/types";
import { BoundWallet } from "./types";
import { decodeAppEntry, formatEvmSignature } from "./utils";
import {
  getAddress as checksumCaseAddress,
  bytesToHex,
  hexToBytes,
  Hex,
} from "viem";
import bs58 from "bs58";

/**
 * This client is intended to be the primary and most convenient method of
 * interaction for apps built on the holoom platform. It provides tools for:
 * - Username registration and attestation with an authority
 * - Management of a metadata for an agent
 * - Binding Solana and Ethereum wallets to the user's AgentPubKey
 */
export class HoloomClient {
  constructor(readonly appAgent: AppAgentWebsocket) {}

  /** @ignore */
  private async ping(): Promise<void> {
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "ping",
      fn_name: "ping",
      payload: null,
    });
  }

  /**
   * Returns a promise that resolves once the holoom happ is loaded and ready
   * to use.
   */
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
   * Returns the user's username if they have registered one.
   *
   * Returning `null` doesn't guarantee that the user has never registered, as
   * this can also happen if the holochain conductor hasn't yet received gossip
   * of an existing registration - this is likely to happen when switching
   * hosts on the holo network.
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

  /**
   * Submits a username for registration.
   *
   * The user's conductor will sign the username and submit it to the authority
   * agent, which checks the signature and attests the username's uniqueness.
   */
  async registerUsername(username: string) {
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "sign_username_to_attest",
      payload: username,
    });
  }

  /**
   * Sets a value for an item in the user's metadata key-value store.
   *
   * Each user has a public freeform (i.e. without specific validation)
   * string-to-string K-V store, where K-V pairs are encoded into link tags
   * on the agent in question.
   */
  async setMetadata(name: string, value: string) {
    await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "update_metadata_item",
      payload: { agent_pubkey: this.appAgent.myPubKey, name, value },
    });
  }

  /**
   * Retrieves the latest value (if any) of an item in the user's metadata K-V
   * store.
   *
   * It is possible for this value to be stale (or `null`) if the agent's
   * conductor hasn't received gossip of the latest information - this is
   * likely to happen when switching hosts on the holo network.
   */
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

  /**
   * Retrieves a message to be signed by the specified EVM wallet in order to
   * bind it to the user's agent.
   *
   * This signing message includes the agent's chain head and thus becomes
   * stale if the user performs another action that progresses their chain
   * before first submitting their binding signature.
   */
  async getEvmWalletBindingMessage(evmAddress: Hex) {
    const message: string = await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "get_evm_wallet_binding_message",
      payload: hexToBytes(evmAddress),
    });
    return message;
  }

  /**
   * Creates a verifiable entry that shows that the user has control over the
   * specified EVM wallet.
   *
   * The provided signature must be over the current binding message - see
   * `getEvmWalletBindingMessage`.
   */
  async submitEvmWalletBinding(evmAddress: Hex, evmSignature: Hex) {
    const chain_wallet_signature: ChainWalletSignature = {
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

  /**
   * Retrieves a message to be signed by the specified Solana wallet in order
   * to bind it to the user's agent.
   *
   * This signing message includes the agent's chain head and thus becomes
   * stale if the user performs another action that progresses their chain
   * before first submitting their binding signature.
   */
  async getSolanaWalletBindingMessage(solanaPublicKey: SolanaPublicKey) {
    const message: string = await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "get_solana_wallet_binding_message",
      payload: solanaPublicKey.toBytes(),
    });
    return message;
  }

  /**
   * Creates a verifiable entry that shows that the user has control over the
   * specified Solana wallet.
   *
   * The provided signature must be over the current binding message - see
   * `getSolanaWalletBindingMessage`.
   */
  async submitSolanaWalletBinding(
    solanaPublicKey: SolanaPublicKey,
    solanaSignature: Uint8Array
  ) {
    const chain_wallet_signature: ChainWalletSignature = {
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

  /**
   * Retrieves an array of all EVM and Solana addresses under the user's control.
   *
   * It is possible for this information to be stale if the agent's conductor
   * hasn't received gossip of the latest information - this is likely to
   * happen when switching hosts on the holo network.
   */
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

  /** @ignore */
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

  async createRecipe(recipe: Recipe): Promise<Record> {
    const record: Record = await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "create_recipe",
      payload: recipe,
    });
    return record;
  }

  async executeRecipe(payload: ExecuteRecipePayload): Promise<unknown> {
    const record: Record = await this.appAgent.callZome({
      role_name: "holoom",
      zome_name: "username_registry",
      fn_name: "create_recipe",
      payload,
    });
    return decodeAppEntry<RecipeExecution>(record).output;
  }
}
